/**
 * Pagination configuration constants
 * Default limits for API pagination
 */
export const PAGINATION_DEFAULTS = {
  LIMIT: 10,
  MAX_LIMIT: 100,
  MIN_LIMIT: 1,
} as const;

/**
 * Data processing batch sizes
 * Used for streaming and bulk operations
 */
export const BATCH_SIZES = {
  DATA_INGESTION: 1000,
} as const;
