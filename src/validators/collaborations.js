const Joi = require('@hapi/joi');

const addCollaborationSchema = Joi.object({
  playlistId: Joi.string().required(),
  userId: Joi.string().required(),
});

const deleteCollaborationSchema = Joi.object({
  playlistId: Joi.string().required(),
  userId: Joi.string().required(),
});

module.exports = {
  addCollaborationSchema,
  deleteCollaborationSchema,
};
