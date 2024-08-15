const successResponse = (h, { data, message = undefined, statusCode = 200 }) =>
  h
    .response({
      status: 'success',
      message,
      data,
    })
    .code(statusCode);

const errorResponse = (h, { message, status = 'error', statusCode = 500 }) =>
  h
    .response({
      status,
      message,
    })
    .code(statusCode);

module.exports = {
  successResponse,
  errorResponse,
};
