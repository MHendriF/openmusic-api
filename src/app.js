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

  server.route({
    method: 'GET',
    path: '/',
    handler: () => {
      return { message: 'Hello World' };
    },
  });

  server.ext('onPreResponse', (request, h) => {
    const { response } = request;
    if (response.isBoom) {
      const statusCode = response.output.statusCode;
      const message = response.output.payload.message;
      return h.response({ status: 'fail', message }).code(statusCode);
    }
    return h.continue;
  });

  await server.start();
  console.log(`Server running on ${server.info.uri}`);
};

process.on('unhandledRejection', (err) => {
  console.error(err);
  process.exit(1);
});

init();
