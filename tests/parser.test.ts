import { parseLogLine } from '../src/parser';
import { normalizeTimestamp } from '../src/utils/time';
import { normalizeResponseTime, normalizeStatusCode } from '../src/parser/normalize';
import { MetricsAccumulator } from '../src/analyzer/metrics';

describe('Log Analyzer Parser Suite', () => {
  describe('Time Normalizer', () => {
    it('should parse ISO string', () => {
      const ts = '2024-03-15T14:23:01Z';
      expect(normalizeTimestamp(ts)).toBe('2024-03-15T14:23:01.000Z');
    });

    it('should parse YYYY/MM/DD HH:mm:ss', () => {
      const ts = '2024/03/15 14:23:01';
      expect(normalizeTimestamp(ts)).toBe(new Date('2024-03-15 14:23:01').toISOString());
    });

    it('should parse epoch timestamps', () => {
      const ts = '1710512581';
      expect(normalizeTimestamp(ts)).toBe(new Date(1710512581000).toISOString());
    });
  });

  describe('Response Time Normalizer', () => {
    it('should normalize units with ms', () => {
      expect(normalizeResponseTime('142ms')).toBe(142);
    });

    it('should normalize units with s', () => {
      expect(normalizeResponseTime('0.142s')).toBe(142);
    });

    it('should handle raw numbers', () => {
      expect(normalizeResponseTime('142')).toBe(142);
    });

    it('should handle missing indicator', () => {
      expect(normalizeResponseTime('-')).toBeNull();
    });
  });

  describe('Line Parsers', () => {
    it('should parse standard space separated format', () => {
      const line = '2024-03-15T14:23:01Z 192.168.1.42 GET /api/users 200 142ms';
      const res = parseLogLine(line);
      expect(res.success).toBe(true);
      expect(res.entry?.ip).toBe('192.168.1.42');
      expect(res.entry?.method).toBe('GET');
      expect(res.entry?.endpoint).toBe('/api/users');
      expect(res.entry?.statusCode).toBe(200);
      expect(res.entry?.responseTimeMs).toBe(142);
    });

    it('should parse JSON logs', () => {
      const line = '{"timestamp":"2024-03-15T14:23:01Z","ip":"1.1.1.1","method":"GET","endpoint":"/test","statusCode":200,"responseTimeMs":50}';
      const res = parseLogLine(line);
      expect(res.success).toBe(true);
      expect(res.entry?.ip).toBe('1.1.1.1');
      expect(res.entry?.endpoint).toBe('/test');
    });

    it('should catch malformed lines gracefully without crashing', () => {
      const line = 'Malformed invalid log entry text string';
      const res = parseLogLine(line);
      expect(res.success).toBe(false);
      expect(res.isMalformed).toBe(true);
    });
  });

  describe('MetricsAccumulator', () => {
    it('should calculate correct metrics aggregates', () => {
      const metrics = new MetricsAccumulator();
      metrics.addEntry({
        timestamp: '2024-03-15T14:23:01.000Z',
        ip: '192.168.1.42',
        method: 'GET',
        endpoint: '/api/users',
        statusCode: 200,
        responseTimeMs: 100,
        rawLine: ''
      }, 1);

      metrics.addEntry({
        timestamp: '2024-03-15T14:24:01.000Z',
        ip: '192.168.1.42',
        method: 'POST',
        endpoint: '/api/checkout',
        statusCode: 500,
        responseTimeMs: 200,
        rawLine: ''
      }, 2);

      metrics.addMalformed(3, 'Malformed line test');

      expect(metrics.totalRequests).toBe(2);
      expect(metrics.malformedLines).toBe(1);
      expect(metrics.getAverageResponseTime()).toBe(150);
      expect(metrics.successCount).toBe(1);
      expect(metrics.errorCount).toBe(1);
    });
  });
});
