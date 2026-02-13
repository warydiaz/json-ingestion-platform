/**
 * Scheduler and cron job default values.
 * Actual cron expression is loaded from INGESTION_CRON env var via ConfigService.
 */
export const SCHEDULER_DEFAULTS = {
  CRON: {
    INGESTION_JOBS: '0 */10 * * * *',
  },
} as const;
