import { Test, TestingModule } from '@nestjs/testing';
import { PublishIngestionJobsTask } from './publish-ingestion-jobs.task';
import { RabbitMQPublisher } from '../messaging/rabbitmq.publisher';
import { DatasetsConfigService } from '../config/datasets.config';

describe('PublishIngestionJobsTask', () => {
  let task: PublishIngestionJobsTask;
  let mockPublisher: Record<string, jest.Mock>;

  beforeEach(async () => {
    mockPublisher = {
      publishIngestionJob: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PublishIngestionJobsTask,
        { provide: RabbitMQPublisher, useValue: mockPublisher },
      ],
    }).compile();

    task = module.get<PublishIngestionJobsTask>(PublishIngestionJobsTask);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should publish a job for each configured dataset', async () => {
    jest.spyOn(DatasetsConfigService, 'loadDatasets').mockReturnValue([
      {
        datasetId: 'dataset-1',
        source: 'source-1',
        sourceType: 'HTTP' as never,
        url: 'https://example.com/1.json',
        fieldMapping: { city: 'address.city' },
      },
      {
        datasetId: 'dataset-2',
        source: 'source-2',
        sourceType: 'HTTP' as never,
        url: 'https://example.com/2.json',
      },
    ]);

    await task.handleCron();

    expect(mockPublisher.publishIngestionJob).toHaveBeenCalledTimes(2);
  });

  it('should pass correct dataset fields in the message', async () => {
    jest.spyOn(DatasetsConfigService, 'loadDatasets').mockReturnValue([
      {
        datasetId: 'ds-1',
        source: 'src-1',
        sourceType: 'HTTP' as never,
        url: 'https://example.com/data.json',
        fieldMapping: { name: 'fullName' },
        description: 'Test dataset',
      },
    ]);

    await task.handleCron();

    expect(mockPublisher.publishIngestionJob).toHaveBeenCalledWith({
      datasetId: 'ds-1',
      source: 'src-1',
      sourceType: 'HTTP',
      url: 'https://example.com/data.json',
      bucket: undefined,
      key: undefined,
      fieldMapping: { name: 'fullName' },
    });
  });

  it('should handle zero datasets gracefully', async () => {
    jest.spyOn(DatasetsConfigService, 'loadDatasets').mockReturnValue([]);

    await task.handleCron();

    expect(mockPublisher.publishIngestionJob).not.toHaveBeenCalled();
  });
});
