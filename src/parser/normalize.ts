/**
 * Standardize response time to a floating point/integer representing milliseconds.
 * Supported formats:
 * - "142ms" -> 142
 * - "0.142s" -> 142
 * - "142" -> 142
 */
export function normalizeResponseTime(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed || trimmed === '-') return null;

  // Check format: ends with 'ms'
  if (trimmed.endsWith('ms')) {
    const val = parseFloat(trimmed.slice(0, -2));
    return isNaN(val) ? null : val;
  }

  // Check format: ends with 's'
  if (trimmed.endsWith('s')) {
    const val = parseFloat(trimmed.slice(0, -1));
    return isNaN(val) ? null : val * 1000;
  }

  // Check format: numeric raw
  const val = parseFloat(trimmed);
  return isNaN(val) ? null : val;
}

/**
 * Standardize status codes. Missing is denoted as "-" which parses as null.
 */
export function normalizeStatusCode(raw: string): number | null {
  const trimmed = raw.trim();
  if (trimmed === '-' || !trimmed) return null;
  const parsed = parseInt(trimmed, 10);
  return isNaN(parsed) ? null : parsed;
}
