const playlistsService = require('../services/playlists');
const playlistsValidation = require('../validators/playlists');

const playlistsPlugin = {
  name: 'playlists',
  version: '1.0.0',
  register: async (server) => {
    server.route([
      {
        method: 'POST',
        path: '/playlists',
        handler: playlistsService.createPlaylist,
        options: {
          auth: 'jwt_access',
          validate: {
            payload: playlistsValidation.createPlaylistSchema,
            failAction: (request, h, err) => {
              throw err;
            },
          },
        },
      },
      {
        method: 'GET',
        path: '/playlists',
        handler: playlistsService.getPlaylists,
        options: {
          auth: 'jwt_access',
        },
      },
      {
        method: 'DELETE',
        path: '/playlists/{id}',
        handler: playlistsService.deletePlaylist, // Add this line
        options: {
          auth: 'jwt_access',
        },
      },
      {
        method: 'POST',
        path: '/playlists/{id}/songs',
        handler: playlistsService.addSongToPlaylist,
        options: {
          auth: 'jwt_access',
          validate: {
            payload: playlistsValidation.addSongToPlaylistSchema,
            failAction: (request, h, err) => {
              throw err;
            },
          },
        },
      },
      {
        method: 'GET',
        path: '/playlists/{id}/songs',
        handler: playlistsService.getSongsFromPlaylist,
        options: {
          auth: 'jwt_access',
        },
      },
      {
        method: 'DELETE',
        path: '/playlists/{id}/songs',
        handler: playlistsService.deleteSongFromPlaylist,
        options: {
          auth: 'jwt_access',
          validate: {
            payload: playlistsValidation.deleteSongFromPlaylistSchema,
            failAction: (request, h, err) => {
              throw err;
            },
          },
        },
      },
      {
        method: 'GET',
        path: '/playlists/{id}/activities',
        handler: playlistsService.getPlaylistActivities,
        options: {
          auth: 'jwt_access',
        },
      },
    ]);
  },
};

module.exports = playlistsPlugin;
