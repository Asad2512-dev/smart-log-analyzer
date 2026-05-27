/**
 * Parses and normalizes various timestamp formats into an ISO 8601 string.
 * Supported formats:
 * - 2024-03-15T14:23:01Z (ISO format)
 * - 2024/03/15 14:23:01
 * - 15-Mar-2024 14:23:01
 * - 1710512581 (Unix epoch seconds)
 */
export function normalizeTimestamp(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  // 1. Unix timestamp (epoch seconds)
  if (/^\d{10}$/.test(trimmed)) {
    const epochSec = parseInt(trimmed, 10);
    return new Date(epochSec * 1000).toISOString();
  }

  // 2. YYYY/MM/DD HH:mm:ss format
  if (/^\d{4}\/\d{2}\/\d{2}\s+\d{2}:\d{2}:\d{2}$/.test(trimmed)) {
    const parsed = new Date(trimmed.replace(/\//g, '-'));
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString();
    }
  }

  // 3. General formats (including ISO and "15-Mar-2024 14:23:01")
  const dateObj = new Date(trimmed);
  if (!isNaN(dateObj.getTime())) {
    return dateObj.toISOString();
  }

  return null;
}
