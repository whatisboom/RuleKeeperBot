import { describe, it, expect } from 'vitest';
import { isLoginPage } from '../session.js';

describe('isLoginPage', () => {
  it('returns true when URL contains /login', () => {
    expect(isLoginPage('https://www.reddit.com/login/?dest=https%3A%2F%2Fwww.reddit.com')).toBe(true);
  });

  it('returns false for a subreddit page', () => {
    expect(isLoginPage('https://www.reddit.com/r/austinbeer/')).toBe(false);
  });

  it('returns true for account login URL', () => {
    expect(isLoginPage('https://www.reddit.com/account/login')).toBe(true);
  });
});
