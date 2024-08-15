const Joi = require('@hapi/joi');

const createAlbumSchema = Joi.object({
  name: Joi.string().required(),
  year: Joi.number().required(),
  cover_url: Joi.string().optional(),
});

const updateAlbumSchema = Joi.object({
  name: Joi.string().required(),
  year: Joi.number().required(),
  cover_url: Joi.string().optional(),
});

module.exports = {
  createAlbumSchema,
  updateAlbumSchema,
};
