const Joi = require('@hapi/joi');

const createPlaylistSchema = Joi.object({
  name: Joi.string().required(),
});

const addSongToPlaylistSchema = Joi.object({
  songId: Joi.string().required(),
});

const deleteSongFromPlaylistSchema = Joi.object({
  songId: Joi.string().required(),
});

module.exports = {
  createPlaylistSchema,
  addSongToPlaylistSchema,
  deleteSongFromPlaylistSchema,
};
