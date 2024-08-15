const { nanoid } = require('nanoid');
const pool = require('../database');
const { successResponse, errorResponse } = require('../utils/response');

const createAlbum = async (request, h) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { name, year } = request.payload;
    const id = `album-${nanoid(16)}`;
    const query =
      'INSERT INTO albums (id, name, year) VALUES ($1, $2, $3) RETURNING *';
    const result = await client.query(query, [id, name, year]);
    await client.query('COMMIT');
    return successResponse(h, {
      data: {
        albumId: result.rows[0].id,
      },
      status: 'success',
      statusCode: 201,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    return errorResponse(h, {
      message: 'An internal server error occurred',
      status: 'error',
      statusCode: 500,
    });
  } finally {
    client.release();
  }
};

const getAlbumById = async (request, h) => {
  try {
    const { id } = request.params;
    const query = `
    SELECT a.id AS album_id, a.name AS album_name, a.year AS album_year, s.id AS song_id, s.title AS song_title, s.performer AS song_performer
    FROM albums a
    LEFT JOIN songs s ON a.id = s.album_id
    WHERE a.id = $1
  `;
    const result = await pool.query(query, [id]);
    if (result.rows.length === 0) {
      return errorResponse(h, {
        message: 'Album not found',
        status: 'fail',
        statusCode: 404,
      });
    }

    const album = {
      id: result.rows[0].album_id,
      name: result.rows[0].album_name,
      year: result.rows[0].album_year,
      songs: result.rows
        .map((row) => ({
          id: row.song_id,
          title: row.song_title,
          performer: row.song_performer,
        }))
        .filter((song) => song.id !== null),
    };
    return successResponse(h, {
      data: {
        album,
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

const updateAlbum = async (request, h) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { id } = request.params;
    const { name, year } = request.payload;
    const query =
      'UPDATE albums SET name = $1, year = $2 WHERE id = $3 RETURNING *';
    const result = await client.query(query, [name, year, id]);
    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return errorResponse(h, {
        message: 'Album not found',
        status: 'fail',
        statusCode: 404,
      });
    }
    await client.query('COMMIT');
    return successResponse(h, {
      message: 'Album updated successfully',
      status: 'success',
      statusCode: 200,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    return errorResponse(h, {
      message: 'An internal server error occurred',
      status: 'error',
      statusCode: 500,
    });
  } finally {
    client.release();
  }
};

const deleteAlbum = async (request, h) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { id } = request.params;
    const query = 'DELETE FROM albums WHERE id = $1 RETURNING *';
    const result = await client.query(query, [id]);
    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return errorResponse(h, {
        message: 'Album not found',
        status: 'fail',
        statusCode: 404,
      });
    }
    await client.query('COMMIT');
    return successResponse(h, {
      message: 'Album deleted successfully',
      status: 'success',
      statusCode: 200,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    return errorResponse(h, {
      message: 'An internal server error occurred',
      status: 'error',
      statusCode: 500,
    });
  } finally {
    client.release();
  }
};

const getAllAlbum = async (request, h) => {
  try {
    const query = 'SELECT * FROM albums';
    const result = await pool.query(query);
    return successResponse(h, {
      data: {
        albums: result.rows,
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

module.exports = {
  createAlbum,
  getAlbumById,
  updateAlbum,
  deleteAlbum,
  getAllAlbum,
};
