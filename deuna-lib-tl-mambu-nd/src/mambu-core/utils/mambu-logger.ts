import { Logger, LoggerMethod } from '@deuna/tl-logger-nd';

const logger = new Logger({ context: 'Mambu' });

export const LogMambu = () => {
  return LoggerMethod(logger, '[MAMBU]');
};
