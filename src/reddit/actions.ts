import type Snoowrap from 'snoowrap';
import type { AnalysisResult } from '../analysis/types.js';
import type { ConfidenceThresholds } from '../config/schema.js';

type ActionTaken = 'removed' | 'flagged' | 'none';

interface ActionContext {
  reddit: Snoowrap;
  redditId: string;
  subreddit: string;
  thresholds: ConfidenceThresholds;
}

async function determineAndExecuteAction(
  ctx: ActionContext,
  analysis: AnalysisResult,
): Promise<ActionTaken> {
  if (analysis.violation_type === 'none') {
    return 'none';
  }

  if (analysis.confidence >= ctx.thresholds.auto_remove) {
    await autoRemove(ctx.reddit, ctx.redditId, analysis.removal_reason);
    return 'removed';
  }

  if (analysis.confidence >= ctx.thresholds.flag_for_review) {
    return 'flagged';
  }

  return 'none';
}

async function autoRemove(
  reddit: Snoowrap,
  redditId: string,
  removalReason: string,
): Promise<void> {
  const item = redditId.startsWith('t1_')
    ? reddit.getComment(redditId.replace('t1_', ''))
    : reddit.getSubmission(redditId.replace('t3_', ''));

  const comment = await (item as unknown as { reply: (text: string) => Promise<unknown> }).reply(
    `This post has been removed by the moderation bot.\n\n**Reason:** ${removalReason}\n\nIf you believe this was an error, please contact the moderators.`
  );
  await (comment as unknown as { distinguish: (opts: { status: boolean; sticky: boolean }) => Promise<void> }).distinguish({ status: true, sticky: true });
  await (item as unknown as { remove: (opts: { spam: boolean }) => Promise<void> }).remove({ spam: false });
}

export { determineAndExecuteAction };
export type { ActionTaken };
