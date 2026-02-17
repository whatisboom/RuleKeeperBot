import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { RulesCache } from '../rules.js';

describe('RulesCache', () => {
  let cache: RulesCache;
  const mockFetchRules = vi.fn<(subreddit: string) => Promise<string[]>>();

  beforeEach(() => {
    vi.useFakeTimers();
    mockFetchRules.mockClear();
    cache = new RulesCache(mockFetchRules, 1);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('fetches rules on first call', async () => {
    mockFetchRules.mockResolvedValueOnce(['Rule 1', 'Rule 2']);
    const rules = await cache.getRules('austinbeer');
    expect(rules).toEqual(['Rule 1', 'Rule 2']);
    expect(mockFetchRules).toHaveBeenCalledWith('austinbeer');
  });

  it('returns cached rules on subsequent calls', async () => {
    mockFetchRules.mockResolvedValueOnce(['Rule 1']);
    await cache.getRules('austinbeer');
    const rules = await cache.getRules('austinbeer');
    expect(rules).toEqual(['Rule 1']);
    expect(mockFetchRules).toHaveBeenCalledTimes(1);
  });

  it('re-fetches after TTL expires', async () => {
    mockFetchRules.mockResolvedValueOnce(['Rule 1']);
    mockFetchRules.mockResolvedValueOnce(['Rule 1', 'Rule 2']);

    await cache.getRules('austinbeer');
    vi.advanceTimersByTime(2 * 60 * 60 * 1000);
    const rules = await cache.getRules('austinbeer');

    expect(rules).toEqual(['Rule 1', 'Rule 2']);
    expect(mockFetchRules).toHaveBeenCalledTimes(2);
  });

  it('caches per subreddit independently', async () => {
    mockFetchRules.mockResolvedValueOnce(['Beer rules']);
    mockFetchRules.mockResolvedValueOnce(['Housing rules']);

    await cache.getRules('austinbeer');
    await cache.getRules('austinhousing');

    expect(mockFetchRules).toHaveBeenCalledTimes(2);
  });
});
