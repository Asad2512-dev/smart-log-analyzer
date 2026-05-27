import { ParsedLogEntry } from '../types/log';
import { parseJsonLine } from './jsonParser';
import { parseRegexLine } from './regexParser';

/**
 * Parses a single log line applying the fallback strategy:
 * 1. Try parsing as JSON.
 * 2. If it is not a JSON log, try parsing using the regex token parser.
 * 3. Mark as malformed.
 */
export function parseLogLine(line: string): ParsedLogEntry {
  const trimmed = line.trim();
  if (!trimmed) {
    return { success: false, isMalformed: false, error: 'Empty line' };
  }

  // 1. Try JSON parser
  if (trimmed.startsWith('{')) {
    const jsonResult = parseJsonLine(line);
    if (jsonResult.success) {
      return jsonResult;
    }
  }

  // 2. Try Regex Parser
  const regexResult = parseRegexLine(line);
  if (regexResult.success) {
    return regexResult;
  }

  // 3. Fallback: Mark malformed
  return {
    success: false,
    isMalformed: true,
    error: regexResult.error || 'Parsing failed',
  };
}
export { normalizeTimestamp } from '../utils/time';
export { normalizeResponseTime, normalizeStatusCode } from './normalize';
export { parseJsonLine, parseRegexLine };
