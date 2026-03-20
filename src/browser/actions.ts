import type { AnalysisResult } from '../analysis/types.js';
import type { ConfidenceThresholds } from '../config/schema.js';

type ActionTaken = 'removed' | 'flagged' | 'none';

function determineAction(
  analysis: AnalysisResult,
  thresholds: ConfidenceThresholds,
): ActionTaken {
  if (analysis.violation_type === 'none') {
    return 'none';
  }

  if (analysis.confidence >= thresholds.auto_remove) {
    console.log(
      `  [OBSERVE] Would remove (confidence: ${(analysis.confidence * 100).toFixed(0)}%, reason: ${analysis.removal_reason})`,
    );
    return 'removed';
  }

  if (analysis.confidence >= thresholds.flag_for_review) {
    console.log(
      `  [OBSERVE] Would flag for review (confidence: ${(analysis.confidence * 100).toFixed(0)}%)`,
    );
    return 'flagged';
  }

  return 'none';
}

export { determineAction };
export type { ActionTaken };
