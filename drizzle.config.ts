import { defineConfig } from 'drizzle-kit';
import { resolveDatabasePath } from './src/server/config';

export default defineConfig({
  schema: './src/services/storage/local/schema.ts',
  out: './drizzle',
  dialect: 'sqlite',
  dbCredentials: {
    url: resolveDatabasePath(),
  },
});
