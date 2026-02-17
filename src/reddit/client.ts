import Snoowrap from 'snoowrap';

interface RedditCredentials {
  clientId: string;
  clientSecret: string;
  username: string;
  password: string;
  userAgent: string;
}

function createRedditClient(credentials: RedditCredentials): Snoowrap {
  const client = new Snoowrap({
    userAgent: credentials.userAgent,
    clientId: credentials.clientId,
    clientSecret: credentials.clientSecret,
    username: credentials.username,
    password: credentials.password,
  });

  client.config({
    requestDelay: 1500,
    continueAfterRatelimitError: true,
    warnings: false,
  });

  return client;
}

export { createRedditClient };
export type { RedditCredentials };
