const { nanoid } = require('nanoid');
const bcrypt = require('bcrypt');
const Jwt = require('@hapi/jwt');
const pool = require('../database');
const { successResponse, errorResponse } = require('../utils/response');

const registerUser = async (request, h) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { username, password, fullname } = request.payload;
    const id = `user-${nanoid(16)}`;
    const hashedPassword = await bcrypt.hash(password, 10);

    const checkUsernameQuery = 'SELECT * FROM users WHERE username = $1';
    const usernameResult = await client.query(checkUsernameQuery, [username]);
    if (usernameResult.rows.length > 0) {
      await client.query('ROLLBACK');
      return errorResponse(h, {
        message: 'Username already exists',
        status: 'fail',
        statusCode: 400,
      });
    }

    const insertUserQuery =
      'INSERT INTO users (id, username, password, fullname) VALUES ($1, $2, $3, $4) RETURNING *';
    const result = await client.query(insertUserQuery, [
      id,
      username,
      hashedPassword,
      fullname,
    ]);
    await client.query('COMMIT');
    return successResponse(h, {
      data: {
        userId: result.rows[0].id,
      },
      message: 'User registered successfully',
      status: 'success',
      statusCode: 201,
    });
  } catch (error) {
    console.log('🚀 ~ registerUser ~ error:', error.message);
    await client.query('ROLLBACK');
    return errorResponse(h, {
      message: 'An internal server error occurred',
      status: 'error',
      statusCode: 500,
    });
  } finally {
    client.release();
  }
};

const loginUser = async (request, h) => {
  try {
    const { username, password } = request.payload;
    const query = 'SELECT * FROM users WHERE username = $1';
    const result = await pool.query(query, [username]);
    if (result.rows.length === 0) {
      return errorResponse(h, {
        message: 'User not found',
        status: 'fail',
        statusCode: 401,
      });
    }

    const user = result.rows[0];
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return errorResponse(h, {
        message: 'Invalid credentials',
        status: 'fail',
        statusCode: 401,
      });
    }

    const accessToken = Jwt.token.generate(
      { userId: user.id },
      process.env.ACCESS_TOKEN_KEY,
      { expiresIn: '1h' }
    );
    const refreshToken = Jwt.token.generate(
      { userId: user.id },
      process.env.REFRESH_TOKEN_KEY,
      { expiresIn: '7d' }
    );

    const insertTokenQuery = 'INSERT INTO authentications (token) VALUES ($1)';
    await pool.query(insertTokenQuery, [refreshToken]);

    return successResponse(h, {
      data: {
        accessToken,
        refreshToken,
      },
      status: 'success',
      statusCode: 201,
    });
  } catch (error) {
    console.log('🚀 ~ loginUser ~ error:', error.message);
    return errorResponse(h, {
      message: 'An internal server error occurred',
      status: 'error',
      statusCode: 500,
    });
  }
};

const refreshToken = async (request, h) => {
  try {
    const { refreshToken } = request.payload;
    console.log('🚀 ~ refreshToken ~ refreshToken:', request.payload);
    const query = 'SELECT * FROM authentications WHERE token = $1';
    const result = await pool.query(query, [refreshToken]);
    console.log('🚀 ~ refreshToken ~ result:', result.rows);
    if (result.rows.length === 0) {
      return errorResponse(h, {
        message: 'Invalid refresh token',
        status: 'fail',
        statusCode: 400,
      });
    }

    let decoded;
    try {
      decoded = Jwt.token.decode(refreshToken);
      //console.log('🚀 ~ refreshToken ~ decoded:', decoded);
    } catch (decodeError) {
      console.log('🚀 ~ refreshToken ~ decodeError:', decodeError.message);
      return errorResponse(h, {
        message: 'Failed to decode refresh token',
        status: 'fail',
        statusCode: 400,
      });
    }

    //console.log('🚀 ~ refreshToken ~ payload:', decoded.decoded.payload);

    const accessToken = Jwt.token.generate(
      { userId: decoded.decoded.payload.userId },
      process.env.ACCESS_TOKEN_KEY,
      { expiresIn: '1h' }
    );

    return successResponse(h, {
      data: {
        accessToken,
      },
      status: 'success',
      statusCode: 200,
    });
  } catch (error) {
    console.log('🚀 ~ refreshToken ~ error:', error.message);
    return errorResponse(h, {
      message: 'An internal server error occurred',
      status: 'error',
      statusCode: 500,
    });
  }
};

const logoutUser = async (request, h) => {
  try {
    const { refreshToken } = request.payload;
    const query = 'DELETE FROM authentications WHERE token = $1';
    const result = await pool.query(query, [refreshToken]);
    if (result.rowCount === 0) {
      return errorResponse(h, {
        message: 'Invalid refresh token',
        status: 'fail',
        statusCode: 400,
      });
    }

    return successResponse(h, {
      message: 'User logged out successfully',
      status: 'success',
      statusCode: 200,
    });
  } catch (error) {
    return errorResponse(h, {
      message: 'An internal server error occurred',
      status: 'error',
      statusCode: 500,
    });
  }
};

module.exports = {
  registerUser,
  loginUser,
  refreshToken,
  logoutUser,
};
