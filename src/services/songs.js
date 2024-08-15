const { nanoid } = require('nanoid');
const pool = require('../database');
const { successResponse, errorResponse } = require('../utils/response');

const createSong = async (request, h) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { title, year, genre, performer, duration, albumId } =
      request.payload;
    const id = `song-${nanoid(16)}`;
    const query =
      'INSERT INTO songs (id, title, year, genre, performer, duration, album_id) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *';
    const result = await client.query(query, [
      id,
      title,
      year,
      genre,
      performer,
      duration,
      albumId,
    ]);
    await client.query('COMMIT');
    return successResponse(h, {
      data: {
        songId: result.rows[0].id,
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

const getSongById = async (request, h) => {
  try {
    const { id } = request.params;
    const query = 'SELECT * FROM songs WHERE id = $1';
    const result = await pool.query(query, [id]);
    if (result.rows.length === 0) {
      return errorResponse(h, {
        message: 'Song not found',
        status: 'fail',
        statusCode: 404,
      });
    }
    return successResponse(h, {
      data: {
        song: result.rows[0],
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

const updateSong = async (request, h) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { id } = request.params;
    const { title, year, genre, performer, duration, albumId } =
      request.payload;
    const query =
      'UPDATE songs SET title = $1, year = $2, genre = $3, performer = $4, duration = $5, album_id = $6 WHERE id = $7 RETURNING *';
    const result = await client.query(query, [
      title,
      year,
      genre,
      performer,
      duration,
      albumId,
      id,
    ]);
    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return errorResponse(h, {
        message: 'Song not found',
        status: 'fail',
        statusCode: 404,
      });
    }
    await client.query('COMMIT');
    return successResponse(h, {
      message: 'Song updated successfully',
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

const deleteSong = async (request, h) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { id } = request.params;
    const query = 'DELETE FROM songs WHERE id = $1 RETURNING *';
    const result = await client.query(query, [id]);
    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return errorResponse(h, {
        message: 'Song not found',
        status: 'fail',
        statusCode: 404,
      });
    }
    await client.query('COMMIT');
    return successResponse(h, {
      message: 'Song deleted successfully',
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

const searchSong = async (request, h) => {
  try {
    const { title, performer } = request.query;
    let query = 'SELECT id, title, performer FROM songs';
    const values = [];

    if (title || performer) {
      query += ' WHERE';
    }

    if (title) {
      query += ' title ILIKE $1';
      values.push(`%${title}%`);
    }

    if (title && performer) {
      query += ' AND';
    }

    if (performer) {
      query += ` performer ILIKE $${values.length + 1}`;
      values.push(`%${performer}%`);
    }

    const result = await pool.query(query, values);
    return successResponse(h, {
      data: {
        songs: result.rows,
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
  createSong,
  getSongById,
  updateSong,
  deleteSong,
  searchSong,
};
