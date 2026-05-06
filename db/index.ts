import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL!;

// In production use a pool; in dev with Next.js hot-reload, re-use via global
const globalForDb = global as unknown as { _pgClient?: postgres.Sql };

const client = globalForDb._pgClient ?? postgres(connectionString, { max: 10 });
if (process.env.NODE_ENV !== 'production') globalForDb._pgClient = client;

export const db = drizzle(client, { schema });
