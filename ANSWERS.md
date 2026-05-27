# Technical Assessment Answers

## 1. How to run
Make sure Node.js (v18+) is installed. Run these commands:

```bash
# Install dependencies
npm install

# Run the test suite
npm run test

# Generate a mock log file for testing
npm run generate

# Run the analyzer demo on the generated file
npm start -- --demo

# Run analyzer on a specific file
npm start sample-logs/server.log

# Export the report outputs
npm start sample-logs/server.log --export-json report.json --export-csv report.csv
```

---

## 2. Stack Choice Discussion
- **Node.js & TypeScript**: I chose Node.js because it is very fast for reading files and has built-in streaming tools. TypeScript helps catch typos and index mapping issues when formatting the log entries.
- **Streaming Architecture**: I used a streaming approach (`readline` and `fs.createReadStream`) because loading a huge 10GB file into memory with `fs.readFileSync` will crash the Node process. Streaming reads the file line-by-line, keeping memory usage constant and very low.
- **Alternatives Rejected**:
  - *Python/Pandas*: Good for analysis, but it loads the whole dataset into memory by default and takes longer to start up.
  - *Simple string splitting*: Splits by space break when a field like a user-agent contains quotes and spaces.

---

## 3. Real Edge Case
- **Edge Case File/Line**: [regexParser.ts Line 19](file:///Applications/MAMP/htdocs/task/src/parser/regexParser.ts#L19)
- **Explanation**: Normal `line.split(' ')` breaks if fields contain spaces enclosed in quotes, like a user agent string: `"Mozilla/5.0 (Windows NT 10.0)"`.
- **How I handled it**: I wrote a regex tokenizer `/("[^"\\]*(?:\\.[^"\\]*)*"|[^"\s]+)/g` instead of splitting. This group matches quoted blocks together as one token, preventing indices from shifting. If not handled, status codes and response times would map to the wrong fields or crash the parser.

---

## 4. AI Usage
- **Tool used**: Gemini.
- **What I asked**: I asked for regex advice on matching nested quotes and spaces, and how to write a simple Jest configuration for ts-node.
- **What was generated**: Basic regex patterns and Jest ts-jest boilerplate.
- **What I changed**: I refactored the fallback parsing flow (JSON -> Regex -> Malformed) manually and customized the Commander CLI options and table layouts.

---

## 5. Honest Gap & Limitation
- **Limitation**: The tool does not group similar URLs. For example, `/api/users/1` and `/api/users/2` are counted as two different endpoints instead of `/api/users/:id`.
- **How I would improve it**: I would add a routing path normalizer that replaces IDs with placeholders so endpoint latency stats are grouped together accurately.
