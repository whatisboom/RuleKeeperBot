import type { Page } from 'playwright';

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

async function fetchSubredditRules(page: Page, subreddit: string): Promise<string[]> {
  await page.goto(`https://www.reddit.com/r/${subreddit}/about/rules/`, {
    waitUntil: 'domcontentloaded',
  });

  await page.waitForSelector('[class*="rule"], [data-testid*="rule"]', {
    timeout: 10000,
  }).catch(() => {
    console.log(`No rules found for r/${subreddit}`);
  });

  const rules = await page.evaluate(() => {
    const ruleElements = document.querySelectorAll(
      '[class*="RulesWidget"] li, .rule-list li, [data-testid="subreddit-rule"]'
    );

    const results: string[] = [];

    for (const el of ruleElements) {
      const heading = el.querySelector('h3, [class*="title"], strong')?.textContent?.trim();
      const description = el.querySelector('p, [class*="description"]')?.textContent?.trim();

      if (heading) {
        results.push(description ? `${heading}: ${description}` : heading);
      }
    }

    if (results.length === 0) {
      const allText = document.querySelectorAll('ol li, .md ol li');
      for (const el of allText) {
        const text = el.textContent?.trim();
        if (text && text.length > 5) {
          results.push(text);
        }
      }
    }

    return results;
  });

  return rules;
}

export { RulesCache, fetchSubredditRules };
