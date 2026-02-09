/**
 * RabbitMQ messaging constants
 * Centralized to avoid magic strings throughout the codebase
 */
export const RABBITMQ_CONFIG = {
  EXCHANGE: {
    INGESTION: 'ingestion.exchange',
  },
  ROUTING_KEY: {
    INGESTION_JOB: 'ingestion.job',
  },
  QUEUE: {
    INGESTION: 'ingestion.queue',
  },
  CHANNEL: {
    DEFAULT: 'channel-1',
  },
} as const;
