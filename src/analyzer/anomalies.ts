import { MetricsAccumulator } from './metrics';

export interface SpikeWindow {
  window: string;
  count: number;
}

export interface SuspiciousEndpointResult {
  endpoint: string;
  count: number;
  reason: string;
}

/**
 * Calculates error spike windows. Standard: detect 1-minute window
 * with high numbers of errors.
 */
export function detectErrorSpikes(accumulator: MetricsAccumulator, threshold = 5): SpikeWindow[] {
  return Object.entries(accumulator.timeWindows)
    .map(([window, count]) => ({ window, count }))
    .filter((w) => w.count >= threshold)
    .sort((a, b) => b.count - a.count);
}

/**
 * Normalizes lists of suspicious endpoints.
 */
export function getSuspiciousEndpoints(
  accumulator: MetricsAccumulator,
  minHits = 3,
): SuspiciousEndpointResult[] {
  return Array.from(accumulator.suspectEndpointsMap.entries())
    .map(([endpoint, data]) => ({
      endpoint,
      count: data.count,
      reason: Array.from(data.reasons).join(', '),
    }))
    .filter((item) => item.count >= minHits)
    .sort((a, b) => b.count - a.count);
}
