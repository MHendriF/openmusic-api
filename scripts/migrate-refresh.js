const { runner } = require('node-pg-migrate');
const pool = require('../src/database');

const dropAllTables = async () => {
  try {
    const client = await pool.connect();
    try {
      await client.query('DROP SCHEMA public CASCADE');
      await client.query('CREATE SCHEMA public');
      console.log('All tables dropped and schema recreated.');
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error dropping tables:', error);
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
    console.log('Dropping all tables...');
    await dropAllTables();

    console.log('Running all migrations...');
    await runner(dbConfig);
    console.log('All migrations applied.');
  } catch (error) {
    console.error('Error running migrations:', error);
  }
};

runMigrations();
