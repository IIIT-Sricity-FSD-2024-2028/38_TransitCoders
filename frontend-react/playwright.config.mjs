import { defineConfig } from '@playwright/test';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const testDirectory = mkdtempSync(join(tmpdir(), 'swifttrack-e2e-'));
const backend = resolve('../back-end/dist/main.js');
const buildDirectory = join(testDirectory, 'react-dist');
const frontend = 'http://127.0.0.1:4173';
const api = 'http://127.0.0.1:43001';
const vite = 'node node_modules/vite/bin/vite.js';

export default defineConfig({
  testDir: './e2e',
  workers: 1,
  timeout: 60_000,
  use: {
    baseURL: frontend,
    trace: 'retain-on-failure',
    channel: process.env.SWIFTTRACK_BROWSER || undefined,
  },
  webServer: [
    {
      command: `node "${backend}"`,
      cwd: testDirectory,
      url: `${api}/api/docs-json`,
      env: { PORT: '43001', NODE_ENV: 'test', SEED_DEV_DATA: 'true', DB_FILE: join(testDirectory, 'e2e.db') },
    },
    {
      command: `${vite} build --outDir "${buildDirectory}" --no-emptyOutDir && ${vite} preview --outDir "${buildDirectory}" --host 127.0.0.1 --port 4173 --strictPort`,
      url: frontend,
      env: { VITE_API_BASE_URL: api },
    },
  ],
});
