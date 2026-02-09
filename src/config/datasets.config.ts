import { readFileSync } from 'fs';
import { DataSourceType } from '../ingestion/dto/ingest-message.dto';
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
}

export interface DatasetsConfiguration {
  datasets: DatasetConfig[];
}

export class DatasetsConfigService {
  private static config: DatasetsConfiguration | null = null;

  /**
   * Load datasets from datasets.config.json
   * Returns cached config if already loaded
   */
  static loadDatasets(): DatasetConfig[] {
    if (this.config) {
      return this.config.datasets;
    }

    try {
      const fileContent = readFileSync(CONFIG_PATHS.DATASETS, 'utf-8');
      this.config = JSON.parse(fileContent);
      return this.config?.datasets || [];
    } catch (error) {
      throw new ConfigLoadingException(
        CONFIG_PATHS.DATASETS,
        error instanceof Error ? error : new Error(String(error)),
      );
    }
  }

  /**
   * Reload configuration from disk (useful after config changes)
   */
  static reloadDatasets(): DatasetConfig[] {
    this.config = null;
    return this.loadDatasets();
  }
}
