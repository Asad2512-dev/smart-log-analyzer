import * as fs from 'fs';
import * as path from 'path';

const OUTPUT_DIR = path.join(__dirname, '../sample-logs');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'server.log');

const IPS = ['192.168.1.42', '10.0.0.8', '172.16.254.1', '1.1.1.1', '8.8.8.8'];
const METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
const ENDPOINTS = [
  '/api/users',
  '/api/auth/login',
  '/api/products',
  '/api/checkout',
  '/index.html',
  '/static/css/main.css',
  '/api/admin/dashboard',
];
const STATUS_CODES = [200, 200, 200, 201, 304, 400, 401, 403, 404, 500];

// Response Time format generators
const RESPONSE_TIME_FORMATS = [
  (ms: number) => `${ms}ms`,
  (ms: number) => `${(ms / 1000).toFixed(3)}s`,
  (ms: number) => `${ms}`,
];

// Timestamp format generators
const TIMESTAMP_FORMATS = [
  (d: Date) => d.toISOString(),
  (d: Date) => d.toISOString().replace('T', ' ').slice(0, 19).replace(/-/g, '/'), // YYYY/MM/DD HH:mm:ss
  (d: Date) => {
    // 15-Mar-2024 14:23:01 format
    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    const date = d.getDate().toString().padStart(2, '0');
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    const time = d.toTimeString().split(' ')[0];
    return `${date}-${month}-${year} ${time}`;
  },
  (d: Date) => Math.floor(d.getTime() / 1000).toString(), // Unix epoch
];

function getRandomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateStandardLine(d: Date): string {
  const ts = getRandomElement(TIMESTAMP_FORMATS)(d);
  const ip = getRandomElement(IPS);
  const method = getRandomElement(METHODS);
  const ep = getRandomElement(ENDPOINTS);

  // Status check: with some low probability represent missing status '-'
  const hasStatus = Math.random() > 0.05;
  const statusStr = hasStatus ? String(getRandomElement(STATUS_CODES)) : '-';

  const ms = Math.floor(Math.random() * 500) + 10;
  const resTimeStr = getRandomElement(RESPONSE_TIME_FORMATS)(ms);

  const userAgent =
    '"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0"';
  const referrer = '"https://github.com"';

  return `${ts} ${ip} ${method} ${ep} ${statusStr} ${resTimeStr} ${userAgent} ${referrer}`;
}

function generateJsonLine(d: Date): string {
  const ms = Math.floor(Math.random() * 600) + 10;
  const hasStatus = Math.random() > 0.05;
  const entry = {
    timestamp: getRandomElement(TIMESTAMP_FORMATS)(d),
    ip: getRandomElement(IPS),
    method: getRandomElement(METHODS),
    endpoint: getRandomElement(ENDPOINTS),
    statusCode: hasStatus ? getRandomElement(STATUS_CODES) : null,
    responseTimeMs: ms,
    userAgent: 'Mozilla/5.0 (Server-Side-Agent)',
  };
  return JSON.stringify(entry);
}

function generateMalformedLine(): string {
  const items = [
    'Random garbage text string for testing malformed lines.',
    '2024-03-15T14:23:01Z 192.168.1.42 GET', // partial line
    '    ', // blank lines
    'Error: Connection failed\n    at Connection.connect (/app/node_modules/db/connection.js:14:23)\n    at Query.run (/app/src/db.ts:45:11)', // Stack trace mock
  ];
  return getRandomElement(items);
}

function main() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const writeStream = fs.createWriteStream(OUTPUT_FILE, 'utf-8');
  console.log(`Generating mock log data inside: ${OUTPUT_FILE}...`);

  const totalLines = 10000;
  const startTime = new Date(Date.now() - totalLines * 1000); // 1-second ticks

  for (let i = 0; i < totalLines; i++) {
    const currentTick = new Date(startTime.getTime() + i * 1000);
    const rand = Math.random();

    let logLine = '';
    if (rand < 0.8) {
      logLine = generateStandardLine(currentTick);
    } else if (rand < 0.95) {
      logLine = generateJsonLine(currentTick);
    } else {
      logLine = generateMalformedLine();
    }

    writeStream.write(logLine + '\n');
  }

  writeStream.end();
  console.log(`Successfully generated ${totalLines} log entries!`);
}

main();
