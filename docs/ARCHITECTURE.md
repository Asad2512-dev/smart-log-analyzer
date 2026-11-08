# Architecture

## What this is

Smart Log Analyzer CLI. Production-grade streaming log analyzer CLI. A CLI tool to parse and analyze server log files of any size. It uses Node.js streams to process logs line-by-line, meaning it does not load the whole file into memory and will not crash on large files.

## Layout

- `scripts/`
- `src/` — `analyzer`, `cli`, `index.ts`, `parser`, `types`, `utils`
- `tests/`
- Tooling: `.eslintrc.json`, `.gitignore`, `.prettierrc`
- Root files: `ANSWERS.md`, `jest.config.js`, `package-lock.json`, `package.json`, `README.md`, `report.csv`, `report.json`, `tsconfig.json`

## How the pieces fit

Node project declared by the root `package.json`.

## How to run

Commands written in the README:

```
# Install dependencies
npm install
# Build the TypeScript code
npm run build
```

```
npm run generate
```

Scripts in the root `package.json`:

- `build` — `tsc`
- `start` — `ts-node src/index.ts`
- `test` — `jest --passWithNoTests`
- `lint` — `eslint 'src/**/*.ts' 'scripts/**/*.ts'`
