import { describe, it, expect } from 'vitest';
import { buildAnalysisPrompt } from '../prompts.js';
import type { RedditContent } from '../types.js';

describe('buildAnalysisPrompt', () => {
  const content: RedditContent = {
    id: 't3_abc123',
    subreddit: 'austinbeer',
    author: 'testuser',
    author_account_age_days: 30,
    author_karma: 500,
    title: 'Best IPA in Austin?',
    body: 'Looking for recommendations for hoppy IPAs.',
    flair: 'Question',
    type: 'submission',
  };

  const rules = ['No spam', 'Be civil', 'Stay on topic'];
  const overrides = ['Beer trade posts are allowed'];
  const promptContext = 'Casual community, mild profanity is fine.';

  it('includes subreddit name', () => {
    const prompt = buildAnalysisPrompt(content, rules, overrides, promptContext);
    expect(prompt).toContain('r/austinbeer');
  });

  it('includes all rules and overrides', () => {
    const prompt = buildAnalysisPrompt(content, rules, overrides, promptContext);
    expect(prompt).toContain('No spam');
    expect(prompt).toContain('Beer trade posts are allowed');
  });

  it('includes post content', () => {
    const prompt = buildAnalysisPrompt(content, rules, overrides, promptContext);
    expect(prompt).toContain('Best IPA in Austin?');
    expect(prompt).toContain('Looking for recommendations');
  });

  it('includes author metadata', () => {
    const prompt = buildAnalysisPrompt(content, rules, overrides, promptContext);
    expect(prompt).toContain('testuser');
    expect(prompt).toContain('30');
    expect(prompt).toContain('500');
  });

  it('includes prompt context', () => {
    const prompt = buildAnalysisPrompt(content, rules, overrides, promptContext);
    expect(prompt).toContain('Casual community');
  });

  it('handles comments without title', () => {
    const comment: RedditContent = {
      ...content,
      title: undefined,
      type: 'comment',
    };
    const prompt = buildAnalysisPrompt(comment, rules, [], '');
    expect(prompt).not.toContain('Title:');
    expect(prompt).toContain('Comment');
  });
});
