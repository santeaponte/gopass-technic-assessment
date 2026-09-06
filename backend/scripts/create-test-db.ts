import dotenv from 'dotenv';
import { Client } from 'pg';

dotenv.config({ path: '.env.test' });

const testDatabaseUrl = process.env.TEST_DATABASE_URL;

if (!testDatabaseUrl) {
  throw new Error('TEST_DATABASE_URL is required. Copy .env.test.example to .env.test first.');
}

const databaseUrl = new URL(testDatabaseUrl);
const databaseName = databaseUrl.pathname.slice(1);

if (!databaseName || databaseName === 'gopass') {
  throw new Error('TEST_DATABASE_URL must point to a database separate from gopass.');
}

databaseUrl.pathname = '/postgres';

const client = new Client({ connectionString: databaseUrl.toString() });

const main = async (): Promise<void> => {
  try {
    await client.connect();
    const result = await client.query<{ exists: boolean }>(
      'SELECT EXISTS (SELECT FROM pg_database WHERE datname = $1) AS exists',
      [databaseName],
    );

    if (!result.rows[0]?.exists) {
      const safeDatabaseName = `"${databaseName.replaceAll('"', '""')}"`;
      await client.query(`CREATE DATABASE ${safeDatabaseName}`);
      console.log(`Created PostgreSQL database ${databaseName}.`);
    } else {
      console.log(`PostgreSQL database ${databaseName} already exists.`);
    }
  } finally {
    await client.end();
  }
};

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
