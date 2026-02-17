import type Database from 'better-sqlite3';

interface DecisionInsert {
  reddit_id: string;
  subreddit: string;
  author: string;
  content_preview: string;
  violation_type: string;
  confidence: number;
  reasoning: string;
  action_taken: string;
}

interface DecisionRow extends DecisionInsert {
  id: number;
  created_at: string;
}

class DecisionRepository {
  private insertStmt: Database.Statement;
  private getStmt: Database.Statement;
  private existsStmt: Database.Statement;
  private getWatermarkStmt: Database.Statement;
  private upsertWatermarkStmt: Database.Statement;

  constructor(db: Database.Database) {
    this.insertStmt = db.prepare(`
      INSERT INTO decisions (reddit_id, subreddit, author, content_preview, violation_type, confidence, reasoning, action_taken)
      VALUES (@reddit_id, @subreddit, @author, @content_preview, @violation_type, @confidence, @reasoning, @action_taken)
    `);

    this.getStmt = db.prepare(`SELECT * FROM decisions WHERE reddit_id = ?`);
    this.existsStmt = db.prepare(`SELECT 1 FROM decisions WHERE reddit_id = ?`);

    this.getWatermarkStmt = db.prepare(
      `SELECT last_id FROM watermarks WHERE subreddit = ? AND content_type = ?`
    );

    this.upsertWatermarkStmt = db.prepare(`
      INSERT INTO watermarks (subreddit, content_type, last_id)
      VALUES (?, ?, ?)
      ON CONFLICT(subreddit, content_type) DO UPDATE SET
        last_id = excluded.last_id,
        updated_at = datetime('now')
    `);
  }

  insertDecision(decision: DecisionInsert): void {
    this.insertStmt.run(decision);
  }

  getDecision(redditId: string): DecisionRow | undefined {
    return this.getStmt.get(redditId) as DecisionRow | undefined;
  }

  exists(redditId: string): boolean {
    return this.existsStmt.get(redditId) !== undefined;
  }

  getWatermark(subreddit: string, contentType: string): string | undefined {
    const row = this.getWatermarkStmt.get(subreddit, contentType) as { last_id: string } | undefined;
    return row?.last_id;
  }

  setWatermark(subreddit: string, contentType: string, lastId: string): void {
    this.upsertWatermarkStmt.run(subreddit, contentType, lastId);
  }
}

export { DecisionRepository };
export type { DecisionInsert, DecisionRow };
