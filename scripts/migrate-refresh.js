const { runner } = require('node-pg-migrate');
const pool = require('../src/database');
const { logger } = require('../src/utils/logger');

const dropAllTables = async () => {
  try {
    const client = await pool.connect();
    try {
      await client.query('DROP SCHEMA public CASCADE');
      await client.query('CREATE SCHEMA public');
      logger.info('All tables dropped and schema recreated.');
    } finally {
      client.release();
    }
  } catch (error) {
    logger.error('Error dropping tables:', error);
  } finally {
    await pool.end();
  }
};

const dbConfig = {
  databaseUrl: `postgres://${process.env.PGUSER}:${process.env.PGPASSWORD}@${process.env.PGHOST}:${process.env.PGPORT}/${process.env.PGDATABASE}`,
  dir: 'migrations',
  direction: 'up',
  count: Infinity,
};

const runMigrations = async () => {
  try {
    logger.info('Dropping all tables...');
    await dropAllTables();
    logger.info('Running all migrations...');
    await runner(dbConfig);
    logger.info('All migrations applied.');
  } catch (error) {
    logger.error('Error running migrations:', error);
  }
};

runMigrations();
