import * as fs from 'fs';
import * as readline from 'readline';
import { Command } from 'commander';
import { parseLogLine } from '../parser';
import { MetricsAccumulator } from '../analyzer/metrics';
import { detectErrorSpikes, getSuspiciousEndpoints } from '../analyzer/anomalies';
import { displayTerminalReport, exportToJson, exportToCsv } from '../analyzer/reports';
import { logger } from '../utils/logger';

import ora from 'ora';

import boxen from 'boxen';

export function makeCliProgram(): Command {
  const program = new Command();

  program
    .name('log-analyzer')
    .description('A professional, high-performance log analyzer CLI using stream processing.')
    .version('1.0.0')
    .argument('[file]', 'Path to the server log file (optional if --demo is specified)')
    .option('--summary', 'Display full metric summary')
    .option('--top-slowest <number>', 'Filter/limit slowest endpoints output list size', '10')
    .option('--errors', 'Filter and report errors only')
    .option('--status-breakdown', 'Render status code breakdown block')
    .option('--top-ips', 'Render list of top client IPs')
    .option('--export-json <output_path>', 'Output analysis result to a JSON file')
    .option('--export-csv <output_path>', 'Output analysis result to a CSV file')
    .option('--demo', 'Analyze built-in sample log dataset automatically')
    .addHelpText('before', () => {
      const banner = `
   ____                      _     _                   
  / ___| _ __ ___   __ _ _ __| |_  | |    ___   __ _ ___ 
  \\___ \\| '_ \` _ \\ / _\` | '__| __| | |   / _ \\ / _\` / __|
   ___) | | | | | | (_| | |  | |_  | |__| (_) | (_| \\__ \\
  |____/|_| |_| |_|\\__,_|_|   \\__| |_____\\___/ \\__, |___/
                                               |___/     
  `;
      return boxen(
        logger.bold(banner) +
          '\n' +
          logger.bold('  Smart Log Analyzer - Observability CLI Engine\n') +
          '  Ingest, process, and analyze server logs with O(1) memory.',
        {
          padding: 1,
          margin: 0,
          borderStyle: 'classic',
          borderColor: 'cyan',
        },
      );
    })
    .action(async (filePathInput: string | undefined, options) => {
      let filePath = filePathInput;

      // Handle Demo Mode
      if (options.demo) {
        filePath = 'sample-logs/server.log';
        if (!fs.existsSync(filePath)) {
          logger.warn('Demo sample log file not found. Generating mock dataset...');
          // eslint-disable-next-line @typescript-eslint/no-var-requires
          const { execSync } = require('child_process');
          execSync('npm run generate');
        }
      }

      if (!filePath) {
        // If neither a file nor demo is passed, output help
        program.outputHelp();
        process.exit(0);
      }

      const startTime = performance.now();

      if (!fs.existsSync(filePath)) {
        logger.error(`File not found: ${filePath}`);
        process.exit(1);
      }

      const spinner = ora(`Streaming read of ${filePath}...`).start();

      const instream = fs.createReadStream(filePath);
      const rl = readline.createInterface({
        input: instream,
        crlfDelay: Infinity,
      });

      const metrics = new MetricsAccumulator();
      let lineCount = 0;

      for await (const line of rl) {
        lineCount++;
        const parsed = parseLogLine(line);
        if (parsed.success && parsed.entry) {
          metrics.addEntry(parsed.entry, lineCount);
        } else {
          if (line.trim().length > 0) {
            metrics.addMalformed(lineCount, parsed.error);
          }
        }
      }

      const totalTimeMs = performance.now() - startTime;
      spinner.succeed(`Parsed ${lineCount} lines in ${totalTimeMs.toFixed(2)}ms`);

      // Construct aggregate output data
      const summaryReport = {
        totalRequests: metrics.totalRequests,
        malformedLines: metrics.malformedLines,
        successCount: metrics.successCount,
        errorCount: metrics.errorCount,
        averageResponseTimeMs: metrics.getAverageResponseTime(),
        statusBreakdown: metrics.statusBreakdown,
        topSlowestEndpoints: metrics.getTopSlowestEndpoints(parseInt(options.topSlowest, 10)),
        topIps: metrics.getTopIps(10),
        errorSpikes: detectErrorSpikes(metrics),
        suspiciousEndpoints: getSuspiciousEndpoints(metrics),
        formatAnomalies: metrics.formatAnomaliesList,
      };

      // Handle CLI options filters. If no option is selected, default is summary mode.
      const hasSpecificFilter =
        options.summary ||
        options.errors ||
        options.statusBreakdown ||
        options.topIps ||
        options.exportJson ||
        options.exportCsv;

      if (!hasSpecificFilter || options.summary) {
        displayTerminalReport(summaryReport);
        
        // Print Performance Benchmark details
        console.log(`\n${logger.bold('⚡ PERFORMANCE BENCHMARK')}`);
        console.log(`  - Total Time:        ${logger.highlight((totalTimeMs / 1000).toFixed(2) + 's')}`);
        console.log(`  - Throughput:        ${logger.highlight(Math.round(lineCount / (totalTimeMs / 1000)).toLocaleString() + ' lines/sec')}`);
        console.log(`  - Mode:              ${logger.highlight('Streaming (low memory usage)')}`);
        console.log(logger.bold('\nReport Ready!'));
      } else {
        if (options.errors) {
          console.log(`\n${logger.bold('Errors Summary:')}`);
          console.log(
            `  - Total HTTP Errors (>=400): ${logger.highlight(String(summaryReport.errorCount))}`,
          );
          console.log(
            `  - Total Malformed Lines: ${logger.highlight(String(summaryReport.malformedLines))}`,
          );
          console.log(`\n${logger.bold('Error Spikes:')}`);
          summaryReport.errorSpikes.forEach((spike) => {
            console.log(`  - ${spike.window}: ${spike.count} errors`);
          });
        }
        if (options.statusBreakdown) {
          console.log(`\n${logger.bold('Status Code Breakdown:')}`);
          Object.entries(summaryReport.statusBreakdown)
            .sort((a, b) => b[1] - a[1])
            .forEach(([code, count]) => {
              console.log(`  - [${code}]: ${count}`);
            });
        }
        if (options.topIps) {
          console.log(`\n${logger.bold('Top Client IPs:')}`);
          summaryReport.topIps.forEach((item, index) => {
            console.log(`  ${index + 1}. ${item.ip} (${item.count} hits)`);
          });
        }
      }

      // Handle Exports
      if (options.exportJson) {
        exportToJson(summaryReport, options.exportJson);
      }
      if (options.exportCsv) {
        exportToCsv(summaryReport, options.exportCsv);
      }
    });

  return program;
}
