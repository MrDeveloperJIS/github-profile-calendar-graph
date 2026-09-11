// A tiny, dependency-free local server for previewing api/calendar.js without
// installing the Vercel CLI. Vercel's real runtime adds a few conveniences on
// top of plain Node (`req.query`, `res.status().send()`) — this file adds
// just enough of that shim to run the same handler locally.
//
// Usage:
//   1. cp .env.example .env   (then fill in GH_TOKEN and USERNAMES)
//   2. node dev-server.js
//   3. open http://localhost:9000/api/calendar?user=YOUR_USERNAME

const http = require('http');
const { URL } = require('url');
const path = require('path');
const fs = require('fs');

function loadEnvFile() {
    const envPath = path.join(__dirname, '.env');
    if (!fs.existsSync(envPath)) return;
    fs.readFileSync(envPath, 'utf8')
        .split('\n')
        .forEach((line) => {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('#')) return;
            const eq = trimmed.indexOf('=');
            if (eq === -1) return;
            const key = trimmed.slice(0, eq).trim();
            const value = trimmed.slice(eq + 1).trim();
            if (!(key in process.env)) process.env[key] = value;
        });
}

loadEnvFile();

const calendarHandler = require('./api/calendar');

const PORT = process.env.PORT || 9000;

const server = http.createServer(async (req, res) => {
    const parsedUrl = new URL(req.url, `http://localhost:${PORT}`);

    // Shim the pieces of the Vercel request/response objects this project uses.
    req.query = Object.fromEntries(parsedUrl.searchParams.entries());
    res.status = function status(code) {
        res.statusCode = code;
        return res;
    };
    res.send = function send(body) {
        res.end(body);
        return res;
    };

    if (parsedUrl.pathname === '/api/calendar') {
        try {
            await calendarHandler(req, res);
        } catch (err) {
            res.status(500).send(`Internal error: ${err.message}`);
        }
        return;
    }

    res.status(404).send('Not found. Try /api/calendar?user=YOUR_USERNAME');
});

server.listen(PORT, () => {
    console.log(`Dev server running: http://localhost:${PORT}/api/calendar?user=YOUR_USERNAME`);
    if (!process.env.GH_TOKEN) {
        console.warn('Warning: GH_TOKEN is not set. Copy .env.example to .env and fill it in.');
    }
    if (!process.env.USERNAMES) {
        console.warn('Warning: USERNAMES is not set. Copy .env.example to .env and fill it in.');
    }
});