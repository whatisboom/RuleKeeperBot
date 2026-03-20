import type { Page } from 'playwright';
import type { RedditContent } from '../analysis/types.js';

interface ScrapedPost {
  id: string;
  subreddit: string;
  author: string;
  title: string;
  body: string;
  flair: string | undefined;
  url: string | undefined;
}

function parsePostId(permalink: string): string | undefined {
  const match = permalink.match(/\/comments\/([a-z0-9]+)\//);
  return match ? `t3_${match[1]}` : undefined;
}

function buildRedditContent(post: ScrapedPost): RedditContent {
  return {
    id: post.id,
    subreddit: post.subreddit,
    author: post.author,
    author_account_age_days: 0,
    author_karma: 0,
    title: post.title,
    body: post.body,
    flair: post.flair,
    url: post.url,
    type: 'submission',
  };
}

async function fetchNewSubmissions(
  page: Page,
  subreddit: string,
  afterId: string | undefined,
): Promise<RedditContent[]> {
  await page.goto(`https://www.reddit.com/r/${subreddit}/new/`, {
    waitUntil: 'domcontentloaded',
  });

  await page.waitForSelector('shreddit-post, [data-testid="post-container"]', {
    timeout: 15000,
  });

  const posts = await page.evaluate(() => {
    const postElements = document.querySelectorAll('shreddit-post');
    const results: Array<{
      permalink: string;
      author: string;
      title: string;
      body: string;
      flair: string;
    }> = [];

    for (const el of postElements) {
      const permalink = el.getAttribute('permalink') ?? '';
      const author = el.getAttribute('author') ?? '[deleted]';
      const title = el.getAttribute('post-title') ?? '';
      const body = el.getAttribute('content-href')
        ? '' // link post — no self-text in listing
        : (el.querySelector('[slot="text-body"]')?.textContent?.trim() ?? '');
      const flair = el.querySelector('flair-pill')?.textContent?.trim() ?? '';

      results.push({ permalink, author, title, body, flair });
    }

    return results;
  });

  const items: RedditContent[] = [];

  for (const post of posts) {
    const id = parsePostId(post.permalink);
    if (!id) continue;
    if (id === afterId) break;

    items.push(
      buildRedditContent({
        id,
        subreddit,
        author: post.author,
        title: post.title,
        body: post.body,
        flair: post.flair || undefined,
        url: undefined,
      }),
    );
  }

  return items;
}

export { fetchNewSubmissions, parsePostId, buildRedditContent };
