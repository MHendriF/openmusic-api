const { nanoid } = require('nanoid');
const bcrypt = require('bcrypt');
const Jwt = require('@hapi/jwt');
const pool = require('../database');
const {
  internalServerErrorResponse,
  badRequestResponse,
  createdResponseWithData,
  okResponseWithData,
  okResponse,
  unauthorizedResponse,
} = require('../utils/response');

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
      return badRequestResponse(h, 'Username already exists');
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
    return createdResponseWithData(h, {
      data: { userId: result.rows[0].id },
    });
  } catch (error) {
    await client.query('ROLLBACK');
    return internalServerErrorResponse(h, 'An internal server error occurred');
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
      return unauthorizedResponse(h, 'User not found');
    }

    const user = result.rows[0];
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return unauthorizedResponse(h, 'Invalid credentials');
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

    return createdResponseWithData(h, {
      data: {
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    return internalServerErrorResponse(h, 'An internal server error occurred');
  }
};

const getNewToken = async (request, h) => {
  try {
    const { refreshToken } = request.payload;
    const query = 'SELECT * FROM authentications WHERE token = $1';
    const result = await pool.query(query, [refreshToken]);
    if (result.rows.length === 0) {
      return badRequestResponse(h, 'Invalid token');
    }

    let decoded;
    try {
      decoded = Jwt.token.decode(refreshToken);
    } catch (decodeError) {
      return badRequestResponse(h, 'Failed to decode refresh token');
    }

    const accessToken = Jwt.token.generate(
      { userId: decoded.decoded.payload.userId },
      process.env.ACCESS_TOKEN_KEY,
      { expiresIn: '1h' }
    );

    return okResponseWithData(h, {
      data: {
        accessToken,
      },
    });
  } catch (error) {
    return internalServerErrorResponse(h, 'An internal server error occurred');
  }
};

const logoutUser = async (request, h) => {
  try {
    const { refreshToken } = request.payload;
    const query = 'DELETE FROM authentications WHERE token = $1';
    const result = await pool.query(query, [refreshToken]);
    if (result.rowCount === 0) {
      return badRequestResponse(h, 'Invalid token');
    }

    return okResponse(h, 'User logged out successfully');
  } catch (error) {
    return internalServerErrorResponse(h, 'An internal server error occurred');
  }
};

module.exports = {
  registerUser,
  loginUser,
  getNewToken,
  logoutUser,
};
