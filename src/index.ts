import 'dotenv/config';
import { loadConfig } from './config/loader.js';
import { createDb } from './storage/db.js';
import { DecisionRepository } from './storage/repository.js';
import { initBrowser, closeBrowser, type BrowserSession } from './browser/session.js';
import { RulesCache, fetchSubredditRules } from './browser/rules.js';
import { fetchNewSubmissions } from './browser/scraper.js';
import { Analyzer } from './analysis/analyzer.js';
import { determineAction } from './browser/actions.js';
import type { SubredditConfig } from './config/schema.js';
import type { RedditContent } from './analysis/types.js';

const config = loadConfig('./config/subreddits.yaml');

const db = createDb('./data/mod-bot.db');
const repo = new DecisionRepository(db);

const analyzer = new Analyzer(process.env['ANTHROPIC_API_KEY']!);

let session: BrowserSession;

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

  const actionTaken = determineAction(analysis, subConfig.confidence_thresholds);

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

  console.log(
    `  -> ${analysis.violation_type} (${(analysis.confidence * 100).toFixed(0)}%) -> ${actionTaken} [OBSERVE]`,
  );
}

async function pollSubreddit(
  subredditName: string,
  subConfig: SubredditConfig,
  rulesCache: RulesCache,
): Promise<void> {
  const rules = await rulesCache.getRules(subredditName);

  const lastSubId = repo.getWatermark(subredditName, 'submission');
  const submissions = await fetchNewSubmissions(session.page, subredditName, lastSubId);

  for (const sub of submissions) {
    await processContent(sub, subConfig, rules);
  }

  if (submissions.length > 0) {
    repo.setWatermark(subredditName, 'submission', submissions[0].id);
  }
}

async function startPolling(): Promise<void> {
  console.log('RuleKeeperBot starting... [OBSERVE MODE]');

  session = await initBrowser();

  const rulesCache = new RulesCache(
    (subreddit: string) => fetchSubredditRules(session.page, subreddit),
    24,
  );

  for (const [name, subConfig] of Object.entries(config.subreddits)) {
    if (!subConfig.enabled) {
      console.log(`Skipping r/${name} (disabled)`);
      continue;
    }

    console.log(`Monitoring r/${name} every ${subConfig.poll_interval_seconds}s`);

    pollSubreddit(name, subConfig, rulesCache).catch((err: unknown) =>
      console.error(`Error polling r/${name}:`, err),
    );

    setInterval(() => {
      pollSubreddit(name, subConfig, rulesCache).catch((err: unknown) =>
        console.error(`Error polling r/${name}:`, err),
      );
    }, subConfig.poll_interval_seconds * 1000);
  }
}

async function shutdown(): Promise<void> {
  console.log('Shutting down...');
  if (session) {
    await closeBrowser(session);
  }
  db.close();
  process.exit(0);
}

process.on('SIGINT', () => { shutdown(); });
process.on('SIGTERM', () => { shutdown(); });

startPolling();
