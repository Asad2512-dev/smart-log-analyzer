import { ParsedLogEntry } from '../types/log';
import { normalizeTimestamp } from '../utils/time';
import { normalizeResponseTime, normalizeStatusCode } from './normalize';

/**
 * Regex patterns for standard line formats.
 * Pattern 1: Space-separated values where values can be quoted string constants.
 * standard layout: `2024-03-15T14:23:01Z 192.168.1.42 GET /api/users 200 142ms`
 * Or with extra fields, referrers, and user agents:
 * `2024-03-15T14:23:01Z 192.168.1.42 GET /api/users 200 142ms "Mozilla/5.0" "https://google.com"`
 */
export function parseRegexLine(line: string): ParsedLogEntry {
  const trimmed = line.trim();
  if (!trimmed) {
    return { success: false, isMalformed: true, error: 'Empty line' };
  }

  // Tokenize considering spaces, but preserve quoted blocks (which could contain spaces)
  // Match groups:
  // 1: Quoted string (e.g. "Mozilla/5.0 ...")
  // 2: Non-space sequence (unquoted token)
  const matches = trimmed.match(/"[^"\\]*(?:\\.[^"\\]*)*"|[^"\s]+/g);
  if (!matches || matches.length < 5) {
    return { success: false, isMalformed: true, error: 'Too few fields in log line' };
  }

  // Expect:
  // index 0: timestamp (e.g. 2024-03-15T14:23:01Z)
  // index 1: ip (e.g. 192.168.1.42)
  // index 2: method (e.g. GET)
  // index 3: endpoint (e.g. /api/users)
  // index 4: status (e.g. 200 or -)
  // index 5: response time (e.g. 142ms or 0.142s or 142) - Optional/Nullable
  // index 6/7: user agent, referrer (optional)

  const rawTimestamp = matches[0].replace(/"/g, '');
  const rawIp = matches[1].replace(/"/g, '');
  const rawMethod = matches[2].replace(/"/g, '');
  const rawEndpoint = matches[3].replace(/"/g, '');
  const rawStatus = matches[4].replace(/"/g, '');
  const rawResponseTime = matches[5] ? matches[5].replace(/"/g, '') : null;

  // Cleanup optional trailing fields
  let userAgent: string | undefined;
  let referrer: string | undefined;

  if (matches.length > 6) {
    userAgent = matches[6].replace(/"/g, '');
  }
  if (matches.length > 7) {
    referrer = matches[7].replace(/"/g, '');
  }

  // Validate and parse values
  const timestamp = normalizeTimestamp(rawTimestamp);
  if (!timestamp) {
    return { success: false, isMalformed: true, error: `Invalid timestamp: ${rawTimestamp}` };
  }

  const statusCode = normalizeStatusCode(rawStatus);
  const responseTimeMs = rawResponseTime ? normalizeResponseTime(rawResponseTime) : null;

  return {
    success: true,
    isMalformed: false,
    entry: {
      timestamp,
      ip: rawIp,
      method: rawMethod.toUpperCase(),
      endpoint: rawEndpoint,
      statusCode,
      responseTimeMs,
      userAgent,
      referrer,
      rawLine: line,
    },
  };
}
