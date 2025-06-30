import { Logger, LoggerMethod } from '@deuna/tl-logger-nd';

const logger = new Logger({ context: 'Mambu Deuna' });

export const LogDeunaMambu = () => {
  return LoggerMethod(logger, '[MAMBU DEUNA]');
};
