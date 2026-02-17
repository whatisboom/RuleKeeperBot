import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Analyzer } from '../analyzer.js';
import type { RedditContent } from '../types.js';

vi.mock('@anthropic-ai/sdk', () => {
  const MockAnthropic = vi.fn(function (this: Record<string, unknown>) {
    this.messages = {
      parse: vi.fn(),
    };
  }) as unknown as ReturnType<typeof vi.fn>;
  return { default: MockAnthropic };
});

vi.mock('@anthropic-ai/sdk/helpers/zod', () => ({
  zodOutputFormat: vi.fn().mockReturnValue({ type: 'json_schema' }),
}));

describe('Analyzer', () => {
  let analyzer: Analyzer;
  let mockParse: ReturnType<typeof vi.fn>;

  const content: RedditContent = {
    id: 't3_abc123',
    subreddit: 'austinbeer',
    author: 'spambot99',
    author_account_age_days: 1,
    author_karma: 0,
    title: 'FREE BEER CLICK HERE',
    body: 'Visit my website for free beer coupons!!!',
    type: 'submission',
  };

  const rules = ['No spam'];
  const overrides: string[] = [];
  const promptContext = '';

  beforeEach(() => {
    analyzer = new Analyzer('fake-api-key');
    mockParse = vi.mocked(analyzer['client'].messages.parse);
  });

  it('returns parsed_output when available', async () => {
    const parsed = {
      violation_type: 'spam' as const,
      confidence: 0.95,
      reasoning: 'New account, clickbait title, suspicious URL pattern',
      suggested_action: 'remove' as const,
      removal_reason: 'This post has been removed as spam.',
    };

    mockParse.mockResolvedValueOnce({
      parsed_output: parsed,
      content: [{ type: 'text', text: JSON.stringify(parsed) }],
      stop_reason: 'end_turn',
    });

    const result = await analyzer.analyze(content, rules, overrides, promptContext);
    expect(result.violation_type).toBe('spam');
    expect(result.confidence).toBe(0.95);
    expect(result.suggested_action).toBe('remove');
  });

  it('falls back to manual parsing when parsed_output is null', async () => {
    mockParse.mockResolvedValueOnce({
      parsed_output: null,
      content: [{
        type: 'text',
        text: JSON.stringify({
          violation_type: 'none',
          confidence: 0.1,
          reasoning: 'Looks fine',
          suggested_action: 'none',
          removal_reason: '',
        }),
      }],
      stop_reason: 'end_turn',
    });

    const result = await analyzer.analyze(content, rules, overrides, promptContext);
    expect(result.violation_type).toBe('none');
    expect(result.suggested_action).toBe('none');
  });

  it('throws on invalid response structure', async () => {
    mockParse.mockResolvedValueOnce({
      parsed_output: null,
      content: [{ type: 'text', text: '{"bad": "response"}' }],
      stop_reason: 'end_turn',
    });

    await expect(analyzer.analyze(content, rules, overrides, promptContext)).rejects.toThrow();
  });
});
