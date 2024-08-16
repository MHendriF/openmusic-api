const { nanoid } = require('nanoid');
const pool = require('../database');
const { successResponse, errorResponse } = require('../utils/response');

const addCollaboration = async (request, h) => {
  const { playlistId, userId } = request.payload;
  const { userId: ownerId } = request.auth.credentials;

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
    if (playlist.owner !== ownerId) {
      return errorResponse(h, {
        message:
          'You do not have permission to add collaborators to this playlist',
        status: 'fail',
        statusCode: 403,
      });
    }

    const checkUserQuery = 'SELECT * FROM users WHERE id = $1';
    const userResult = await pool.query(checkUserQuery, [userId]);

    if (userResult.rows.length === 0) {
      return errorResponse(h, {
        message: 'User not found',
        status: 'fail',
        statusCode: 404,
      });
    }

    const collaborationId = `collab-${nanoid(16)}`;
    const insertCollaborationQuery =
      'INSERT INTO collaborations (id, playlist_id, user_id) VALUES ($1, $2, $3)';
    await pool.query(insertCollaborationQuery, [
      collaborationId,
      playlistId,
      userId,
    ]);

    return successResponse(h, {
      message: 'Collaboration added successfully',
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

const deleteCollaboration = async (request, h) => {
  const { playlistId, userId } = request.payload;
  const { userId: ownerId } = request.auth.credentials;

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
    if (playlist.owner !== ownerId) {
      return errorResponse(h, {
        message:
          'You do not have permission to remove collaborators from this playlist',
        status: 'fail',
        statusCode: 403,
      });
    }

    const deleteCollaborationQuery =
      'DELETE FROM collaborations WHERE playlist_id = $1 AND user_id = $2';
    const result = await pool.query(deleteCollaborationQuery, [
      playlistId,
      userId,
    ]);

    if (result.rowCount === 0) {
      return errorResponse(h, {
        message: 'Collaboration not found',
        status: 'fail',
        statusCode: 404,
      });
    }

    return successResponse(h, {
      message: 'Collaboration removed successfully',
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
  addCollaboration,
  deleteCollaboration,
};
