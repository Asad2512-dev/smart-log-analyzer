import * as fs from 'fs';
import { stringify } from 'csv-stringify/sync';
import { MetricSummary } from '../types/log';
import { logger } from '../utils/logger';

import Table from 'cli-table3';
import boxen from 'boxen';

/**
 * Console-friendly renderer of the analysis report.
 */
/**
 * Console-friendly renderer of the analysis report.
 */
export function displayTerminalReport(summary: MetricSummary) {
  const titleText = logger.bold('📊 SMART LOG ANALYZER REPORT 📊');
  console.log(
    boxen(titleText, {
      padding: 1,
      margin: 1,
      borderStyle: 'double',
      borderColor: 'cyan',
      align: 'center',
    }),
  );

  const successRate =
    summary.totalRequests > 0
      ? ((summary.successCount / summary.totalRequests) * 100).toFixed(2)
      : '0.00';
  const errorRate =
    summary.totalRequests > 0
      ? ((summary.errorCount / summary.totalRequests) * 100).toFixed(2)
      : '0.00';

  // SECTION 1: Summary Dashboard
  console.log(logger.bold('📈 [1] SUMMARY DASHBOARD'));
  const summaryTable = new Table({
    head: [logger.highlight('Telemetry Item'), logger.highlight('Count')],
    colWidths: [35, 15],
  });
  summaryTable.push(
    ['Total Lines Processed', String(summary.totalRequests + summary.malformedLines)],
    ['Valid Requests', String(summary.totalRequests)],
    ['Malformed Lines', String(summary.malformedLines)],
    ['HTTP Success Rate', `${successRate}%`],
  );
  console.log(summaryTable.toString());

  // SECTION 2: Performance Insights
  console.log(`\n${logger.bold('⚡ [2] PERFORMANCE INSIGHTS')}`);
  console.log(
    `  - Average Response Time: ${logger.highlight(summary.averageResponseTimeMs.toFixed(2) + ' ms')}`,
  );
  const latencyTable = new Table({
    head: [logger.highlight('#'), logger.highlight('Endpoint'), logger.highlight('Latency')],
    colWidths: [6, 32, 12],
  });
  if (summary.topSlowestEndpoints.length === 0) {
    latencyTable.push(['-', 'No slow endpoints', '-']);
  } else {
    summary.topSlowestEndpoints.forEach((item, i) => {
      latencyTable.push([i + 1, `[${item.method}] ${item.endpoint}`, `${item.timeMs}ms`]);
    });
  }
  console.log(latencyTable.toString());

  // SECTION 3: Traffic Insights
  console.log(`\n${logger.bold('🌐 [3] TRAFFIC INSIGHTS')}`);
  const statusTable = new Table({
    head: [logger.highlight('HTTP Status Code'), logger.highlight('Frequency')],
    colWidths: [20, 30],
  });
  const sortedStatuses = Object.entries(summary.statusBreakdown).sort((a, b) => b[1] - a[1]);
  if (sortedStatuses.length === 0) {
    statusTable.push(['No status codes', '0']);
  } else {
    for (const [code, count] of sortedStatuses) {
      statusTable.push([`HTTP ${code}`, String(count)]);
    }
  }
  console.log(statusTable.toString());

  // SECTION 4: Reliability Insights
  console.log(`\n${logger.bold('🛡️ [4] RELIABILITY & SECURITY INSIGHTS')}`);
  console.log(
    `  - Error rate %: ${logger.highlight(errorRate + '%')} (${summary.errorCount} total failures)`,
  );
  if (summary.suspiciousEndpoints.length === 0) {
    console.log('  No anomalous endpoint failures detected.');
  } else {
    summary.suspiciousEndpoints.slice(0, 3).forEach((item) => {
      console.log(`  - [${item.count} failures] ${item.endpoint} (Reason: ${item.reason})`);
    });
  }

  // SECTION 5: Data Quality Report
  console.log(`\n${logger.bold('🔍 [5] DATA QUALITY REPORT')}`);
  console.log(`  - Malformed lines count: ${logger.highlight(String(summary.malformedLines))}`);
  if (summary.formatAnomalies.length === 0) {
    console.log('  All format structures match expected profiles.');
  } else {
    const list = summary.formatAnomalies.slice(0, 3);
    list.forEach((item) => {
      console.log(`  - Line ${item.line}: ${item.reason}`);
    });
  }
}

/**
 * Exports metrics as JSON payload.
 */
export function exportToJson(summary: MetricSummary, targetPath: string) {
  fs.writeFileSync(targetPath, JSON.stringify(summary, null, 2), 'utf-8');
  logger.success(`Report exported to JSON at: ${targetPath}`);
}

/**
 * Exports metrics as CSV document.
 */
export function exportToCsv(summary: MetricSummary, targetPath: string) {
  const records = [
    ['Metric Category', 'Metric Detail', 'Value'],
    ['General', 'Total Request Lines', summary.totalRequests + summary.malformedLines],
    ['General', 'Valid Requests', summary.totalRequests],
    ['General', 'Malformed Lines', summary.malformedLines],
    ['General', 'Average Response Time (ms)', summary.averageResponseTimeMs.toFixed(2)],
    ['General', 'Success Count', summary.successCount],
    ['General', 'Error Count', summary.errorCount],
  ];

  // Add status code rows
  Object.entries(summary.statusBreakdown).forEach(([code, count]) => {
    records.push(['Status Breakdown', `HTTP ${code}`, count]);
  });

  // Add slowest endpoints
  summary.topSlowestEndpoints.forEach((item, idx) => {
    records.push([
      'Slow Endpoint',
      `#${idx + 1} [${item.method}] ${item.endpoint}`,
      `${item.timeMs}ms`,
    ]);
  });

  // Add top IPs
  summary.topIps.forEach((item, idx) => {
    records.push(['Top IP', `#${idx + 1} ${item.ip}`, item.count]);
  });

  // Add error spikes
  summary.errorSpikes.forEach((spike) => {
    records.push(['Error Spike', spike.window, spike.count]);
  });

  const output = stringify(records);
  fs.writeFileSync(targetPath, output, 'utf-8');
  logger.success(`Report exported to CSV at: ${targetPath}`);
}
