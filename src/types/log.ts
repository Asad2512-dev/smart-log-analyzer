export interface LogEntry {
  timestamp: string;
  ip: string;
  method: string;
  endpoint: string;
  statusCode: number | null; // Nullable to handle missing statuses like "-"
  responseTimeMs: number | null; // Nullable if missing or unable to compute
  userAgent?: string;
  referrer?: string;
  rawLine: string;
}

export interface ParsedLogEntry {
  success: boolean;
  entry?: LogEntry;
  error?: string;
  isMalformed: boolean;
}

export interface MetricSummary {
  totalRequests: number;
  malformedLines: number;
  successCount: number; // 2xx and 3xx response codes
  errorCount: number; // 4xx and 5xx response codes
  averageResponseTimeMs: number;
  statusBreakdown: Record<string, number>;
  topSlowestEndpoints: Array<{ endpoint: string; method: string; timeMs: number }>;
  topIps: Array<{ ip: string; count: number }>;
  errorSpikes: Array<{ window: string; count: number }>;
  suspiciousEndpoints: Array<{ endpoint: string; count: number; reason: string }>;
  formatAnomalies: Array<{ line: number; reason: string }>;
}

export interface AnalyzerOptions {
  summary?: boolean;
  topSlowest?: number;
  errors?: boolean;
  statusBreakdown?: boolean;
  topIps?: boolean;
  exportJson?: string;
  exportCsv?: string;
}
