
import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from './drizzle-schema.ts';

const pool = new pg.Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: process.env.DB_SSL === 'true'
});

export const db = drizzle(pool, { schema });

