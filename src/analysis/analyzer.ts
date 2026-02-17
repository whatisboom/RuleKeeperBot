import Anthropic from '@anthropic-ai/sdk';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import { AnalysisResultSchema } from './types.js';
import type { AnalysisResult, RedditContent } from './types.js';
import { buildAnalysisPrompt } from './prompts.js';

class Analyzer {
  private client: Anthropic;

  constructor(apiKey: string) {
    this.client = new Anthropic({
      apiKey,
      maxRetries: 3,
      timeout: 30_000,
    });
  }

  async analyze(
    content: RedditContent,
    rules: string[],
    overrides: string[],
    promptContext: string,
  ): Promise<AnalysisResult> {
    const prompt = buildAnalysisPrompt(content, rules, overrides, promptContext);

    const response = await this.client.messages.parse({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
      output_config: {
        format: zodOutputFormat(AnalysisResultSchema),
      },
    });

    if (!response.parsed_output) {
      const textBlock = response.content[0];
      if (textBlock.type !== 'text') {
        throw new Error(`Unexpected response block type: ${textBlock.type}`);
      }
      return AnalysisResultSchema.parse(JSON.parse(textBlock.text));
    }

    return response.parsed_output;
  }
}

export { Analyzer };
