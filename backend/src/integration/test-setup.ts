import { webcrypto } from 'node:crypto';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.test' });

process.env.DATABASE_URL ??= process.env.TEST_DATABASE_URL;
process.env.JWT_SECRET ??= 'integration-test-secret';
process.env.JWT_EXPIRES_IN ??= '1h';
process.env.CORS_ORIGIN ??= 'http://localhost:5173';

if (!globalThis.crypto) {
  globalThis.crypto = webcrypto;
}
