import { makeCliProgram } from './cli/commands';
import { logger } from './utils/logger';

function main() {
  try {
    const program = makeCliProgram();
    program.parse(process.argv);
  } catch (err: unknown) {
    logger.error('Unhandled program execution failure', err);
    process.exit(1);
  }
}

main();
