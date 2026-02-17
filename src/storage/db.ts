import Database from 'better-sqlite3';

function initializeDb(db: Database.Database): void {
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  db.exec(`
    CREATE TABLE IF NOT EXISTS decisions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      reddit_id TEXT UNIQUE NOT NULL,
      subreddit TEXT NOT NULL,
      author TEXT NOT NULL,
      content_preview TEXT NOT NULL,
      violation_type TEXT NOT NULL,
      confidence REAL NOT NULL,
      reasoning TEXT NOT NULL,
      action_taken TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_decisions_reddit_id ON decisions(reddit_id);
    CREATE INDEX IF NOT EXISTS idx_decisions_subreddit ON decisions(subreddit);

    CREATE TABLE IF NOT EXISTS watermarks (
      subreddit TEXT NOT NULL,
      content_type TEXT NOT NULL,
      last_id TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      PRIMARY KEY (subreddit, content_type)
    );
  `);
}

function createDb(filePath: string): Database.Database {
  const db = new Database(filePath);
  initializeDb(db);
  return db;
}

export { initializeDb, createDb };
