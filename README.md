# Smart Log Analyzer CLI

A CLI tool to parse and analyze server log files of any size. It uses Node.js streams to process logs line-by-line, meaning it does not load the whole file into memory and will not crash on large files.

## Features
- **Streaming Parser**: Uses `fs.createReadStream` and `readline` to keep memory usage low.
- **Multiple Formats**: Parses both space-separated text logs and JSON log lines.
- **Flexible Timestamps**: Handles ISO 8601, `YYYY/MM/DD`, `DD-MMM-YYYY`, and Unix epoch seconds.
- **Flexible Response Times**: Reads values like `142ms`, `0.142s`, or plain numbers.
- **Error & Anomaly Detection**: Highlights status codes, slow endpoints, active client IPs, error spikes, and bad log formats.
- **Exports**: Saves reports to JSON or CSV files.

---

## Installation

```bash
# Install dependencies
npm install

# Build the TypeScript code
npm run build
```

---

## Ingest Log Generator

Generate a mock log file (10,000 lines with mixed formats and anomalies) to test the tool:

```bash
npm run generate
```

---

## How to Run

### Run Demo Mode
Processes the mock log file automatically:
```bash
npm start -- --demo
```

### Run on a Specific File
```bash
npm start sample-logs/server.log
```

### CLI Command Options
```bash
# Get status code frequencies
npm start sample-logs/server.log --status-breakdown

# List active client IPs
npm start sample-logs/server.log --top-ips

# Limit slowest endpoints list (e.g. top 5)
npm start sample-logs/server.log --top-slowest 5

# Show error rate and spikes only
npm start sample-logs/server.log --errors

# Export report output to JSON and CSV files
npm start sample-logs/server.log --export-json report.json --export-csv report.csv
```

---

## Testing

Run tests to verify the parsing logic:
```bash
npm run test
```

## Error Handling
1. **Never Crash**: The parser wraps operations in try/catch blocks. If a line is corrupt or unparseable, it records it as a malformed line and keeps reading the rest of the file.
2. **Missing Fields**: Missing status codes (`-`) or empty fields do not break the tokenizer.
