import type { DecisionRow } from '../storage/repository.js';

interface Notifier {
  notify(decision: DecisionRow): Promise<void>;
}

export type { Notifier };
