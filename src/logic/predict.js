export function median(values) {
  if (!values || values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

export function predictNextDate(history, lastBoughtAt) {
  if (!history || history.length < 3) return null;
  const recent = history
    .slice(0, 5)
    .map((h) => h.interval_days)
    .filter((d) => d && d > 0);
  if (recent.length < 3) return null;
  const m = median(recent);
  if (!m || !lastBoughtAt) return null;
  const last = new Date(lastBoughtAt);
  return new Date(last.getTime() + m * 86400000).toISOString();
}

export function isSoonByPrediction(predictedNext) {
  if (!predictedNext) return false;
  const threshold = new Date(predictedNext).getTime() - 2 * 86400000;
  return Date.now() >= threshold;
}
