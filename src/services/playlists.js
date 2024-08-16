const { nanoid } = require('nanoid');
const pool = require('../database');
const { successResponse, errorResponse } = require('../utils/response');

const createPlaylist = async (request, h) => {
  const { name } = request.payload;
  const { userId } = request.auth.credentials;
  const id = `playlist-${nanoid(16)}`;

  const query =
    'INSERT INTO playlists (id, name, owner) VALUES ($1, $2, $3) RETURNING id';
  try {
    const result = await pool.query(query, [id, name, userId]);
    return successResponse(h, {
      data: {
        playlistId: result.rows[0].id,
      },
      status: 'success',
      statusCode: 201,
    });
  } catch (error) {
    return errorResponse(h, {
      message: 'An internal server error occurred',
      status: 'error',
      statusCode: 500,
    });
  }
};

const getPlaylists = async (request, h) => {
  const { userId } = request.auth.credentials;
  const query = 'SELECT id, name, owner FROM playlists WHERE owner = $1';
  try {
    const result = await pool.query(query, [userId]);

    const playlists = result.rows.map((row) => ({
      id: row.id,
      name: row.name,
      username: row.owner,
    }));

    return successResponse(h, {
      data: {
        playlists,
      },
      status: 'success',
      statusCode: 200,
    });
  } catch (error) {
    return errorResponse(h, {
      message: 'An internal server error occurred',
      status: 'error',
      statusCode: 500,
    });
  }
};

const addSongToPlaylist = async (request, h) => {
  const { id: playlistId } = request.params;
  const { songId } = request.payload;
  const { userId } = request.auth.credentials;

  try {
    const checkPlaylistQuery = 'SELECT * FROM playlists WHERE id = $1';
    const playlistResult = await pool.query(checkPlaylistQuery, [playlistId]);

    if (playlistResult.rows.length === 0) {
      return errorResponse(h, {
        message: 'Playlist not found',
        status: 'fail',
        statusCode: 404,
      });
    }

    const playlist = playlistResult.rows[0];
    if (playlist.owner !== userId) {
      return errorResponse(h, {
        message: 'You do not have permission to access this playlist',
        status: 'fail',
        statusCode: 403,
      });
    }

    const checkSongQuery = 'SELECT * FROM songs WHERE id = $1';
    const songResult = await pool.query(checkSongQuery, [songId]);

    if (songResult.rows.length === 0) {
      return errorResponse(h, {
        message: 'Song not found',
        status: 'fail',
        statusCode: 404,
      });
    }

    const insertSongQuery =
      'INSERT INTO playlist_songs (playlist_id, song_id) VALUES ($1, $2)';
    await pool.query(insertSongQuery, [playlistId, songId]);

    return successResponse(h, {
      message: 'Song added to playlist successfully',
      status: 'success',
      statusCode: 201,
    });
  } catch (error) {
    return errorResponse(h, {
      message: 'An internal server error occurred',
      status: 'error',
      statusCode: 500,
    });
  }
};

const getSongsFromPlaylist = async (request, h) => {
  const { id: playlistId } = request.params;
  const { userId } = request.auth.credentials;

  try {
    const checkPlaylistQuery = 'SELECT * FROM playlists WHERE id = $1';
    const playlistResult = await pool.query(checkPlaylistQuery, [playlistId]);

    if (playlistResult.rows.length === 0) {
      return errorResponse(h, {
        message: 'Playlist not found',
        status: 'fail',
        statusCode: 404,
      });
    }

    const playlist = playlistResult.rows[0];
    if (playlist.owner !== userId) {
      return errorResponse(h, {
        message: 'You do not have permission to access this playlist',
        status: 'fail',
        statusCode: 403,
      });
    }

    const songsQuery = `
      SELECT s.id, s.title, s.performer
      FROM songs s
      JOIN playlist_songs ps ON s.id = ps.song_id
      WHERE ps.playlist_id = $1
    `;
    const songsResult = await pool.query(songsQuery, [playlistId]);

    return successResponse(h, {
      data: {
        playlist: {
          id: playlist.id,
          name: playlist.name,
          username: playlist.owner,
          songs: songsResult.rows,
        },
      },
      status: 'success',
      statusCode: 200,
    });
  } catch (error) {
    return errorResponse(h, {
      message: 'An internal server error occurred',
      status: 'error',
      statusCode: 500,
    });
  }
};

const deleteSongFromPlaylist = async (request, h) => {
  const { id: playlistId } = request.params;
  const { songId } = request.payload;
  const { userId } = request.auth.credentials;

  try {
    const checkPlaylistQuery = 'SELECT * FROM playlists WHERE id = $1';
    const playlistResult = await pool.query(checkPlaylistQuery, [playlistId]);

    if (playlistResult.rows.length === 0) {
      return errorResponse(h, {
        message: 'Playlist not found',
        status: 'fail',
        statusCode: 404,
      });
    }

    const playlist = playlistResult.rows[0];
    if (playlist.owner !== userId) {
      return errorResponse(h, {
        message: 'You do not have permission to access this playlist',
        status: 'fail',
        statusCode: 403,
      });
    }

    const deleteSongQuery =
      'DELETE FROM playlist_songs WHERE playlist_id = $1 AND song_id = $2';
    const result = await pool.query(deleteSongQuery, [playlistId, songId]);

    if (result.rowCount === 0) {
      return errorResponse(h, {
        message: 'Song not found in the playlist',
        status: 'fail',
        statusCode: 404,
      });
    }

    return successResponse(h, {
      message: 'Song deleted from playlist successfully',
      status: 'success',
      statusCode: 200,
    });
  } catch (error) {
    return errorResponse(h, {
      message: 'An internal server error occurred',
      status: 'error',
      statusCode: 500,
    });
  }
};

module.exports = {
  createPlaylist,
  getPlaylists,
  addSongToPlaylist,
  getSongsFromPlaylist,
  deleteSongFromPlaylist,
};
