const collaborationsService = require('../services/collaborations');
const collaborationsValidation = require('../validators/collaborations');

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
              throw err;
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
              throw err;
            },
          },
        },
      },
    ]);
  },
};

module.exports = collaborationsPlugin;
