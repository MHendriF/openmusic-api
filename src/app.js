const Hapi = require('@hapi/hapi');
const albumsPlugin = require('./plugins/albums');
const songsPlugin = require('./plugins/songs');

const init = async () => {
  const server = Hapi.server({
    port: process.env.PORT,
    host: process.env.HOST,
    routes: {
      cors: {
        origin: ['*'],
      },
    },
  });

  await server.register([albumsPlugin, songsPlugin]);

  server.ext('onPreResponse', (request, h) => {
    const { response } = request;
    if (response.isBoom) {
      const {
        statusCode,
        payload: { message },
      } = response.output;
      return h.response({ status: 'fail', message }).code(statusCode);
    }
    return h.continue;
  });

  await server.start();
};

process.on('unhandledRejection', () => {
  process.exit(1);
});

init();
