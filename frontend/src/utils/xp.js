export function xpRequired(level) {
  return Math.floor(100 * Math.pow(level, 1.35));
}

export function levelProgress(level, xp) {
  const current = xpRequired(level);
  const next = xpRequired(level + 1);
  const pct = Math.min(100, Math.max(0, ((xp - current) / (next - current)) * 100));
  return { current, next, pct };
}
