import { createApp } from './app';

const APP_NAME = process.env.APP_NAME || 'thing-server';
const APP_VERSION = require("./../package").version;
const PORT = process.env.PORT || 3000;

const app = createApp();

// Startup banner. Lives here rather than in the router so it prints once, when
// a server actually starts, and reflects the resolved BASE_PATH.
const { basePath, explorerPath, label, path } = app.locals.config;
console.log("vvv --- EXAMPLES --- vvv");
console.log(`curl http://localhost:${PORT}${basePath}`);
console.log(`curl http://localhost:${PORT}${path}`);
console.log(`curl http://localhost:${PORT}${path}/${label}`);
console.log(`curl http://localhost:${PORT}${path}/${label}/count`);
console.log(`curl http://localhost:${PORT}${path}/${label}/1`);
console.log(`explorer: http://localhost:${PORT}${explorerPath}`);
console.log("^^ --- ^^^^^^^^ --- ^^^");

const server = app.listen(PORT, () => console.log(`${APP_NAME}:${APP_VERSION} - listening on port ${PORT}!`));

// Graceful shutdown: stop accepting connections and exit once in-flight
// requests have drained.
function shutdown(signal: string) {
    console.log(`\n${signal} signal received: closing HTTP server`);
    server.close(() => {
        console.log('HTTP server closed');
        process.exit(0);
    });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
