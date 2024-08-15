const Joi = require('@hapi/joi');
const albumsService = require('../services/albums');
const albumsValidation = require('../validators/albums');

const albumsPlugin = {
  name: 'albums',
  version: '1.0.0',
  register: async (server) => {
    server.route([
      {
        method: 'POST',
        path: '/albums',
        handler: albumsService.createAlbum,
        options: {
          validate: {
            payload: albumsValidation.createAlbumSchema,
            failAction: (request, h, err) => {
              throw err;
            },
          },
        },
      },
      {
        method: 'GET',
        path: '/albums/{id}',
        handler: albumsService.getAlbumById,
      },
      {
        method: 'PUT',
        path: '/albums/{id}',
        handler: albumsService.updateAlbum,
        options: {
          validate: {
            payload: albumsValidation.updateAlbumSchema,
            failAction: (request, h, err) => {
              throw err;
            },
          },
        },
      },
      {
        method: 'DELETE',
        path: '/albums/{id}',
        handler: albumsService.deleteAlbum,
      },
    ]);
  },
};

module.exports = albumsPlugin;
