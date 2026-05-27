import { LogEntry } from '../types/log';

export class MetricsAccumulator {
  public totalRequests = 0;
  public malformedLines = 0;

  // Status structures
  public successCount = 0;
  public errorCount = 0;
  public statusBreakdown: Record<string, number> = {};

  // Latency metrics
  private totalResponseTimeMs = 0;
  private responseTimeCount = 0;
  private slowestEndpointsMap = new Map<string, { method: string; maxTime: number }>();

  // IP metrics
  public ipCounts: Record<string, number> = {};

  // Endpoint metrics
  public endpointCounts: Record<string, number> = {};

  // Spikes and anomaly tracking
  public timeWindows: Record<string, number> = {}; // Count errors per minute/hour window
  public errorTimestamps: string[] = [];
  public suspectEndpointsMap = new Map<string, { count: number; reasons: Set<string> }>();
  public formatAnomaliesList: Array<{ line: number; reason: string }> = [];

  private currentLineNo = 0;

  /**
   * Tracks a parsed log entry into standard accumulators.
   */
  public addEntry(entry: LogEntry, lineNo: number) {
    this.currentLineNo = lineNo;
    this.totalRequests++;

    // IP statistics
    this.ipCounts[entry.ip] = (this.ipCounts[entry.ip] || 0) + 1;

    // Endpoint statistics
    const epKey = `${entry.method} ${entry.endpoint}`;
    this.endpointCounts[epKey] = (this.endpointCounts[epKey] || 0) + 1;

    // Status code breakdowns
    if (entry.statusCode !== null) {
      const codeStr = String(entry.statusCode);
      this.statusBreakdown[codeStr] = (this.statusBreakdown[codeStr] || 0) + 1;

      if (entry.statusCode >= 200 && entry.statusCode < 400) {
        this.successCount++;
      } else if (entry.statusCode >= 400) {
        this.errorCount++;
        // Track spikes by window (1-minute bucket)
        if (entry.timestamp) {
          const windowKey = entry.timestamp.slice(0, 16); // "YYYY-MM-DDTHH:mm" format
          this.timeWindows[windowKey] = (this.timeWindows[windowKey] || 0) + 1;
          this.errorTimestamps.push(entry.timestamp);
        }
      }

      // Flag suspicious endpoints if we see excessive 401/403 (Authentication issues) or 404
      if (entry.statusCode === 401 || entry.statusCode === 403) {
        this.addSuspiciousEndpoint(entry.endpoint, 'Authorization failures');
      } else if (entry.statusCode === 404) {
        this.addSuspiciousEndpoint(entry.endpoint, 'Resource not found errors');
      }
    }

    // Response time calculations
    if (entry.responseTimeMs !== null) {
      this.totalResponseTimeMs += entry.responseTimeMs;
      this.responseTimeCount++;

      // Top slowest updates
      const key = `${entry.method} ${entry.endpoint}`;
      const current = this.slowestEndpointsMap.get(key);
      if (!current || entry.responseTimeMs > current.maxTime) {
        this.slowestEndpointsMap.set(key, { method: entry.method, maxTime: entry.responseTimeMs });
      }

      // Check if response time is anomalously slow (e.g. > 5 seconds)
      if (entry.responseTimeMs > 5000) {
        this.addSuspiciousEndpoint(entry.endpoint, 'High response latency');
      }
    }

    // Format anomalies checking (e.g. unknown protocols or HTTP methods in endpoints)
    if (!/^\/[a-zA-Z0-9_\-./]*$/.test(entry.endpoint)) {
      this.formatAnomaliesList.push({
        line: lineNo,
        reason: `Endpoint path format anomaly: "${entry.endpoint}"`,
      });
    }
  }

  /**
   * Tracks a malformed log line.
   */
  public addMalformed(lineNo: number, errorMsg?: string) {
    this.malformedLines++;
    this.formatAnomaliesList.push({
      line: lineNo,
      reason: `Malformed log format: ${errorMsg || 'Unable to match structure'}`,
    });
  }

  private addSuspiciousEndpoint(endpoint: string, reason: string) {
    const existing = this.suspectEndpointsMap.get(endpoint) || {
      count: 0,
      reasons: new Set<string>(),
    };
    existing.count++;
    existing.reasons.add(reason);
    this.suspectEndpointsMap.set(endpoint, existing);
  }

  // Getters
  public getAverageResponseTime(): number {
    return this.responseTimeCount === 0 ? 0 : this.totalResponseTimeMs / this.responseTimeCount;
  }

  public getTopSlowestEndpoints(
    limit = 10,
  ): Array<{ endpoint: string; method: string; timeMs: number }> {
    return Array.from(this.slowestEndpointsMap.entries())
      .map(([key, value]) => {
        const parts = key.split(' ');
        const method = value.method;
        const endpoint = parts.slice(1).join(' ');
        return { endpoint, method, timeMs: value.maxTime };
      })
      .sort((a, b) => b.timeMs - a.timeMs)
      .slice(0, limit);
  }

  public getTopIps(limit = 10): Array<{ ip: string; count: number }> {
    return Object.entries(this.ipCounts)
      .map(([ip, count]) => ({ ip, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }
}
