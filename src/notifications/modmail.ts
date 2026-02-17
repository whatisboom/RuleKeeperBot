import type Snoowrap from 'snoowrap';
import type { DecisionRow } from '../storage/repository.js';
import type { Notifier } from './notifier.js';

class ModmailNotifier implements Notifier {
  private reddit: Snoowrap;

  constructor(reddit: Snoowrap) {
    this.reddit = reddit;
  }

  async notify(decision: DecisionRow): Promise<void> {
    const subject = `[mod-bot] Flagged: ${decision.violation_type} (${(decision.confidence * 100).toFixed(0)}% confidence)`;
    const body = [
      `**Post:** https://reddit.com/${decision.reddit_id}`,
      `**Author:** u/${decision.author}`,
      `**Subreddit:** r/${decision.subreddit}`,
      `**Violation:** ${decision.violation_type}`,
      `**Confidence:** ${(decision.confidence * 100).toFixed(0)}%`,
      `**Reasoning:** ${decision.reasoning}`,
      `**Preview:** ${decision.content_preview}`,
    ].join('\n\n');

    await this.reddit.composeMessage({
      to: `/r/${decision.subreddit}`,
      subject,
      text: body,
    });
  }
}

export { ModmailNotifier };
