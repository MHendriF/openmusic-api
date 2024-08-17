const { nanoid } = require('nanoid');
const pool = require('../database');
const {
  notFoundResponse,
  internalServerErrorResponse,
  forbiddenResponse,
  okResponse,
  createdResponseWithData,
} = require('../utils/response');

const addCollaboration = async (request, h) => {
  const { playlistId, userId } = request.payload;
  const { userId: ownerId } = request.auth.credentials;

  try {
    const checkPlaylistQuery = 'SELECT * FROM playlists WHERE id = $1';
    const playlistResult = await pool.query(checkPlaylistQuery, [playlistId]);

    if (playlistResult.rows.length === 0) {
      console.log(
        '🚀 ~ addCollaboration ~ playlistResult:',
        playlistResult.rows[0]
      );
      return notFoundResponse(h, 'Playlist not found');
    }

    const playlist = playlistResult.rows[0];
    if (playlist.owner !== ownerId) {
      return forbiddenResponse(h, 'You are not the owner of this playlist');
    }

    const checkUserQuery = 'SELECT * FROM users WHERE id = $1';
    const userResult = await pool.query(checkUserQuery, [userId]);

    if (userResult.rows.length === 0) {
      return notFoundResponse(h, 'User not found');
    }

    const collaborationId = `collab-${nanoid(16)}`;
    const insertCollaborationQuery =
      'INSERT INTO collaborations (id, playlist_id, user_id) VALUES ($1, $2, $3)';
    await pool.query(insertCollaborationQuery, [
      collaborationId,
      playlistId,
      userId,
    ]);

    return createdResponseWithData(h, {
      data: { collaborationId },
    });
  } catch (error) {
    console.log('🚀 ~ addCollaboration ~ error:', error.message);
    return internalServerErrorResponse(h, 'An internal server error occurred');
  }
};

const deleteCollaboration = async (request, h) => {
  const { playlistId, userId } = request.payload;
  const { userId: ownerId } = request.auth.credentials;

  try {
    const checkPlaylistQuery = 'SELECT * FROM playlists WHERE id = $1';
    const playlistResult = await pool.query(checkPlaylistQuery, [playlistId]);

    if (playlistResult.rows.length === 0) {
      return notFoundResponse(h, 'Playlist not found');
    }

    const playlist = playlistResult.rows[0];
    if (playlist.owner !== ownerId) {
      return forbiddenResponse(h, 'You are not the owner of this playlist');
    }

    const deleteCollaborationQuery =
      'DELETE FROM collaborations WHERE playlist_id = $1 AND user_id = $2';
    const result = await pool.query(deleteCollaborationQuery, [
      playlistId,
      userId,
    ]);

    if (result.rowCount === 0) {
      return notFoundResponse(h, 'Collaboration not found');
    }

    return okResponse(h, 'Collaboration removed successfully');
  } catch (error) {
    console.log('🚀 ~ deleteCollaboration ~ error:', error.message);
    return internalServerErrorResponse(h, 'An internal server error occurred');
  }
};

module.exports = {
  addCollaboration,
  deleteCollaboration,
};
