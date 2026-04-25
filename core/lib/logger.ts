
type LogLevel = 'INFO' | 'WARN' | 'ERROR';

interface LogContext {
  correlationId?: string;
  [key: string]: unknown;
}

const log = (level: LogLevel, message: string, context: LogContext = {}) => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...context,
  };

  const output = JSON.stringify(logEntry);

  switch (level) {
    case 'INFO':
      console.log(output);
      break;
    case 'WARN':
      console.warn(output);
      break;
    case 'ERROR':
      console.error(output);
      break;
  }
};

export const logger = {
  info: (message: string, context?: LogContext) => log('INFO', message, context),
  warn: (message: string, context?: LogContext) => log('WARN', message, context),
  error: (message: string, context?: LogContext) => log('ERROR', message, context),
};
