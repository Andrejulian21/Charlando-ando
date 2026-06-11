// Socket.io sidecar for charlando-ando.
//
// Responsibilities:
//   1. Expose a Socket.io endpoint that authenticates connections with the
//      HS256 JWT issued by the Laravel API (sub = user id, name = display name).
//   2. Bridge Laravel -> clients: subscribe to the Redis `events` channel and
//      fan out incoming payloads to the right Socket.io room.
//   3. Bridge clients -> Laravel: accept subscribe/unsubscribe for channel /
//      dm rooms so the client can opt into message streams.
//   4. Track presence in Redis with a TTL refreshed by a per-connection
//      heartbeat. Idle (5 min no activity) and DND / invisible are
//      client-driven; offline is the default on disconnect.
//
// The Laravel app publishes a JSON envelope to the `events` channel:
//   { "event": "message:new", "room": "channel:42", "data": { ... } }
// and the sidecar does `io.to(room).emit(event, data)`.

const http = require('http');
const { Server } = require('socket.io');
const Redis = require('ioredis');
const jwt = require('jsonwebtoken');

const PORT = Number(process.env.PORT) || 3000;
const REDIS_URL = process.env.REDIS_URL || 'redis://redis:6379';
const CORS_ORIGIN = process.env.SOCKETIO_CORS_ORIGIN || '*';
const HEARTBEAT_INTERVAL_MS = Number(process.env.SOCKETIO_HEARTBEAT_MS) || 15_000;
const PRESENCE_TTL_SECONDS = Number(process.env.SOCKETIO_PRESENCE_TTL_SEC) || 30;
const IDLE_TIMEOUT_MS = Number(process.env.SOCKETIO_IDLE_TIMEOUT_MS) || 5 * 60_000;
const VALID_STATUSES = new Set(['online', 'idle', 'dnd', 'invisible']);
const ROOM_PATTERN = /^(channel|dm):\d+$/;

// ---------------------------------------------------------------------------
// HTTP server: /health is the only public endpoint. Everything else is 404 so
// we never accidentally serve a management surface from this sidecar.
// ---------------------------------------------------------------------------
const server = http.createServer((req, res) => {
    if (req.url === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            status: 'ok',
            service: 'socketio-sidecar',
            uptime: Math.round(process.uptime()),
        }));
        return;
    }

    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'not_found' }));
});

// ---------------------------------------------------------------------------
// Socket.io
// ---------------------------------------------------------------------------
const io = new Server(server, {
    cors: { origin: CORS_ORIGIN, methods: ['GET', 'POST'] },
    pingInterval: HEARTBEAT_INTERVAL_MS,
    pingTimeout: HEARTBEAT_INTERVAL_MS * 2,
});

io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token || typeof token !== 'string') {
        return next(new Error('unauthorized: missing token'));
    }

    let payload;
    try {
        payload = jwt.verify(token, decodeJwtSecret(), { algorithms: ['HS256'] });
    } catch (err) {
        return next(new Error('unauthorized: ' + err.message));
    }

    const userId = Number.parseInt(payload.sub, 10);
    if (!Number.isFinite(userId) || userId <= 0) {
        return next(new Error('unauthorized: bad subject'));
    }

    socket.data.userId = userId;
    socket.data.name = payload.name ?? null;
    socket.data.status = 'online';
    return next();
});

// ---------------------------------------------------------------------------
// Redis: one publisher, one dedicated subscriber connection (subscribe mode
// forbids regular commands on the same connection).
// ---------------------------------------------------------------------------
const publisher = new Redis(REDIS_URL, { lazyConnect: false, maxRetriesPerRequest: 3 });
const subscriber = new Redis(REDIS_URL, { lazyConnect: false, maxRetriesPerRequest: 3 });

publisher.on('error', (err) => console.error('[redis pub] error:', err.message));
subscriber.on('error', (err) => console.error('[redis sub] error:', err.message));

subscriber.subscribe('events', (err, count) => {
    if (err) {
        console.error('[redis sub] failed to subscribe:', err.message);
        process.exit(1);
    }
    console.log(`[redis sub] listening on ${count} channel(s): events`);
});

subscriber.on('message', (channel, raw) => {
    if (channel !== 'events') return;

    let envelope;
    try {
        envelope = JSON.parse(raw);
    } catch (err) {
        console.warn('[redis sub] dropping non-JSON message');
        return;
    }

    const { event, room, data } = envelope;
    if (typeof event !== 'string' || typeof room !== 'string' || !ROOM_PATTERN.test(room)) {
        console.warn('[redis sub] dropping malformed envelope');
        return;
    }

    io.to(room).emit(event, data);
});

