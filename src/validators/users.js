const Joi = require('@hapi/joi');
const { refreshToken } = require('../services/users');

const registerUserSchema = Joi.object({
  username: Joi.string().required(),
  password: Joi.string().required(),
  fullname: Joi.string().required(),
});

const loginUserSchema = Joi.object({
  username: Joi.string().required(),
  password: Joi.string().required(),
});

const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().required(),
});

const logoutUserSchema = Joi.object({
  refreshToken: Joi.string().required(),
});

module.exports = {
  registerUserSchema,
  loginUserSchema,
  refreshTokenSchema,
  logoutUserSchema,
};
