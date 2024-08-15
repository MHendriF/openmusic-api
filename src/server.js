const Hapi = require('@hapi/hapi');

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

  server.route(booksRoutes);

  await server.start();
};

process.on('unhandledRejection', () => {
  process.exit(1);
});

init();
