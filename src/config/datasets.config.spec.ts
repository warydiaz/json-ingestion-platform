import { DatasetsConfigService } from './datasets.config';
import * as fs from 'fs';
import * as path from 'path';

jest.mock('fs');
jest.mock('path');

describe('DatasetsConfigService', () => {
  const mockConfigPath = '/mock/path/datasets.config.json';

  beforeEach(() => {
    // Reset the static config before each test
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    (DatasetsConfigService as any).config = null;

    // Mock path.join to return a consistent path
    (path.join as jest.Mock).mockReturnValue(mockConfigPath);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should load datasets from config file', () => {
    const mockConfig = {
      datasets: [
        {
          datasetId: 'test-dataset',
          source: 'test-source',
          sourceType: 'HTTP',
          url: 'https://example.com/data.json',
          description: 'Test dataset',
        },
      ],
    };

    (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(mockConfig));

    const datasets = DatasetsConfigService.loadDatasets();

    expect(datasets).toHaveLength(1);
    expect(datasets[0].datasetId).toBe('test-dataset');
    expect(datasets[0].source).toBe('test-source');
    expect(datasets[0].sourceType).toBe('HTTP');
  });

  it('should cache config after first load', () => {
    const mockConfig = {
      datasets: [
        {
          datasetId: 'test-dataset',
          source: 'test-source',
          sourceType: 'HTTP',
          url: 'https://example.com/data.json',
        },
      ],
    };

    (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(mockConfig));

    // First load
    DatasetsConfigService.loadDatasets();

    // Second load (should use cache)
    DatasetsConfigService.loadDatasets();

    // readFileSync should only be called once (cached)
    expect(fs.readFileSync).toHaveBeenCalledTimes(1);
  });

  it('should reload config when reloadDatasets is called', () => {
    const mockConfig = {
      datasets: [
        {
          datasetId: 'test-dataset',
          source: 'test-source',
          sourceType: 'HTTP',
          url: 'https://example.com/data.json',
        },
      ],
    };

    (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(mockConfig));

    // First load
    DatasetsConfigService.loadDatasets();

    // Reload (should clear cache and read again)
    DatasetsConfigService.reloadDatasets();

    // readFileSync should be called twice
    expect(fs.readFileSync).toHaveBeenCalledTimes(2);
  });

  it('should throw error if config file does not exist', () => {
    (fs.readFileSync as jest.Mock).mockImplementation(() => {
      throw new Error('ENOENT: no such file or directory');
    });

    expect(() => DatasetsConfigService.loadDatasets()).toThrow(
      /Failed to load configuration/,
    );
  });

  it('should throw error if config file has invalid JSON', () => {
    (fs.readFileSync as jest.Mock).mockReturnValue('invalid json {');

    expect(() => DatasetsConfigService.loadDatasets()).toThrow();
  });

  it('should load multiple datasets', () => {
    const mockConfig = {
      datasets: [
        {
          datasetId: 'dataset-1',
          source: 'source-1',
          sourceType: 'HTTP',
          url: 'https://example.com/data1.json',
        },
        {
          datasetId: 'dataset-2',
          source: 'source-2',
          sourceType: 'HTTP',
          url: 'https://example.com/data2.json',
        },
        {
          datasetId: 'dataset-3',
          source: 'source-3',
          sourceType: 'HTTP',
          url: 'https://example.com/data3.json',
        },
      ],
    };

    (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(mockConfig));

    const datasets = DatasetsConfigService.loadDatasets();

    expect(datasets).toHaveLength(3);
    expect(datasets[0].datasetId).toBe('dataset-1');
    expect(datasets[1].datasetId).toBe('dataset-2');
    expect(datasets[2].datasetId).toBe('dataset-3');
  });
});
