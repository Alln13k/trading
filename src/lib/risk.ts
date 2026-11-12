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

/** Planned R = |target − entry| / |entry − stop|. */
export function plannedR(entry: number, stop: number, target: number): { r: number } | { error: string } {
  if (!(entry > 0) || !(stop > 0) || !(target > 0)) {
    return { error: "Entry, stop, and target must be positive prices." };
  }
  const risk = Math.abs(entry - stop);
  const reward = Math.abs(target - entry);
  if (!(risk > 0)) return { error: "Stop must differ from entry." };
  if (!(reward > 0)) return { error: "Target must differ from entry." };
  return { r: reward / risk };
}

/** Portfolio heat = sum of open stop-risk / equity. Positions without a stop are counted, not guessed. */
export function portfolioHeat(
  equity: number,
  risks: Array<number | null>
): { heat: number; openRisk: number; unstopped: number } | { error: string } {
  if (!(equity > 0)) return { error: "Equity must be positive to measure portfolio heat." };
  let openRisk = 0;
  let unstopped = 0;
  for (const risk of risks) {
    if (risk === null || !(risk >= 0)) unstopped += 1;
    else openRisk += risk;
  }
  return { heat: openRisk / equity, openRisk, unstopped };
}
