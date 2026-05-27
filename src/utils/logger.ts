import chalk from 'chalk';

export const logger = {
  info: (msg: string) => {
    console.log(chalk.blue('ℹ ') + msg);
  },
  success: (msg: string) => {
    console.log(chalk.green('✔ ') + msg);
  },
  warn: (msg: string) => {
    console.warn(chalk.yellow('⚠ ') + chalk.yellow(msg));
  },
  error: (msg: string, err?: unknown) => {
    console.error(chalk.red('✖ ') + chalk.red(msg));
    if (err) {
      console.error(chalk.red(err instanceof Error ? err.stack : String(err)));
    }
  },
  highlight: (msg: string) => {
    return chalk.cyan(msg);
  },
  bold: (msg: string) => {
    return chalk.bold(msg);
  },
};
