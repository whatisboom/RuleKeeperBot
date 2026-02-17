import { describe, it, expect } from 'vitest';
import { loadConfig } from '../loader.js';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

describe('loadConfig', () => {
  it('loads and validates a valid config file', () => {
    const config = loadConfig(join(__dirname, 'fixtures', 'valid.yaml'));
    expect(config.subreddits).toBeDefined();
    expect(config.subreddits['testsubreddit']).toBeDefined();
    expect(config.subreddits['testsubreddit'].enabled).toBe(true);
    expect(config.subreddits['testsubreddit'].confidence_thresholds.auto_remove).toBe(0.9);
  });

  it('throws on invalid config', () => {
    expect(() => loadConfig(join(__dirname, 'fixtures', 'invalid.yaml'))).toThrow();
  });

  it('applies defaults for optional fields', () => {
    const config = loadConfig(join(__dirname, 'fixtures', 'minimal.yaml'));
    expect(config.subreddits['testsubreddit'].poll_interval_seconds).toBe(60);
    expect(config.subreddits['testsubreddit'].rules_cache_ttl_hours).toBe(24);
    expect(config.subreddits['testsubreddit'].rule_overrides).toEqual([]);
    expect(config.subreddits['testsubreddit'].prompt_context).toBe('');
  });
});
