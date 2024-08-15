const pool = require('../database');

const createSong = async (request, h) => {
  const { title, year, genre, performer, duration, albumId } = request.payload;
  const query =
    'INSERT INTO songs (title, year, genre, performer, duration, album_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *';
  const result = await pool.query(query, [
    title,
    year,
    genre,
    performer,
    duration,
    albumId,
  ]);
  return h
    .response({
      status: 'success',
      data: { song: result.rows[0] },
    })
    .code(201);
};

const getSongById = async (request, h) => {
  const { id } = request.params;
  const query = 'SELECT * FROM songs WHERE id = $1';
  const result = await pool.query(query, [id]);
  if (result.rows.length === 0) {
    return h
      .response({
        status: 'fail',
        message: 'Song not found',
      })
      .code(404);
  }
  return h
    .response({
      status: 'success',
      data: { song: result.rows[0] },
    })
    .code(200);
};

const updateSong = async (request, h) => {
  const { id } = request.params;
  const { title, year, genre, performer, duration, albumId } = request.payload;
  const query =
    'UPDATE songs SET title = $1, year = $2, genre = $3, performer = $4, duration = $5, album_id = $6 WHERE id = $7 RETURNING *';
  const result = await pool.query(query, [
    title,
    year,
    genre,
    performer,
    duration,
    albumId,
    id,
  ]);
  if (result.rows.length === 0) {
    return h
      .response({
        status: 'fail',
        message: 'Song not found',
      })
      .code(404);
  }
  return h
    .response({
      status: 'success',
      data: { song: result.rows[0] },
    })
    .code(200);
};

const deleteSong = async (request, h) => {
  const { id } = request.params;
  const query = 'DELETE FROM songs WHERE id = $1 RETURNING *';
  const result = await pool.query(query, [id]);
  if (result.rows.length === 0) {
    return h
      .response({
        status: 'fail',
        message: 'Song not found',
      })
      .code(404);
  }
  return h
    .response({
      status: 'success',
      message: 'Song deleted successfully',
    })
    .code(200);
};

module.exports = {
  createSong,
  getSongById,
  updateSong,
  deleteSong,
};
