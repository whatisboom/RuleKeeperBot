import type { RedditContent } from './types.js';

function buildAnalysisPrompt(
  content: RedditContent,
  rules: string[],
  overrides: string[],
  promptContext: string,
): string {
  const allRules = [
    ...rules.map((r, i) => `${i + 1}. ${r}`),
    ...overrides.map((o) => `- [Override] ${o}`),
  ].join('\n');

  const contentSection = content.type === 'submission'
    ? [
        content.title ? `Title: ${content.title}` : null,
        `Body: ${content.body}`,
        content.flair ? `Flair: ${content.flair}` : null,
        content.url ? `URL: ${content.url}` : null,
      ].filter(Boolean).join('\n')
    : `Comment: ${content.body}`;

  const contextSection = promptContext
    ? `\n## Additional Context\n${promptContext}\n`
    : '';

  return `You are a Reddit moderator assistant for r/${content.subreddit}.

## Subreddit Rules
${allRules}
${contextSection}
## ${content.type === 'submission' ? 'Post' : 'Comment'} to Analyze
${contentSection}
Author: u/${content.author} (account age: ${content.author_account_age_days} days, karma: ${content.author_karma})

## Task
Analyze this ${content.type} for rule violations including spam, self-promotion, toxicity, scams, off-topic content, and formatting issues. Consider the author's account age and karma as signals.`;
}

export { buildAnalysisPrompt };
