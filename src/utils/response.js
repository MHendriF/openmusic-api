const StatusCode = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
};

const okResponse = (h, message) =>
  h
    .response({
      status: 'success',
      message,
    })
    .code(StatusCode.OK);

const okResponseWithData = (h, data) =>
  h
    .response({
      status: 'success',
      ...data,
    })
    .code(StatusCode.OK);

const createdResponse = (h, message) =>
  h
    .response({
      status: 'success',
      message,
    })
    .code(StatusCode.CREATED);

const createdResponseWithData = (h, data) =>
  h
    .response({
      status: 'success',
      ...data,
    })
    .code(StatusCode.CREATED);

const badRequestResponse = (h, message) =>
  h
    .response({
      status: 'fail',
      message,
    })
    .code(StatusCode.BAD_REQUEST);

const unauthorizedResponse = (h, message) =>
  h
    .response({
      status: 'fail',
      message,
    })
    .code(StatusCode.UNAUTHORIZED);

const forbiddenResponse = (h, message) =>
  h
    .response({
      status: 'fail',
      message,
    })
    .code(403);

const notFoundResponse = (h, message) =>
  h
    .response({
      status: 'fail',
      message,
    })
    .code(StatusCode.NOT_FOUND);

const internalServerErrorResponse = (h, message) =>
  h
    .response({
      status: 'error',
      message,
    })
    .code(StatusCode.INTERNAL_SERVER_ERROR);

module.exports = {
  StatusCode,
  okResponse,
  okResponseWithData,
  createdResponse,
  createdResponseWithData,
  badRequestResponse,
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
  internalServerErrorResponse,
};
