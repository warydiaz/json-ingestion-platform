import { readFileSync } from 'fs';
import type { DataSourceType } from '../ingestion/dto/ingest-message.dto';
import { ConfigLoadingException } from '../common/exceptions';
import { CONFIG_PATHS } from '../common/constants';

export interface DatasetConfig {
  datasetId: string;
  source: string;
  sourceType: DataSourceType;
  url?: string;
  bucket?: string;
  key?: string;
  description?: string;
  fieldMapping?: Record<string, string>;
}

export interface DatasetsConfiguration {
  datasets: DatasetConfig[];
}

export class DatasetsConfigService {
  private static config: DatasetsConfiguration | null = null;

  /**
   * Load datasets from datasets.config.json.
   * Returns cached config if already loaded.
   * Uses synchronous read — call only at startup or from cached path.
   */
  static loadDatasets(): DatasetConfig[] {
    if (this.config) {
      return this.config.datasets;
    }

    try {
      const fileContent = readFileSync(CONFIG_PATHS.DATASETS, 'utf-8');
      const parsed: unknown = JSON.parse(fileContent);

      if (
        !parsed ||
        typeof parsed !== 'object' ||
        !('datasets' in parsed) ||
        !Array.isArray((parsed as DatasetsConfiguration).datasets)
      ) {
        throw new Error('Config file must contain a "datasets" array');
      }

      this.config = parsed as DatasetsConfiguration;
      return this.config.datasets;
    } catch (error) {
      throw new ConfigLoadingException(
        CONFIG_PATHS.DATASETS,
        error instanceof Error ? error : new Error(String(error)),
      );
    }
  }

  /**
   * Clear the cached configuration (useful for testing)
   */
  static clearCache(): void {
    this.config = null;
  }

  /**
   * Reload configuration from disk (useful after config changes)
   */
  static reloadDatasets(): DatasetConfig[] {
    this.clearCache();
    return this.loadDatasets();
  }
}
