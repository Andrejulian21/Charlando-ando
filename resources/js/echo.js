// Thin Socket.io client wrapper for the React app.
//
// Responsibilities:
//   - Lazily open a single Socket.io connection authenticated with the JWT
//     stored in `localStorage` under `auth_token` (issued by the Laravel
//     API after OAuth or login).
//   - Expose `subscribe(channel, event, callback)` and `unsubscribe(channel)`
//     helpers that handle ack callbacks, dedupe registrations, and replay
//     subscriptions on reconnect.
//   - Expose the raw `socket` instance for callers that need direct access
//     (e.g. emitting `status:set` or `activity`).
//
// This module is intentionally framework-agnostic. Components and stores
// import `subscribe` / `unsubscribe`; the underlying socket is shared so we
// never open more than one connection per browser tab.

import { io } from 'socket.io-client';

const TOKEN_STORAGE_KEY = 'auth_token';
const ROOM_PATTERN = /^(channel|dm):\d+$/;

let socket = null;

// room -> { event -> Set<callback> } so the same callback is only registered
// once per (room, event) pair even if multiple components subscribe.
const subscriptions = new Map();
const pendingSubscribes = new Set();

function getSocketUrl() {
    if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SOCKETIO_URL) {
        return import.meta.env.VITE_SOCKETIO_URL;
    }
    if (typeof window !== 'undefined' && window.SOCKETIO_URL) {
        return window.SOCKETIO_URL;
    }
    return 'http://localhost:3000';
}

function getToken() {
    if (typeof window === 'undefined') return null;
    try {
        return window.localStorage.getItem(TOKEN_STORAGE_KEY);
    } catch {
        return null;
    }
}

function ensureSocket() {
    if (socket) return socket;

    const token = getToken();
    socket = io(getSocketUrl(), {
        auth: token ? { token } : {},
        autoConnect: false,
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1_000,
        reconnectionDelayMax: 10_000,
    });

    socket.on('connect', () => {
        // Replay any active subscriptions after a (re)connect so the user does
        // not silently miss messages while offline.
        for (const room of subscriptions.keys()) {
            emitSubscribe(room);
        }
    });

    socket.on('disconnect', (reason) => {
        // Default Socket.io behaviour reconnects automatically. We only log
        // for visibility in dev.
        if (typeof console !== 'undefined') {
            console.debug('[echo] disconnected:', reason);
        }
    });

    return socket;
}

function emitSubscribe(room) {
    if (!socket?.connected) return;
    socket.emit('subscribe', { room }, (ack) => {
        if (ack?.ok) {
            pendingSubscribes.delete(room);
        }
    });
    pendingSubscribes.add(room);
}

function emitUnsubscribe(room) {
    if (!socket?.connected) return;
    socket.emit('unsubscribe', { room });
}

/**
 * Connect to the sidecar if not already. Idempotent — safe to call from
 * multiple components. Returns the underlying socket.
 */
export function connect() {
    const s = ensureSocket();
    if (!s.connected && !s.active) {
        s.connect();
    }
    return s;
}

/**
 * Disconnect and tear down. Used on logout so we do not leak the connection.
 */
export function disconnect() {
    if (!socket) return;
    socket.disconnect();
    socket = null;
    subscriptions.clear();
    pendingSubscribes.clear();
}

/**
 * Subscribe to an event on a room. Returns an unsubscribe function.
 *
 * @param {string} room  "channel:42" or "dm:7"
 * @param {string} event server-emitted event name (e.g. "message:new")
 * @param {(payload: unknown) => void} callback
 */
export function subscribe(room, event, callback) {
    if (typeof room !== 'string' || !ROOM_PATTERN.test(room)) {
        throw new Error(`[echo] invalid room: ${room}`);
    }
    if (typeof event !== 'string' || event.length === 0) {
        throw new Error('[echo] event must be a non-empty string');
    }
    if (typeof callback !== 'function') {
        throw new Error('[echo] callback must be a function');
    }

    const s = connect();

    let bucket = subscriptions.get(room);
    if (!bucket) {
        bucket = new Map();
        subscriptions.set(room, bucket);
    }
    let callbacks = bucket.get(event);
    if (!callbacks) {
        callbacks = new Set();
        bucket.set(event, callbacks);

        // First subscriber for this (room, event) -> attach the Socket.io
        // listener exactly once.
        s.on(event, (payload) => {
            for (const cb of callbacks) {
                try {
                    cb(payload);
                } catch (err) {
                    console.error(`[echo] subscriber for ${room}/${event} threw:`, err);
                }
            }
        });

        // Tell the server we want this room (no-op if already joined).
        emitSubscribe(room);
    }

    callbacks.add(callback);

    return () => unsubscribe(room, event, callback);
}

/**
 * Remove a single (room, event, callback) registration. When the last
 * callback for an event is removed we also drop the Socket.io listener and
 * tell the server we are no longer interested in the room.
 */
export function unsubscribe(room, event, callback) {
    const bucket = subscriptions.get(room);
    if (!bucket) return;
    const callbacks = bucket.get(event);
    if (!callbacks) return;

    callbacks.delete(callback);

    if (callbacks.size === 0) {
        bucket.delete(event);
        if (bucket.size === 0) {
            subscriptions.delete(room);
            emitUnsubscribe(room);
        }
        socket?.off(event);
    }
}

/**
 * Drop every subscription for a room. Useful when navigating away from a
 * chat view.
 */
export function leaveRoom(room) {
    const bucket = subscriptions.get(room);
    if (!bucket) return;
    for (const event of bucket.keys()) {
        socket?.off(event);
    }
    subscriptions.delete(room);
    emitUnsubscribe(room);
}

/**
 * Tell the sidecar the user changed their presence status. The server
 * validates the value; unknown values are rejected.
 */
export function setStatus(status) {
    socket?.emit('status:set', { status });
}

/**
 * Activity ping — resets the server-side idle timer.
 */
export function pingActivity() {
    socket?.emit('activity');
}

export { socket };
export default {
    connect,
    disconnect,
    subscribe,
    unsubscribe,
    leaveRoom,
    setStatus,
    pingActivity,
    socket,
};