// ---------------------------------------------------------------------------
// Connection lifecycle
// ---------------------------------------------------------------------------
io.on('connection', (socket) => {
    const userId = socket.data.userId;
    const presenceKey = `presence:${userId}`;
    socket.join(`user:${userId}`);

    // Mark the user online and tell their other devices + the cross-instance
    // presence bus. The TTL is refreshed by the heartbeat below.
    publisher.setex(presenceKey, PRESENCE_TTL_SECONDS, socket.data.status);
    broadcastPresence(io, publisher, userId, socket.data.status);
    console.log(`[socket] user ${userId} connected`);

    const heartbeat = setInterval(() => {
        publisher.setex(presenceKey, PRESENCE_TTL_SECONDS, socket.data.status);
    }, HEARTBEAT_INTERVAL_MS);

    let idleTimer = armIdleTimer(socket, () => {
        if (socket.data.status === 'online') {
            socket.data.status = 'idle';
            publisher.setex(presenceKey, PRESENCE_TTL_SECONDS, 'idle');
            broadcastPresence(io, publisher, userId, 'idle');
        }
    });

    // --- subscribe / unsubscribe ------------------------------------------------
    socket.on('subscribe', (payload, ack) => {
        if (!payload || typeof payload.room !== 'string' || !ROOM_PATTERN.test(payload.room)) {
            return respond(ack, { ok: false, error: 'invalid_room' });
        }
        socket.join(payload.room);
        return respond(ack, { ok: true, room: payload.room });
    });

    socket.on('unsubscribe', (payload, ack) => {
        if (!payload || typeof payload.room !== 'string' || !ROOM_PATTERN.test(payload.room)) {
            return respond(ack, { ok: false, error: 'invalid_room' });
        }
        socket.leave(payload.room);
        return respond(ack, { ok: true, room: payload.room });
    });

    // --- status updates --------------------------------------------------------
    socket.on('status:set', (payload, ack) => {
        const status = payload?.status;
        if (typeof status !== 'string' || !VALID_STATUSES.has(status)) {
            return respond(ack, { ok: false, error: 'invalid_status' });
        }

        socket.data.status = status;
        if (status === 'invisible') {
            // Invisible users look offline to others but keep their WS connection.
            publisher.del(presenceKey);
        } else {
            publisher.setex(presenceKey, PRESENCE_TTL_SECONDS, status);
        }
        broadcastPresence(io, publisher, userId, status);
        return respond(ack, { ok: true, status });
    });

    // --- activity ping (resets idle timer) -------------------------------------
    socket.on('activity', () => {
        clearTimeout(idleTimer);
        if (socket.data.status === 'online') {
            publisher.setex(presenceKey, PRESENCE_TTL_SECONDS, 'online');
        }
        idleTimer = armIdleTimer(socket, () => {
            if (socket.data.status === 'online') {
                socket.data.status = 'idle';
                publisher.setex(presenceKey, PRESENCE_TTL_SECONDS, 'idle');
                broadcastPresence(io, publisher, userId, 'idle');
            }
        });
    });

    // --- disconnect ------------------------------------------------------------
    socket.on('disconnect', (reason) => {
        clearInterval(heartbeat);
        clearTimeout(idleTimer);
        publisher.del(presenceKey);
        broadcastPresence(io, publisher, userId, 'offline');
        console.log(`[socket] user ${userId} disconnected (${reason})`);
    });
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function decodeJwtSecret() {
    const raw = process.env.JWT_SECRET;
    if (!raw) {
        throw new Error('JWT_SECRET env var is required');
    }
    if (raw.startsWith('base64:')) {
        return Buffer.from(raw.slice(7), 'base64');
    }
    return raw;
}

function respond(ack, payload) {
    if (typeof ack === 'function') {
        try {
            ack(payload);
        } catch (err) {
            console.warn('[socket] ack threw:', err.message);
        }
    }
}

function armIdleTimer(socket, fn) {
    return setTimeout(fn, IDLE_TIMEOUT_MS);
}

function broadcastPresence(io, redis, userId, status) {
    // Local fan-out: the user's other tabs/devices update immediately.
    io.to(`user:${userId}`).emit('presence:update', { userId, status, at: Date.now() });
    // Cross-instance fan-out so any sidecar holding shared rooms can forward
    // the change to channel / DM participants.
    redis.publish('presence', JSON.stringify({ userId, status, at: Date.now() }));
}

// ---------------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------------
server.listen(PORT, () => {
    console.log(`[socketio] sidecar listening on :${PORT}`);
});

const shutdown = (signal) => {
    console.log(`[socketio] received ${signal}, shutting down`);
    io.close();
    server.close(() => {
        publisher.quit().catch(() => {});
        subscriber.quit().catch(() => {});
        process.exit(0);
    });
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
