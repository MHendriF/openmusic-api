const Hapi = require('@hapi/hapi');
const Jwt = require('@hapi/jwt');
const albumsPlugin = require('./plugins/albums');
const songsPlugin = require('./plugins/songs');
const usersPlugin = require('./plugins/auth');
const playlistsPlugin = require('./plugins/playlists');
const collaborationsPlugin = require('./plugins/collaborations');
const { logger } = require('./utils/logger');

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

  await server.register(Jwt);

  server.auth.strategy('jwt_access', 'jwt', {
    keys: process.env.ACCESS_TOKEN_KEY,
    verify: {
      aud: false,
      iss: false,
      sub: false,
      maxAgeSec: 3600, // 1 hour
    },
    validate: (artifacts) => ({
      isValid: true,
      credentials: { userId: artifacts.decoded.payload.userId },
    }),
  });

  server.auth.strategy('jwt_refresh', 'jwt', {
    keys: process.env.REFRESH_TOKEN_KEY,
    verify: {
      aud: false,
      iss: false,
      sub: false,
      maxAgeSec: 604800, // 7 days
    },
    validate: (artifacts) => ({
      isValid: true,
      credentials: { userId: artifacts.decoded.payload.userId },
    }),
  });

  await server.register([
    albumsPlugin,
    songsPlugin,
    usersPlugin,
    playlistsPlugin,
    collaborationsPlugin,
  ]);

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
  logger.info(`Server running on ${server.info.uri}`);
};

process.on('unhandledRejection', (err) => {
  logger.error(err);
  process.exit(1);
});

init();
