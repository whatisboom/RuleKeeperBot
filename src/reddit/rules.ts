interface CacheEntry {
  rules: string[];
  fetchedAt: number;
}

class RulesCache {
  private cache = new Map<string, CacheEntry>();
  private ttlMs: number;
  private fetchFn: (subreddit: string) => Promise<string[]>;

  constructor(
    fetchFn: (subreddit: string) => Promise<string[]>,
    ttlHours: number,
  ) {
    this.fetchFn = fetchFn;
    this.ttlMs = ttlHours * 60 * 60 * 1000;
  }

  async getRules(subreddit: string): Promise<string[]> {
    const entry = this.cache.get(subreddit);
    const now = Date.now();

    if (entry && now - entry.fetchedAt < this.ttlMs) {
      return entry.rules;
    }

    const rules = await this.fetchFn(subreddit);
    this.cache.set(subreddit, { rules, fetchedAt: now });
    return rules;
  }
}

export { RulesCache };
