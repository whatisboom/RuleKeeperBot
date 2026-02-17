import type Snoowrap from 'snoowrap';
import type { RedditContent } from '../analysis/types.js';

interface SnoowrapSubmission {
  id: string;
  title: string;
  selftext: string;
  link_flair_text: string | null;
  is_self: boolean;
  url: string;
  author: {
    name: string;
    created_utc: number;
    link_karma: number;
    comment_karma: number;
  };
}

interface SnoowrapComment {
  id: string;
  body: string;
  author: {
    name: string;
    created_utc: number;
    link_karma: number;
    comment_karma: number;
  };
}

async function fetchNewSubmissions(
  reddit: Snoowrap,
  subreddit: string,
  afterId: string | undefined,
): Promise<RedditContent[]> {
  const submissions = await (reddit.getSubreddit(subreddit) as unknown as { getNew: (opts: { limit: number }) => Promise<SnoowrapSubmission[]> }).getNew({ limit: 25 });

  const newItems: RedditContent[] = [];

  for (const sub of submissions) {
    const fullId = `t3_${sub.id}`;
    if (fullId === afterId) break;

    newItems.push({
      id: fullId,
      subreddit,
      author: sub.author.name,
      author_account_age_days: Math.floor(
        (Date.now() / 1000 - sub.author.created_utc) / 86400
      ),
      author_karma: sub.author.link_karma + sub.author.comment_karma,
      title: sub.title,
      body: sub.selftext,
      flair: sub.link_flair_text ?? undefined,
      url: sub.is_self ? undefined : sub.url,
      type: 'submission',
    });
  }

  return newItems;
}

async function fetchNewComments(
  reddit: Snoowrap,
  subreddit: string,
  afterId: string | undefined,
): Promise<RedditContent[]> {
  const comments = await (reddit.getSubreddit(subreddit) as unknown as { getNewComments: (opts: { limit: number }) => Promise<SnoowrapComment[]> }).getNewComments({ limit: 25 });

  const newItems: RedditContent[] = [];

  for (const comment of comments) {
    const fullId = `t1_${comment.id}`;
    if (fullId === afterId) break;

    newItems.push({
      id: fullId,
      subreddit,
      author: comment.author.name,
      author_account_age_days: Math.floor(
        (Date.now() / 1000 - comment.author.created_utc) / 86400
      ),
      author_karma: comment.author.link_karma + comment.author.comment_karma,
      body: comment.body,
      type: 'comment',
    });
  }

  return newItems;
}

export { fetchNewSubmissions, fetchNewComments };
