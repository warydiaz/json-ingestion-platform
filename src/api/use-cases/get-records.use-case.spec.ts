import { Test, TestingModule } from '@nestjs/testing';
import { GetRecordsUseCase } from './get-records.use-case';
import { IngestedRecordRepository } from '../../persistence/repositories/ingested-record.repository';
import type { ParsedQuery } from '../../common/utils/query-parser.types';

describe('GetRecordsUseCase', () => {
  let useCase: GetRecordsUseCase;
  let repository: IngestedRecordRepository;
  let mockRepository: Record<string, jest.Mock>;

  beforeEach(async () => {
    mockRepository = {
      findWithCursor: jest.fn(),
      count: jest.fn(),
      estimatedCount: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetRecordsUseCase,
        {
          provide: IngestedRecordRepository,
          useValue: mockRepository,
        },
      ],
    }).compile();

    useCase = module.get<GetRecordsUseCase>(GetRecordsUseCase);
    repository = module.get<IngestedRecordRepository>(IngestedRecordRepository);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  it('should filter by standard fields (source, datasetId)', async () => {
    const filters: ParsedQuery = {
      standardFilters: { source: 'source-1', datasetId: 'dataset-123' },
      payloadFilters: {},
    };

    jest.spyOn(repository, 'findWithCursor').mockResolvedValue({
      items: [],
      nextCursor: null,
    });
    jest.spyOn(repository, 'count').mockResolvedValue(0);

    await useCase.execute(filters);

    expect(repository.findWithCursor).toHaveBeenCalledWith({
      filter: { source: 'source-1', datasetId: 'dataset-123' },
      limit: 10,
      cursor: undefined,
    });
  });

  it('should filter by payload fields', async () => {
    const filters: ParsedQuery = {
      standardFilters: {},
      payloadFilters: {
        'payload.age': 25,
        'payload.city': { $regex: 'Madrid', $options: 'i' },
      },
    };

    jest.spyOn(repository, 'findWithCursor').mockResolvedValue({
      items: [],
      nextCursor: null,
    });
    jest.spyOn(repository, 'count').mockResolvedValue(0);

    await useCase.execute(filters);

    expect(repository.findWithCursor).toHaveBeenCalledWith({
      filter: {
        'payload.age': 25,
        'payload.city': { $regex: 'Madrid', $options: 'i' },
      },
      limit: 10,
      cursor: undefined,
    });
  });

  it('should combine standard and payload filters', async () => {
    const filters: ParsedQuery = {
      standardFilters: { source: 'source-1' },
      payloadFilters: {
        'payload.age': 30,
        'payload.active': true,
      },
    };

    jest.spyOn(repository, 'findWithCursor').mockResolvedValue({
      items: [],
      nextCursor: null,
    });
    jest.spyOn(repository, 'count').mockResolvedValue(0);

    await useCase.execute(filters);

    expect(repository.findWithCursor).toHaveBeenCalledWith({
      filter: {
        source: 'source-1',
        'payload.age': 30,
        'payload.active': true,
      },
      limit: 10,
      cursor: undefined,
    });
  });

  it('should use custom limit and cursor', async () => {
    const filters: ParsedQuery = {
      standardFilters: { source: 'source-1' },
      payloadFilters: {},
    };

    jest.spyOn(repository, 'findWithCursor').mockResolvedValue({
      items: [],
      nextCursor: null,
    });
    jest.spyOn(repository, 'count').mockResolvedValue(0);

    await useCase.execute(filters, 50, 'abc123');

    expect(repository.findWithCursor).toHaveBeenCalledWith({
      filter: { source: 'source-1' },
      limit: 50,
      cursor: 'abc123',
    });
  });

  it('should return data with pagination', async () => {
    const filters: ParsedQuery = {
      standardFilters: { source: 'source-1' },
      payloadFilters: {},
    };
    const mockItems = [
      {
        _id: '1',
        source: 'source-1',
        datasetId: 'test',
        payload: {},
        ingestionDate: new Date(),
      },
    ];

    jest.spyOn(repository, 'findWithCursor').mockResolvedValue({
      items: mockItems,
      nextCursor: 'cursor123',
    });
    jest.spyOn(repository, 'count').mockResolvedValue(100);

    const result = await useCase.execute(filters);

    expect(result).toEqual({
      data: mockItems,
      pagination: {
        total: 100,
        limit: 10,
        nextCursor: 'cursor123',
        hasMore: true,
      },
    });
  });

  it('should use estimatedCount when no filters are applied', async () => {
    const filters: ParsedQuery = {
      standardFilters: {},
      payloadFilters: {},
    };

    mockRepository.findWithCursor.mockResolvedValue({
      items: [],
      nextCursor: null,
    });
    mockRepository.estimatedCount.mockResolvedValue(5000);

    const result = await useCase.execute(filters);

    expect(mockRepository.estimatedCount).toHaveBeenCalled();
    expect(result.pagination.total).toBe(5000);
  });
});
