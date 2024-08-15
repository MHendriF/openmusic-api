const songsService = require('../services/songs');
const songsValidation = require('../validators/songs');

const songsPlugin = {
  name: 'songs',
  version: '1.0.0',
  register: async (server) => {
    server.route([
      {
        method: 'POST',
        path: '/songs',
        handler: songsService.createSong,
        options: {
          validate: {
            payload: songsValidation.createSongSchema,
            failAction: (request, h, err) => {
              throw err;
            },
          },
        },
      },
      {
        method: 'GET',
        path: '/songs/{id}',
        handler: songsService.getSongById,
      },
      {
        method: 'PUT',
        path: '/songs/{id}',
        handler: songsService.updateSong,
        options: {
          validate: {
            payload: songsValidation.updateSongSchema,
            failAction: (request, h, err) => {
              throw err;
            },
          },
        },
      },
      {
        method: 'DELETE',
        path: '/songs/{id}',
        handler: songsService.deleteSong,
      },
      {
        method: 'GET',
        path: '/songs',
        handler: songsService.searchSong,
      },
    ]);
  },
};

module.exports = songsPlugin;
