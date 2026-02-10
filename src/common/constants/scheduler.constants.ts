/**
 * Scheduler and cron job constants
 */
export const SCHEDULER_CONFIG = {
  CRON: {
    INGESTION_JOBS: process.env.INGESTION_CRON || '0 */10 * * * *',
  },
} as const;
