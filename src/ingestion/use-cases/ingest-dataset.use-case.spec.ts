import { Test, TestingModule } from '@nestjs/testing';
import { IngestDatasetUseCase } from './ingest-dataset.use-case';
import { IngestedRecordRepository } from '../../persistence/repositories/ingested-record.repository';
import { HttpDataFetcher } from '../adapters/http-data-fetcher';
import { DataSourceType, IngestMessageDto } from '../dto/ingest-message.dto';

describe('IngestDatasetUseCase', () => {
  let useCase: IngestDatasetUseCase;
  let repository: Record<string, jest.Mock>;
  let httpFetcher: Record<string, jest.Mock>;

  beforeEach(async () => {
    repository = {
      deleteByDataset: jest.fn().mockResolvedValue(0),
      insertMany: jest.fn().mockResolvedValue(undefined),
    };

    httpFetcher = {
      fetch: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IngestDatasetUseCase,
        { provide: IngestedRecordRepository, useValue: repository },
        { provide: HttpDataFetcher, useValue: httpFetcher },
      ],
    }).compile();

    useCase = module.get<IngestDatasetUseCase>(IngestDatasetUseCase);
  });

  const createMessage = (
    overrides: Partial<IngestMessageDto> = {},
  ): IngestMessageDto => {
    const msg = new IngestMessageDto();
    msg.datasetId = overrides.datasetId ?? 'test-dataset';
    msg.sourceType = overrides.sourceType ?? DataSourceType.HTTP;
    msg.source = overrides.source ?? 'test-source';
    msg.url = overrides.url ?? 'https://example.com/data.json';
    msg.fieldMapping = overrides.fieldMapping;
    return msg;
  };

  function* createStream(batches: Record<string, unknown>[][]): Generator<Record<string, unknown>[]> {
    for (const batch of batches) {
      yield batch;
    }
  }

  it('should throw when url is missing for HTTP source', async () => {
    const msg = new IngestMessageDto();
    msg.datasetId = 'test-dataset';
    msg.sourceType = DataSourceType.HTTP;
    msg.source = 'test-source';
    // url is not set

    await expect(useCase.execute(msg)).rejects.toThrow(
      'url is required for HTTP source',
    );
  });

  it('should delete existing records before ingestion', async () => {
    httpFetcher.fetch.mockReturnValue(createStream([]));
    const message = createMessage();

    await useCase.execute(message);

    expect(repository.deleteByDataset).toHaveBeenCalledWith(
      'test-source',
      'test-dataset',
    );
  });

  it('should use sourceType as fallback when source is not provided', async () => {
    httpFetcher.fetch.mockReturnValue(createStream([]));
    const msg = new IngestMessageDto();
    msg.datasetId = 'test-dataset';
    msg.sourceType = DataSourceType.HTTP;
    msg.url = 'https://example.com/data.json';
    // source is not set

    await useCase.execute(msg);

    expect(repository.deleteByDataset).toHaveBeenCalledWith(
      'HTTP',
      'test-dataset',
    );
  });

  it('should process batches and insert records', async () => {
    const batch1 = [
      { id: 1, name: 'a' },
      { id: 2, name: 'b' },
    ];
    const batch2 = [{ id: 3, name: 'c' }];
    httpFetcher.fetch.mockReturnValue(createStream([batch1, batch2]));

    const message = createMessage();
    await useCase.execute(message);

    expect(repository.insertMany).toHaveBeenCalledTimes(2);
    expect(repository.insertMany).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          source: 'test-source',
          datasetId: 'test-dataset',
          payload: { id: 1, name: 'a' },
        }),
      ]),
    );
  });

  it('should apply field mapping when provided', async () => {
    const batch = [{ address: { city: 'Lyon' }, isAvailable: true }];
    httpFetcher.fetch.mockReturnValue(createStream([batch]));

    const message = createMessage({
      fieldMapping: { city: 'address.city', available: 'isAvailable' },
    });
    await useCase.execute(message);

    expect(repository.insertMany).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          payload: { city: 'Lyon', available: true },
        }),
      ]),
    );
  });

  it('should use raw payload when no field mapping is provided', async () => {
    const batch = [{ raw: 'data', nested: { value: 1 } }];
    httpFetcher.fetch.mockReturnValue(createStream([batch]));

    const message = createMessage({ fieldMapping: undefined });
    await useCase.execute(message);

    expect(repository.insertMany).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          payload: { raw: 'data', nested: { value: 1 } },
        }),
      ]),
    );
  });

  it('should handle empty stream with no batches', async () => {
    httpFetcher.fetch.mockReturnValue(createStream([]));

    const message = createMessage();
    await useCase.execute(message);

    expect(repository.insertMany).not.toHaveBeenCalled();
  });

  it('should log deletion count when records exist', async () => {
    repository.deleteByDataset.mockResolvedValue(50);
    httpFetcher.fetch.mockReturnValue(createStream([]));

    const message = createMessage();
    await useCase.execute(message);

    expect(repository.deleteByDataset).toHaveBeenCalled();
  });
});
