import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import { initializeDb } from '../db.js';
import { DecisionRepository } from '../repository.js';

describe('DecisionRepository', () => {
  let db: Database.Database;
  let repo: DecisionRepository;

  beforeEach(() => {
    db = new Database(':memory:');
    initializeDb(db);
    repo = new DecisionRepository(db);
  });

  afterEach(() => {
    db.close();
  });

  it('inserts and retrieves a decision', () => {
    repo.insertDecision({
      reddit_id: 't3_abc123',
      subreddit: 'austinbeer',
      author: 'testuser',
      content_preview: 'Check out my homebrew...',
      violation_type: 'self_promotion',
      confidence: 0.85,
      reasoning: 'Subtle self-promotion pattern',
      action_taken: 'flagged',
    });

    const decision = repo.getDecision('t3_abc123');
    expect(decision).toBeDefined();
    expect(decision!.subreddit).toBe('austinbeer');
    expect(decision!.confidence).toBe(0.85);
    expect(decision!.action_taken).toBe('flagged');
  });

  it('returns undefined for unknown reddit_id', () => {
    const decision = repo.getDecision('t3_nonexistent');
    expect(decision).toBeUndefined();
  });

  it('rejects duplicate reddit_id', () => {
    const entry = {
      reddit_id: 't3_abc123',
      subreddit: 'austinbeer',
      author: 'testuser',
      content_preview: 'Test',
      violation_type: 'none',
      confidence: 0.1,
      reasoning: 'Clean',
      action_taken: 'none',
    };
    repo.insertDecision(entry);
    expect(() => repo.insertDecision(entry)).toThrow();
  });

  it('checks existence of a reddit_id', () => {
    expect(repo.exists('t3_abc123')).toBe(false);
    repo.insertDecision({
      reddit_id: 't3_abc123',
      subreddit: 'austinbeer',
      author: 'testuser',
      content_preview: 'Test',
      violation_type: 'none',
      confidence: 0.1,
      reasoning: 'Clean',
      action_taken: 'none',
    });
    expect(repo.exists('t3_abc123')).toBe(true);
  });
});

describe('Watermarks', () => {
  let db: Database.Database;
  let repo: DecisionRepository;

  beforeEach(() => {
    db = new Database(':memory:');
    initializeDb(db);
    repo = new DecisionRepository(db);
  });

  afterEach(() => {
    db.close();
  });

  it('gets and sets submission watermark', () => {
    expect(repo.getWatermark('austinbeer', 'submission')).toBeUndefined();
    repo.setWatermark('austinbeer', 'submission', 't3_latest');
    expect(repo.getWatermark('austinbeer', 'submission')).toBe('t3_latest');
  });

  it('updates existing watermark', () => {
    repo.setWatermark('austinbeer', 'submission', 't3_first');
    repo.setWatermark('austinbeer', 'submission', 't3_second');
    expect(repo.getWatermark('austinbeer', 'submission')).toBe('t3_second');
  });
});
