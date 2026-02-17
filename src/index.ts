import 'dotenv/config';
import { loadConfig } from './config/loader.js';
import { createDb } from './storage/db.js';
import { DecisionRepository } from './storage/repository.js';
import { createRedditClient } from './reddit/client.js';
import { RulesCache } from './reddit/rules.js';
import { fetchNewSubmissions, fetchNewComments } from './reddit/poller.js';
import { Analyzer } from './analysis/analyzer.js';
import { determineAndExecuteAction } from './reddit/actions.js';
import { ModmailNotifier } from './notifications/modmail.js';
import type { SubredditConfig } from './config/schema.js';
import type { RedditContent } from './analysis/types.js';

const config = loadConfig('./config/subreddits.yaml');

const db = createDb('./data/mod-bot.db');
const repo = new DecisionRepository(db);

const reddit = createRedditClient({
  clientId: process.env['REDDIT_CLIENT_ID']!,
  clientSecret: process.env['REDDIT_CLIENT_SECRET']!,
  refreshToken: process.env['REDDIT_REFRESH_TOKEN']!,
  userAgent: process.env['REDDIT_USER_AGENT'] ?? 'RuleKeeperBot/0.1.0',
});

const rulesCache = new RulesCache(async (subreddit: string) => {
  const result = await (reddit.getSubreddit(subreddit) as unknown as {
    getRules: () => Promise<{ rules: Array<{ short_name: string; description: string }> }>;
  }).getRules();
  return result.rules.map((r) => `${r.short_name}: ${r.description}`);
}, 24);

const analyzer = new Analyzer(process.env['ANTHROPIC_API_KEY']!);
const notifier = new ModmailNotifier(reddit);

async function processContent(
  content: RedditContent,
  subConfig: SubredditConfig,
  rules: string[],
): Promise<void> {
  if (repo.exists(content.id)) return;

  console.log(`Analyzing ${content.type} ${content.id} in r/${content.subreddit}...`);

  const analysis = await analyzer.analyze(
    content,
    rules,
    subConfig.rule_overrides,
    subConfig.prompt_context,
  );

  const actionTaken = await determineAndExecuteAction(
    {
      reddit,
      redditId: content.id,
      subreddit: content.subreddit,
      thresholds: subConfig.confidence_thresholds,
    },
    analysis,
  );

  const decision = {
    reddit_id: content.id,
    subreddit: content.subreddit,
    author: content.author,
    content_preview: (content.title ?? content.body).slice(0, 200),
    violation_type: analysis.violation_type,
    confidence: analysis.confidence,
    reasoning: analysis.reasoning,
    action_taken: actionTaken,
  };

  repo.insertDecision(decision);

  if (actionTaken === 'flagged') {
    const row = repo.getDecision(content.id)!;
    await notifier.notify(row);
  }

  console.log(
    `  -> ${analysis.violation_type} (${(analysis.confidence * 100).toFixed(0)}%) -> ${actionTaken}`
  );
}

async function pollSubreddit(
  subredditName: string,
  subConfig: SubredditConfig,
): Promise<void> {
  const rules = await rulesCache.getRules(subredditName);

  if (subConfig.monitor.includes('submissions')) {
    const lastSubId = repo.getWatermark(subredditName, 'submission');
    const submissions = await fetchNewSubmissions(reddit, subredditName, lastSubId);

    for (const sub of submissions) {
      await processContent(sub, subConfig, rules);
    }

    if (submissions.length > 0) {
      repo.setWatermark(subredditName, 'submission', submissions[0].id);
    }
  }

  if (subConfig.monitor.includes('comments')) {
    const lastCommentId = repo.getWatermark(subredditName, 'comment');
    const comments = await fetchNewComments(reddit, subredditName, lastCommentId);

    for (const comment of comments) {
      await processContent(comment, subConfig, rules);
    }

    if (comments.length > 0) {
      repo.setWatermark(subredditName, 'comment', comments[0].id);
    }
  }
}

function startPolling(): void {
  console.log('mod-bot starting...');

  for (const [name, subConfig] of Object.entries(config.subreddits)) {
    if (!subConfig.enabled) {
      console.log(`Skipping r/${name} (disabled)`);
      continue;
    }

    console.log(`Monitoring r/${name} every ${subConfig.poll_interval_seconds}s`);

    // Initial poll
    pollSubreddit(name, subConfig).catch((err: unknown) =>
      console.error(`Error polling r/${name}:`, err)
    );

    // Recurring poll
    setInterval(() => {
      pollSubreddit(name, subConfig).catch((err: unknown) =>
        console.error(`Error polling r/${name}:`, err)
      );
    }, subConfig.poll_interval_seconds * 1000);
  }
}

process.on('SIGINT', () => {
  console.log('Shutting down...');
  db.close();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Shutting down...');
  db.close();
  process.exit(0);
});

startPolling();
