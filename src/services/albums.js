const { nanoid } = require('nanoid');
const pool = require('../database');
const {
  notFoundResponse,
  internalServerErrorResponse,
  createdResponseWithData,
  okResponseWithData,
  okResponse,
} = require('../utils/response');

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
    return createdResponseWithData(h, { data: { albumId: result.rows[0].id } });
  } catch (error) {
    await client.query('ROLLBACK');
    console.log('🚀 ~ createAlbum ~ error:', error.message);
    return internalServerErrorResponse(h, 'An internal server error occurred');
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
      return notFoundResponse(h, 'Album not found');
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
    return okResponseWithData(h, { data: { album } });
  } catch (error) {
    console.log('🚀 ~ getAlbumById ~ error:', error.message);
    return internalServerErrorResponse(h, 'An internal server error occurred');
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
      return notFoundResponse(h, 'Album not found');
    }
    await client.query('COMMIT');
    return okResponse(h, 'Album updated successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    console.log('🚀 ~ updateAlbum ~ error:', error.message);
    return internalServerErrorResponse(h, 'An internal server error occurred');
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
      return notFoundResponse(h, 'Album not found');
    }
    await client.query('COMMIT');
    return okResponse(h, 'Album deleted successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    console.log('🚀 ~ deleteAlbum ~ error:', error.message);
    return internalServerErrorResponse(h, 'An internal server error occurred');
  } finally {
    client.release();
  }
};

const getAllAlbum = async (request, h) => {
  try {
    const query = 'SELECT * FROM albums';
    const result = await pool.query(query);
    return okResponseWithData(h, {
      data: { albums: result.rows },
    });
  } catch (error) {
    console.log('🚀 ~ getAllAlbum ~ error:', error.message);
    return internalServerErrorResponse(h, 'An internal server error occurred');
  }
};

module.exports = {
  createAlbum,
  getAlbumById,
  updateAlbum,
  deleteAlbum,
  getAllAlbum,
};
