import { readFileSync } from 'fs';
import { parse } from 'yaml';
import { AppConfigSchema } from './schema.js';
import type { AppConfig } from './schema.js';

function loadConfig(filePath: string): AppConfig {
  const raw = readFileSync(filePath, 'utf-8');
  const parsed = parse(raw) as unknown;
  return AppConfigSchema.parse(parsed);
}

export { loadConfig };
