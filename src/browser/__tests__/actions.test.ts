import { describe, it, expect } from 'vitest';
import { determineAction } from '../actions.js';
import type { AnalysisResult } from '../../analysis/types.js';
import type { ConfidenceThresholds } from '../../config/schema.js';

const thresholds: ConfidenceThresholds = {
  auto_remove: 0.95,
  flag_for_review: 0.60,
};

function makeAnalysis(overrides: Partial<AnalysisResult> = {}): AnalysisResult {
  return {
    violation_type: 'spam',
    confidence: 0.5,
    reasoning: 'test',
    suggested_action: 'remove',
    removal_reason: 'test reason',
    ...overrides,
  };
}

describe('determineAction', () => {
  it('returns "none" when violation_type is none', () => {
    const result = determineAction(makeAnalysis({ violation_type: 'none' }), thresholds);
    expect(result).toBe('none');
  });

  it('returns "removed" when confidence >= auto_remove threshold', () => {
    const result = determineAction(makeAnalysis({ confidence: 0.96 }), thresholds);
    expect(result).toBe('removed');
  });

  it('returns "flagged" when confidence >= flag_for_review threshold', () => {
    const result = determineAction(makeAnalysis({ confidence: 0.70 }), thresholds);
    expect(result).toBe('flagged');
  });

  it('returns "none" when confidence is below both thresholds', () => {
    const result = determineAction(makeAnalysis({ confidence: 0.30 }), thresholds);
    expect(result).toBe('none');
  });

  it('returns "removed" at exact auto_remove boundary', () => {
    const result = determineAction(makeAnalysis({ confidence: 0.95 }), thresholds);
    expect(result).toBe('removed');
  });
});
