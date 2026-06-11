// Placeholder server.js — full implementation lands in PR3 (Real-time Infrastructure).
// The current shape exists so the container can boot and pass health checks while
// the Laravel app is being built out. It only exposes a status endpoint on the
// Socket.io port, which the sidecar will replace with the pub/sub bridge.

const http = require('http');

const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
    if (req.url === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ok', service: 'socketio-sidecar' }));
        return;
    }

    res.writeHead(503, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'not_implemented', pr: 3 }));
});

server.listen(PORT, () => {
    console.log(`socketio sidecar listening on :${PORT}`);
});
