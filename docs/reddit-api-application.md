# Reddit API Application — Draft

## Application Name
RuleKeeperBot

## Description of Use Case

RuleKeeperBot is an AI-assisted moderation tool for subreddits I personally moderate. It supplements manual moderation by analyzing new posts and comments for rule violations (spam, scams, toxicity, off-topic content) and taking tiered action based on configurable confidence thresholds.

The bot polls for new content, evaluates it against each subreddit's rules, and either auto-removes clear violations with a removal reason, flags borderline content for human moderator review via modmail, or logs the decision with no action. All moderation decisions are logged locally for auditing and transparency.

## Subreddits

- r/austinbeer
- r/austinclassifieds
- r/austinhousing

I am a moderator of all three subreddits. The bot will only operate in subreddits where it has moderator permissions.

## API Actions / Scopes Required

- **read** — Fetch new submissions and comments
- **modposts** — Remove rule-violating content, distinguish and sticky removal reason comments
- **modmail** — Send modmail notifications to the mod team for flagged content
- **modflair** — Read post flair for context during analysis
- **submit** — Post removal reason comments on removed content

## AI Component Disclosure

Individual posts and comments are sent to the Anthropic API (Claude Haiku model) for real-time content analysis. This is inference only — no Reddit data is used for model training. Anthropic's API terms state that API inputs are not used for training purposes (https://www.anthropic.com/policies/privacy).

Data sent to the Anthropic API:
- Post title, body text, and flair
- Author username, account age, and karma (used as spam/scam signals)
- Subreddit rules (fetched via API and cached locally)

No data is shared, sold, licensed, or redistributed. Content previews (first 200 characters) are stored in a local SQLite database solely for the operator's moderation audit trail.

## Expected Request Volume

- 3 subreddits polled every 45–60 seconds
- ~4–6 API calls per poll cycle (fetching new posts, comments, and rules)
- Estimated ~300–500 API calls per hour during active periods
- Rate-limited client-side with 1.5-second request delay between calls

## Hosting

Self-hosted Docker container operated by me (the subreddit moderator). Single instance, not offered as a service to others.

## Contact

[your email here]
