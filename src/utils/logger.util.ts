import { Logger } from 'winston';

type LogDetails = Record<string, any>;

export const logSuccess = (
  logger: Logger,
  message: string,
  eventId: string,
  userId: number,
  details: LogDetails,
) => {
  logger.info({
    level: 'success',
    message,
    eventId,
    userId,
    details,
  });
};

export const logError = (
  logger: Logger,
  message: string,
  eventId: string,
  userId: number,
  error: any,
) => {
  const errorMessage = error instanceof Error ? error.message : String(error);
  logger.error({
    level: 'error',
    message,
    eventId,
    userId,
    error: errorMessage,
  });
};

export const logWarn = (
  logger: Logger,
  message: string,
  eventId: string,
  userId: number,
  details: LogDetails,
) => {
  logger.warn({
    level: 'warn',
    message,
    eventId,
    userId,
    details,
  });
};
