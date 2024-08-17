const { nanoid } = require('nanoid');
const pool = require('../database');
const {
  notFoundResponse,
  forbiddenResponse,
  internalServerErrorResponse,
  okResponseWithData,
  okResponse,
  createdResponseWithData,
  createdResponse,
} = require('../utils/response');

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

const createPlaylist = async (request, h) => {
  const { name } = request.payload;
  const { userId } = request.auth.credentials;
  const id = `playlist-${nanoid(16)}`;

  const query =
    'INSERT INTO playlists (id, name, owner) VALUES ($1, $2, $3) RETURNING id';
  try {
    const result = await pool.query(query, [id, name, userId]);
    return createdResponseWithData(h, {
      data: { playlistId: result.rows[0].id },
    });
  } catch (error) {
    return internalServerErrorResponse(h, 'An internal server error occurred');
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

    return okResponseWithData(h, {
      data: { playlists },
    });
  } catch (error) {
    return internalServerErrorResponse(h, 'An internal server error occurred');
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
      return notFoundResponse(h, 'Playlist not found');
    }

    const playlist = playlistResult.rows[0];
    const isOwner = playlist.owner === userId;
    const isCollaborator = await isUserCollaborator(playlistId, userId);

    if (!isOwner && !isCollaborator) {
      return forbiddenResponse(
        h,
        'You do not have permission to access this playlist'
      );
    }

    const checkSongQuery = 'SELECT * FROM songs WHERE id = $1';
    const songResult = await pool.query(checkSongQuery, [songId]);
    if (songResult.rows.length === 0) {
      return notFoundResponse(h, 'Song not found');
    }

    const id = `playlist-song-${nanoid(16)}`;
    const insertSongQuery =
      'INSERT INTO playlist_songs (id, playlist_id, song_id) VALUES ($1, $2, $3)';
    await pool.query(insertSongQuery, [id, playlistId, songId]);

    await logPlaylistActivity(playlistId, userId, songId, 'add');

    return createdResponse(h, 'Song added to playlist successfully');
  } catch (error) {
    return internalServerErrorResponse(h, 'An internal server error occurred');
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
      return notFoundResponse(h, 'Playlist not found');
    }

    const playlist = playlistResult.rows[0];
    const isOwner = playlist.owner === userId;
    const isCollaborator = await isUserCollaborator(playlistId, userId);

    if (!isOwner && !isCollaborator) {
      return forbiddenResponse(
        h,
        'You do not have permission to access this playlist'
      );
    }

    const songsQuery = `
      SELECT s.id, s.title, s.performer
      FROM songs s
      JOIN playlist_songs ps ON s.id = ps.song_id
      WHERE ps.playlist_id = $1
    `;
    const songsResult = await pool.query(songsQuery, [playlistId]);

    return okResponseWithData(h, {
      data: {
        playlist: {
          id: playlist.id,
          name: playlist.name,
          username: playlist.owner_username,
          songs: songsResult.rows,
        },
      },
    });
  } catch (error) {
    return internalServerErrorResponse(h, 'An internal server error occurred');
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
      return notFoundResponse(h, 'Playlist not found');
    }

    const playlist = playlistResult.rows[0];
    const isOwner = playlist.owner === userId;
    const isCollaborator = await isUserCollaborator(playlistId, userId);

    if (!isOwner && !isCollaborator) {
      return forbiddenResponse(
        h,
        'You do not have permission to access this playlist'
      );
    }

    const deleteSongQuery =
      'DELETE FROM playlist_songs WHERE playlist_id = $1 AND song_id = $2';
    const result = await pool.query(deleteSongQuery, [playlistId, songId]);

    if (result.rowCount === 0) {
      return notFoundResponse(h, 'Song not found in the playlist');
    }

    await logPlaylistActivity(playlistId, userId, songId, 'delete');

    return okResponse(h, 'Song deleted from playlist successfully');
  } catch (error) {
    return internalServerErrorResponse(h, 'An internal server error occurred');
  }
};

const getPlaylistActivities = async (request, h) => {
  const { id: playlistId } = request.params;
  const { userId } = request.auth.credentials;

  try {
    const checkPlaylistQuery = 'SELECT * FROM playlists WHERE id = $1';
    const playlistResult = await pool.query(checkPlaylistQuery, [playlistId]);

    if (playlistResult.rows.length === 0) {
      return notFoundResponse(h, 'Playlist not found');
    }

    const playlist = playlistResult.rows[0];
    const isOwner = playlist.owner === userId;
    const isCollaborator = await isUserCollaborator(playlistId, userId);

    if (!isOwner && !isCollaborator) {
      return forbiddenResponse(
        h,
        'You do not have permission to access this playlist'
      );
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

    return okResponseWithData(h, {
      data: {
        playlistId,
        activities: activitiesResult.rows,
      },
    });
  } catch (error) {
    return internalServerErrorResponse(h, 'An internal server error occurred');
  }
};

const deletePlaylist = async (request, h) => {
  const { id: playlistId } = request.params;
  const { userId } = request.auth.credentials;

  try {
    const checkPlaylistQuery = 'SELECT * FROM playlists WHERE id = $1';
    const playlistResult = await pool.query(checkPlaylistQuery, [playlistId]);

    if (playlistResult.rows.length === 0) {
      return notFoundResponse(h, 'Playlist not found');
    }

    const playlist = playlistResult.rows[0];
    if (playlist.owner !== userId) {
      return forbiddenResponse(h, 'You are not the owner of this playlist');
    }

    const deletePlaylistQuery = 'DELETE FROM playlists WHERE id = $1';
    await pool.query(deletePlaylistQuery, [playlistId]);

    return okResponse(h, 'Playlist deleted successfully');
  } catch (error) {
    return internalServerErrorResponse(h, 'An internal server error occurred');
  }
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
