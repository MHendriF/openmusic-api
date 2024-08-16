const Joi = require('@hapi/joi');

const createAlbumSchema = Joi.object({
  name: Joi.string().required(),
  year: Joi.number().required(),
});

const updateAlbumSchema = Joi.object({
  name: Joi.string().required(),
  year: Joi.number().required(),
});

module.exports = {
  createAlbumSchema,
  updateAlbumSchema,
};
