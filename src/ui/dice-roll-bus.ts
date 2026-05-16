export interface DiceRollPayload {
  label: string;
  difficulty: number;
  target: number;
  onComplete?: (result: { roll: number; passed: boolean }) => void;
}

let triggerDiceFn: ((payload: DiceRollPayload) => void) | null = null;

export function triggerDiceRoll(payload: DiceRollPayload) {
  triggerDiceFn?.(payload);
}

export function bindDiceRollTrigger(fn: ((payload: DiceRollPayload) => void) | null) {
  triggerDiceFn = fn;
}
