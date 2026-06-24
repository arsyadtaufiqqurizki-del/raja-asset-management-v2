import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from './schema.js'; 

const { Pool } = pg;

export const createPool = () => {
  const sqlHost = process.env.SQL_HOST || 'localhost';
  // Cloud Run uses Unix socket path (e.g. /cloudsql/project:region:instance)
  const isUnixSocket = sqlHost.startsWith('/');

  return new Pool({
    ...(isUnixSocket
      ? { host: sqlHost }                                      // Unix socket for Cloud Run
      : { host: sqlHost, port: parseInt(process.env.SQL_PORT || '5432') } // TCP for local dev
    ),
    user: process.env.SQL_USER,
    password: process.env.SQL_PASSWORD,
    database: process.env.SQL_DB_NAME,
    connectionTimeoutMillis: 15000,
  });
};

const pool = createPool();

pool.on('error', (err) => {
  console.error('Unexpected error on idle SQL pool client:', err);
});

export const db = drizzle(pool, { schema });
