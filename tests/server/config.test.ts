import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseAppConfig } from '@/server/config';

describe('server/config', () => {
  it('applies documented defaults when environment variables are omitted', () => {
    const config = parseAppConfig({});
    expect(config.appTimezone).toBe('Asia/Saigon');
    expect(config.storageDriver).toBe('local');
    expect(config.databaseFile).toBe('hiep-trong-space.db');
    expect(config.databasePath).toBe(path.resolve('./data', 'hiep-trong-space.db'));
    expect(config.mediaDir).toBe(path.resolve('./data/media'));
    expect(config.schedulerTickSeconds).toBe(30);
  });

  it('parses custom environment overrides and rejects invalid drivers', () => {
    const config = parseAppConfig({
      APP_TIMEZONE: 'UTC',
      STORAGE_DRIVER: 'drive',
      DATA_DIR: './custom-data',
      DATABASE_FILE: 'custom.db',
      MEDIA_DIR: './custom-data/media',
      GOOGLE_DRIVE_FOLDER_ID: 'folder-123',
      SCHEDULER_TICK_SECONDS: '45',
    });

    expect(config.appTimezone).toBe('UTC');
    expect(config.storageDriver).toBe('drive');
    expect(config.googleDriveFolderId).toBe('folder-123');
    expect(config.schedulerTickSeconds).toBe(45);

    expect(() => parseAppConfig({ STORAGE_DRIVER: 's3' })).toThrow();
  });

  it('validates APP_TIMEZONE against IANA timezones and rejects invalid zones (C09)', () => {
    expect(parseAppConfig({ APP_TIMEZONE: 'Asia/Ho_Chi_Minh' }).appTimezone).toBe(
      'Asia/Ho_Chi_Minh',
    );
    expect(parseAppConfig({ APP_TIMEZONE: 'Asia/Saigon' }).appTimezone).toBe('Asia/Saigon');
    expect(parseAppConfig({ APP_TIMEZONE: 'America/New_York' }).appTimezone).toBe(
      'America/New_York',
    );
    expect(() => parseAppConfig({ APP_TIMEZONE: 'Mars/Phobos' })).toThrow(/timezone/i);
    expect(() => parseAppConfig({ APP_TIMEZONE: 'Invalid/Zone_Name' })).toThrow(/timezone/i);
  });

  it('resolves identical database paths for runtime config and Drizzle CLI config (C10)', async () => {
    const { resolveDatabasePath } = await import('@/server/config');
    const defaultConfig = parseAppConfig({});
    expect(resolveDatabasePath({})).toBe(defaultConfig.databasePath);

    const customEnv = {
      DATA_DIR: './custom-runtime-data',
      DATABASE_FILE: 'custom-space.db',
    };
    const customConfig = parseAppConfig(customEnv);
    expect(resolveDatabasePath(customEnv)).toBe(customConfig.databasePath);
    expect(customConfig.databasePath).toBe(
      path.resolve('./custom-runtime-data', 'custom-space.db'),
    );
  });
});
