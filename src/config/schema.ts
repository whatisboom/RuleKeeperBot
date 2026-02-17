import { z } from 'zod';

const ConfidenceThresholdsSchema = z.object({
  auto_remove: z.number().min(0).max(1),
  flag_for_review: z.number().min(0).max(1),
});

const MonitorTargetSchema = z.enum(['submissions', 'comments']);

const SubredditConfigSchema = z.object({
  enabled: z.boolean(),
  poll_interval_seconds: z.number().int().positive().default(60),
  monitor: z.array(MonitorTargetSchema).min(1),
  rules_cache_ttl_hours: z.number().positive().default(24),
  confidence_thresholds: ConfidenceThresholdsSchema,
  rule_overrides: z.array(z.string()).default([]),
  prompt_context: z.string().default(''),
});

const AppConfigSchema = z.object({
  dry_run: z.boolean().default(false),
  subreddits: z.record(z.string(), SubredditConfigSchema),
});

type ConfidenceThresholds = z.infer<typeof ConfidenceThresholdsSchema>;
type SubredditConfig = z.infer<typeof SubredditConfigSchema>;
type AppConfig = z.infer<typeof AppConfigSchema>;

export {
  AppConfigSchema,
  SubredditConfigSchema,
  ConfidenceThresholdsSchema,
};
export type { AppConfig, SubredditConfig, ConfidenceThresholds };
