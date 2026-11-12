export interface PositionSizeInput {
  accountEquity: number;
  riskPercent: number;
  entry: number;
  stop: number;
  /** Contract / share multiplier (1 for spot crypto/FX mini). */
  pointValue: number;
}

export interface PositionSizeResult {
  riskAmount: number;
  stopDistance: number;
  units: number;
  notional: number;
}

export function positionSize(input: PositionSizeInput): PositionSizeResult | { error: string } {
  const { accountEquity, riskPercent, entry, stop, pointValue } = input;
  if (!(accountEquity > 0)) return { error: "Account equity must be positive." };
  if (!(riskPercent > 0 && riskPercent <= 100)) return { error: "Risk % must be between 0 and 100." };
  if (!(entry > 0 && stop > 0)) return { error: "Entry and stop must be positive prices." };
  if (entry === stop) return { error: "Stop must differ from entry." };
  if (!(pointValue > 0)) return { error: "Point value must be positive." };
  const riskAmount = accountEquity * (riskPercent / 100);
  const stopDistance = Math.abs(entry - stop);
  const units = riskAmount / (stopDistance * pointValue);
  const notional = units * entry * pointValue;
  return { riskAmount, stopDistance, units, notional };
}
