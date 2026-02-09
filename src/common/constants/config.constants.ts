import { join } from 'path';

/**
 * Configuration file paths
 * Centralized to avoid magic strings in config loading
 */
export const CONFIG_PATHS = {
  DATASETS: join(process.cwd(), 'datasets.config.json'),
} as const;
