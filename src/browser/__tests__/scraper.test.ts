import { describe, it, expect } from 'vitest';
import { parsePostId, buildRedditContent } from '../scraper.js';

describe('parsePostId', () => {
  it('extracts post ID from a permalink', () => {
    expect(parsePostId('/r/austinbeer/comments/abc123/some_title/')).toBe('t3_abc123');
  });

  it('returns undefined for invalid permalink', () => {
    expect(parsePostId('/r/austinbeer/')).toBeUndefined();
  });
});

describe('buildRedditContent', () => {
  it('builds a RedditContent object from scraped data', () => {
    const result = buildRedditContent({
      id: 't3_abc123',
      subreddit: 'austinbeer',
      author: 'testuser',
      title: 'Great beer spot',
      body: 'Check out this brewery',
      flair: 'Recommendation',
      url: undefined,
    });

    expect(result).toEqual({
      id: 't3_abc123',
      subreddit: 'austinbeer',
      author: 'testuser',
      author_account_age_days: 0,
      author_karma: 0,
      title: 'Great beer spot',
      body: 'Check out this brewery',
      flair: 'Recommendation',
      url: undefined,
      type: 'submission',
    });
  });
});
