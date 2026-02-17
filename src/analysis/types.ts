import { z } from 'zod';

const ViolationTypeSchema = z.enum([
  'spam',
  'self_promotion',
  'toxicity',
  'off_topic',
  'format_violation',
  'scam',
  'none',
]);

const SuggestedActionSchema = z.enum(['remove', 'flag', 'warn', 'none']);

const AnalysisResultSchema = z.object({
  violation_type: ViolationTypeSchema,
  confidence: z.number().min(0).max(1),
  reasoning: z.string(),
  suggested_action: SuggestedActionSchema,
  removal_reason: z.string(),
});

type ViolationType = z.infer<typeof ViolationTypeSchema>;
type SuggestedAction = z.infer<typeof SuggestedActionSchema>;
type AnalysisResult = z.infer<typeof AnalysisResultSchema>;

interface RedditContent {
  id: string;
  subreddit: string;
  author: string;
  author_account_age_days: number;
  author_karma: number;
  title?: string;
  body: string;
  flair?: string;
  url?: string;
  type: 'submission' | 'comment';
}

export { AnalysisResultSchema, ViolationTypeSchema, SuggestedActionSchema };
export type { AnalysisResult, ViolationType, SuggestedAction, RedditContent };
