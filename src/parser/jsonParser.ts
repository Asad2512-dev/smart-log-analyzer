import { ParsedLogEntry } from '../types/log';
import { normalizeTimestamp } from '../utils/time';
import { normalizeResponseTime, normalizeStatusCode } from './normalize';

/**
 * Attempts to parse a log line as JSON.
 */
export function parseJsonLine(line: string): ParsedLogEntry {
  const trimmed = line.trim();
  if (!trimmed.startsWith('{') || !trimmed.endsWith('}')) {
    return { success: false, isMalformed: true };
  }

  try {
    const data = JSON.parse(trimmed);

    // Map properties dynamic-friendly. Handle common log property names.
    const rawTimestamp = data.timestamp || data.time || data.date;
    const ip = data.ip || data.clientIp || data.client_ip || '0.0.0.0';
    const method = data.method || data.httpMethod || data.http_method || 'GET';
    const endpoint = data.endpoint || data.url || data.path || '/';
    const rawStatus = data.statusCode || data.status || data.responseCode || null;
    const rawResponseTime = data.responseTime || data.duration || data.responseTimeMs || null;
    const userAgent = data.userAgent || data.user_agent || undefined;
    const referrer = data.referrer || data.referer || undefined;

    if (!rawTimestamp) {
      return { success: false, isMalformed: true, error: 'JSON missing timestamp' };
    }

    const timestamp = normalizeTimestamp(String(rawTimestamp));
    if (!timestamp) {
      return { success: false, isMalformed: true, error: 'JSON invalid timestamp format' };
    }

    return {
      success: true,
      isMalformed: false,
      entry: {
        timestamp,
        ip: String(ip),
        method: String(method),
        endpoint: String(endpoint),
        statusCode: rawStatus !== null ? normalizeStatusCode(String(rawStatus)) : null,
        responseTimeMs:
          rawResponseTime !== null ? normalizeResponseTime(String(rawResponseTime)) : null,
        userAgent: userAgent ? String(userAgent) : undefined,
        referrer: referrer ? String(referrer) : undefined,
        rawLine: line,
      },
    };
  } catch (err: unknown) {
    return {
      success: false,
      isMalformed: true,
      error: err instanceof Error ? err.message : 'Invalid JSON structure',
    };
  }
}
