const pool = require('../database');

const createAlbum = async (request, h) => {
  const { name, year } = request.payload;
  const query = 'INSERT INTO albums (name, year) VALUES ($1, $2) RETURNING *';
  const result = await pool.query(query, [name, year]);
  return h
    .response({
      status: 'success',
      data: { album: result.rows[0] },
    })
    .code(201);
};

const getAlbumById = async (request, h) => {
  const { id } = request.params;
  const query = 'SELECT * FROM albums WHERE id = $1';
  const result = await pool.query(query, [id]);
  if (result.rows.length === 0) {
    return h
      .response({
        status: 'fail',
        message: 'Album not found',
      })
      .code(404);
  }
  return h
    .response({
      status: 'success',
      data: { album: result.rows[0] },
    })
    .code(200);
};

const updateAlbum = async (request, h) => {
  const { id } = request.params;
  const { name, year } = request.payload;
  const query =
    'UPDATE albums SET name = $1, year = $2 WHERE id = $3 RETURNING *';
  const result = await pool.query(query, [name, year, id]);
  if (result.rows.length === 0) {
    return h
      .response({
        status: 'fail',
        message: 'Album not found',
      })
      .code(404);
  }
  return h
    .response({
      status: 'success',
      data: { album: result.rows[0] },
    })
    .code(200);
};

const deleteAlbum = async (request, h) => {
  const { id } = request.params;
  const query = 'DELETE FROM albums WHERE id = $1 RETURNING *';
  const result = await pool.query(query, [id]);
  if (result.rows.length === 0) {
    return h
      .response({
        status: 'fail',
        message: 'Album not found',
      })
      .code(404);
  }
  return h
    .response({
      status: 'success',
      message: 'Album deleted successfully',
    })
    .code(200);
};

module.exports = {
  createAlbum,
  getAlbumById,
  updateAlbum,
  deleteAlbum,
};
