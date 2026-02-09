/**
 * Scheduler and cron job constants
 * Centralized cron expressions for maintainability
 */
export const SCHEDULER_CONFIG = {
  CRON: {
    // Every 10 minutes
    INGESTION_JOBS: '0 */10 * * * *',
  },
} as const;
