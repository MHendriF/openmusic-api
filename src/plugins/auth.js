const usersService = require('../services/users');
const usersValidation = require('../validators/users');

const usersPlugin = {
  name: 'users',
  version: '1.0.0',
  register: async (server) => {
    server.route([
      {
        method: 'POST',
        path: '/users',
        handler: usersService.registerUser,
        options: {
          validate: {
            payload: usersValidation.registerUserSchema,
            failAction: (request, h, err) => {
              throw err;
            },
          },
        },
      },
      {
        method: 'POST',
        path: '/authentications',
        handler: usersService.loginUser,
        options: {
          validate: {
            payload: usersValidation.loginUserSchema,
            failAction: (request, h, err) => {
              throw err;
            },
          },
        },
      },
      {
        method: 'PUT',
        path: '/authentications',
        handler: usersService.refreshToken,
        options: {
          validate: {
            payload: usersValidation.refreshTokenSchema,
            failAction: (request, h, err) => {
              throw err;
            },
          },
        },
      },
      {
        method: 'DELETE',
        path: '/authentications',
        handler: usersService.logoutUser,
        options: {
          validate: {
            payload: usersValidation.logoutUserSchema,
            failAction: (request, h, err) => {
              throw err;
            },
          },
        },
      },
    ]);
  },
};

module.exports = usersPlugin;
