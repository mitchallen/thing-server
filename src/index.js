const app = require('./app');

const APP_NAME = 'thing-server';
const APP_VERSION = require("./../package").version;
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => console.log(`${APP_NAME}:${APP_VERSION} - listening on port ${PORT}!`));
