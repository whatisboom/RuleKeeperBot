import { chromium, type Browser, type BrowserContext, type Page } from 'playwright';
import { existsSync } from 'node:fs';
import { createInterface } from 'node:readline';

const SESSION_PATH = './data/reddit-session.json';

interface BrowserSession {
  browser: Browser;
  context: BrowserContext;
  page: Page;
}

function isLoginPage(url: string): boolean {
  return url.includes('/login') || url.includes('/account/login');
}

async function waitForEnter(message: string): Promise<void> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(message, () => {
      rl.close();
      resolve();
    });
  });
}

async function initBrowser(): Promise<BrowserSession> {
  const browser = await chromium.launch({ headless: false });

  const hasSession = existsSync(SESSION_PATH);
  const context = await browser.newContext(
    hasSession ? { storageState: SESSION_PATH } : undefined,
  );
  const page = await context.newPage();

  await ensureLoggedIn(page, context);

  return { browser, context, page };
}

async function ensureLoggedIn(page: Page, context: BrowserContext): Promise<void> {
  await page.goto('https://www.reddit.com', { waitUntil: 'domcontentloaded' });

  if (isLoginPage(page.url())) {
    await page.goto('https://www.reddit.com/login', { waitUntil: 'domcontentloaded' });
    console.log('\n=== Reddit Login Required ===');
    console.log('Please log in to Reddit in the browser window.');
    await waitForEnter('Press Enter here when you are logged in...\n');
    await context.storageState({ path: SESSION_PATH });
    console.log('Session saved.\n');
  }
}

async function closeBrowser(session: BrowserSession): Promise<void> {
  await session.context.close();
  await session.browser.close();
}

export { initBrowser, closeBrowser, ensureLoggedIn, isLoginPage };
export type { BrowserSession };
