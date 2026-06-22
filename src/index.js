const app = require('./app');

const APP_NAME = 'thing-server';
const APP_VERSION = require("./../package").version;
const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => console.log(`${APP_NAME}:${APP_VERSION} - listening on port ${PORT}!`));

// Graceful shutdown: stop accepting connections and exit once in-flight
// requests have drained.
function shutdown(signal) {
    console.log(`\n${signal} signal received: closing HTTP server`);
    server.close(() => {
        console.log('HTTP server closed');
        process.exit(0);
    });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
