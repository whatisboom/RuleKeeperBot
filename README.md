# RuleKeeperBot

AI-assisted moderation tool for subreddits. Scrapes new submissions via Playwright browser automation, analyzes them against subreddit rules using Claude, and logs decisions to a local SQLite database for auditing.

Currently **observe-only**: the bot classifies what it would do (remove / flag / pass) but takes no real mod actions.

## How it works

1. Opens a headed Chromium browser and navigates to each subreddit's `/new/` feed
2. Scrapes new submissions using Reddit's `shreddit-post` web component
3. Fetches subreddit rules (cached for 24 hours)
4. Sends each post to the Anthropic API for rule-violation analysis
5. Logs the decision (violation type, confidence, action) to `data/mod-bot.db`

## Requirements

- Node.js 20+
- An [Anthropic API key](https://console.anthropic.com/)
- A Reddit account that moderates the subreddits in `config/subreddits.yaml`

## Setup

```bash
npm install
npx playwright install chromium
cp .env.example .env
# add your ANTHROPIC_API_KEY to .env
```

## Running

```bash
npm run start:dev
```

**First run:** A Chromium window opens and navigates to Reddit. Log in manually in the browser, then press Enter in the terminal. The session is saved to `data/reddit-session.json` — subsequent runs skip the login.

**Subsequent runs:** The saved session is loaded automatically and polling begins immediately.

Console output looks like:
```
RuleKeeperBot starting... [OBSERVE MODE]
Monitoring r/austinbeer every 300s
Analyzing submission t3_xyz in r/austinbeer...
  -> none (12%) -> none [OBSERVE]
  -> spam (97%) -> removed [OBSERVE]
```

## Configuration

Edit `config/subreddits.yaml`:

```yaml
dry_run: true   # no-op for now, all actions are observe-only

subreddits:
  austinbeer:
    enabled: true
    poll_interval_seconds: 300
    monitor: [submissions]
    confidence_thresholds:
      auto_remove: 0.95   # would remove if >= 95% confident
      flag_for_review: 0.6
    rule_overrides:       # rules to enforce beyond the subreddit's own rules
      - "No soliciting"
    prompt_context: "Casual beer community..."  # extra context for the AI
```

## Audit UI

Decisions are stored in `data/mod-bot.db`. To browse them with Datasette:

```bash
docker compose up datasette -d
# open http://localhost:8001
```

## Project structure

```
src/
  browser/
    session.ts      # Playwright browser init + session persistence
    scraper.ts      # scrapes r/<sub>/new/ for new submissions
    rules.ts        # scrapes r/<sub>/about/rules/ + TTL cache
    actions.ts      # classifies action (remove/flag/none), observe-only
  analysis/
    analyzer.ts     # Anthropic API calls
    prompts.ts      # prompt construction
    types.ts        # shared types (RedditContent, AnalysisResult)
  config/
    loader.ts       # loads and validates subreddits.yaml
    schema.ts       # Zod schemas
  storage/
    db.ts           # SQLite setup
    repository.ts   # decision + watermark queries
  index.ts          # orchestrator / polling loop
config/
  subreddits.yaml   # subreddit config
data/               # gitignored — SQLite db + session file live here
```

## Tests

```bash
npm test
```
