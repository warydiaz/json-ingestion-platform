import { Test, TestingModule } from '@nestjs/testing';
import { IngestDatasetWorker } from './ingest-dataset.worker';
import { IngestDatasetUseCase } from '../use-cases/ingest-dataset.use-case';
import { DataSourceType, IngestMessageDto } from '../dto/ingest-message.dto';

describe('IngestDatasetWorker', () => {
  let worker: IngestDatasetWorker;
  let mockUseCase: Record<string, jest.Mock>;

  beforeEach(async () => {
    mockUseCase = {
      execute: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IngestDatasetWorker,
        { provide: IngestDatasetUseCase, useValue: mockUseCase },
      ],
    }).compile();

    worker = module.get<IngestDatasetWorker>(IngestDatasetWorker);
  });

  const message: IngestMessageDto = {
    datasetId: 'test-dataset',
    sourceType: DataSourceType.HTTP,
    source: 'test-source',
    url: 'https://example.com/data.json',
  };

  it('should call useCase.execute with the message', async () => {
    await worker.handle(message);

    expect(mockUseCase.execute).toHaveBeenCalledWith(message);
  });

  it('should complete successfully when useCase succeeds', async () => {
    await expect(worker.handle(message)).resolves.toBeUndefined();
  });

  it('should re-throw error when useCase fails', async () => {
    const error = new Error('Ingestion failed');
    mockUseCase.execute.mockRejectedValue(error);

    await expect(worker.handle(message)).rejects.toThrow('Ingestion failed');
  });
});
