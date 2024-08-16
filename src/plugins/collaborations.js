const collaborationsService = require('../services/collaborations');
const collaborationsValidation = require('../validators/collaborations');
const { errorResponse } = require('../utils/response');

const collaborationsPlugin = {
  name: 'collaborations',
  version: '1.0.0',
  register: async (server) => {
    server.route([
      {
        method: 'POST',
        path: '/collaborations',
        handler: collaborationsService.addCollaboration,
        options: {
          auth: 'jwt_access',
          validate: {
            payload: collaborationsValidation.addCollaborationSchema,
            failAction: (request, h, err) => {
              return errorResponse(h, {
                message: err.message,
                status: 'fail',
                statusCode: 400,
              });
            },
          },
        },
      },
      {
        method: 'DELETE',
        path: '/collaborations',
        handler: collaborationsService.deleteCollaboration,
        options: {
          auth: 'jwt_access',
          validate: {
            payload: collaborationsValidation.deleteCollaborationSchema,
            failAction: (request, h, err) => {
              return errorResponse(h, {
                message: err.message,
                status: 'fail',
                statusCode: 400,
              });
            },
          },
        },
      },
    ]);
  },
};

module.exports = collaborationsPlugin;
