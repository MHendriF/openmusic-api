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
    console.log('🚀 ~ createPlaylist ~ error:', error.message);
    return errorResponse(h, {
      message: 'An internal server error occurred',
      status: 'error',
      statusCode: 500,
    });
  }
};

const getPlaylists = async (request, h) => {
  const { userId } = request.auth.credentials;
  const query = `
    SELECT p.id, p.name, u.username
    FROM playlists p
    LEFT JOIN users u ON p.owner = u.id
    WHERE p.owner = $1 OR p.id IN (
      SELECT playlist_id FROM collaborations WHERE user_id = $1
    )
  `;
  try {
    const result = await pool.query(query, [userId]);

    const playlists = result.rows.map((row) => ({
      id: row.id,
      name: row.name,
      username: row.username,
    }));

    return successResponse(h, {
      data: {
        playlists,
      },
      status: 'success',
      statusCode: 200,
    });
  } catch (error) {
    console.log('🚀 ~ getPlaylists ~ error:', error.message);
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
    console.log('🚀 ~ addSongToPlaylist ~ playlist:', playlist);
    const isOwner = playlist.owner === userId;
    console.log('🚀 ~ addSongToPlaylist ~ isOwner:', isOwner);
    const isCollaborator = await isUserCollaborator(playlistId, userId);
    console.log('🚀 ~ addSongToPlaylist ~ isCollaborator:', isCollaborator);

    if (!isOwner && !isCollaborator) {
      return errorResponse(h, {
        message: 'You do not have permission to access this playlist',
        status: 'fail',
        statusCode: 403,
      });
    }

    const checkSongQuery = 'SELECT * FROM songs WHERE id = $1';
    const songResult = await pool.query(checkSongQuery, [songId]);
    console.log('🚀 ~ addSongToPlaylist ~ songResult:', songResult.rows[0]);

    if (songResult.rows.length === 0) {
      return errorResponse(h, {
        message: 'Song not found',
        status: 'fail',
        statusCode: 404,
      });
    }

    const id = `playlist-song-${nanoid(16)}`;
    const insertSongQuery =
      'INSERT INTO playlist_songs (id, playlist_id, song_id) VALUES ($1, $2, $3)';
    await pool.query(insertSongQuery, [id, playlistId, songId]);

    await logPlaylistActivity(playlistId, userId, songId, 'add');

    return successResponse(h, {
      message: 'Song added to playlist successfully',
      status: 'success',
      statusCode: 201,
    });
  } catch (error) {
    console.log('🚀 ~ addSongToPlaylist ~ error:', error.message);
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
    const checkPlaylistQuery = `
      SELECT p.*, u.username AS owner_username
      FROM playlists p
      JOIN users u ON p.owner = u.id
      WHERE p.id = $1
    `;
    const playlistResult = await pool.query(checkPlaylistQuery, [playlistId]);

    if (playlistResult.rows.length === 0) {
      return errorResponse(h, {
        message: 'Playlist not found',
        status: 'fail',
        statusCode: 404,
      });
    }

    const playlist = playlistResult.rows[0];
    console.log('🚀 ~ getSongsFromPlaylist ~ playlist:', playlist);
    const isOwner = playlist.owner === userId;
    const isCollaborator = await isUserCollaborator(playlistId, userId);

    if (!isOwner && !isCollaborator) {
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

    console.log('🚀 ~ getSongsFromPlaylist ~ playlist.owner:', playlist.owner);

    return successResponse(h, {
      data: {
        playlist: {
          id: playlist.id,
          name: playlist.name,
          username: playlist.owner_username,
          songs: songsResult.rows,
        },
      },
      status: 'success',
      statusCode: 200,
    });
  } catch (error) {
    console.log('🚀 ~ getSongsFromPlaylist ~ error:', error.message);
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
    console.log(
      '🚀 ~ deleteSongFromPlaylist ~ playlistResult:',
      playlistResult
    );

    if (playlistResult.rows.length === 0) {
      return errorResponse(h, {
        message: 'Playlist not found',
        status: 'fail',
        statusCode: 404,
      });
    }

    const playlist = playlistResult.rows[0];
    console.log('🚀 ~ deleteSongFromPlaylist ~ playlist:', playlist);
    const isOwner = playlist.owner === userId;
    const isCollaborator = await isUserCollaborator(playlistId, userId);

    if (!isOwner && !isCollaborator) {
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

    await logPlaylistActivity(playlistId, userId, songId, 'delete');

    return successResponse(h, {
      message: 'Song deleted from playlist successfully',
      status: 'success',
      statusCode: 200,
    });
  } catch (error) {
    console.log('🚀 ~ deleteSongFromPlaylist ~ error:', error.message);
    return errorResponse(h, {
      message: 'An internal server error occurred',
      status: 'error',
      statusCode: 500,
    });
  }
};

const getPlaylistActivities = async (request, h) => {
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
    const isOwner = playlist.owner === userId;
    const isCollaborator = await isUserCollaborator(playlistId, userId);

    if (!isOwner && !isCollaborator) {
      return errorResponse(h, {
        message: 'You do not have permission to access this playlist',
        status: 'fail',
        statusCode: 403,
      });
    }

    const activitiesQuery = `
      SELECT u.username, s.title, pa.action, pa.time
      FROM playlist_song_activities pa
      JOIN users u ON pa.user_id = u.id
      JOIN songs s ON pa.song_id = s.id
      WHERE pa.playlist_id = $1
      ORDER BY pa.time
    `;
    const activitiesResult = await pool.query(activitiesQuery, [playlistId]);

    return successResponse(h, {
      data: {
        playlistId: playlistId,
        activities: activitiesResult.rows,
      },
      status: 'success',
      statusCode: 200,
    });
  } catch (error) {
    console.log('🚀 ~ getPlaylistActivities ~ error:', error.message);
    return errorResponse(h, {
      message: 'An internal server error occurred',
      status: 'error',
      statusCode: 500,
    });
  }
};

const deletePlaylist = async (request, h) => {
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
        message: 'You do not have permission to delete this playlist',
        status: 'fail',
        statusCode: 403,
      });
    }

    const deletePlaylistQuery = 'DELETE FROM playlists WHERE id = $1';
    await pool.query(deletePlaylistQuery, [playlistId]);

    return successResponse(h, {
      message: 'Playlist deleted successfully',
      status: 'success',
      statusCode: 200,
    });
  } catch (error) {
    console.log('🚀 ~ deletePlaylist ~ error:', error.message);
    return errorResponse(h, {
      message: 'An internal server error occurred',
      status: 'error',
      statusCode: 500,
    });
  }
};

const isUserCollaborator = async (playlistId, userId) => {
  const query =
    'SELECT * FROM collaborations WHERE playlist_id = $1 AND user_id = $2';
  const result = await pool.query(query, [playlistId, userId]);
  return result.rows.length > 0;
};

const logPlaylistActivity = async (playlistId, userId, songId, action) => {
  const id = `playlist-activity-${nanoid(16)}`;
  const query =
    'INSERT INTO playlist_song_activities (id, playlist_id, user_id, song_id, action) VALUES ($1, $2, $3, $4, $5)';
  await pool.query(query, [id, playlistId, userId, songId, action]);
};

module.exports = {
  createPlaylist,
  getPlaylists,
  deletePlaylist,
  addSongToPlaylist,
  getSongsFromPlaylist,
  deleteSongFromPlaylist,
  getPlaylistActivities,
};
