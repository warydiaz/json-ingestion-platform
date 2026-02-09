import { Test, TestingModule } from '@nestjs/testing';
import { GetRecordsUseCase } from './get-records.use-case';
import { IngestedRecordRepository } from '../../persistence/repositories/ingested-record.repository';
import { BadRequestException } from '@nestjs/common';

describe('GetRecordsUseCase', () => {
  let useCase: GetRecordsUseCase;
  let repository: IngestedRecordRepository;

  beforeEach(async () => {
    const mockRepository = {
      findWithCursor: jest.fn(),
      count: jest.fn(),
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
    const query = { source: 'source-1', datasetId: 'dataset-123' };

    jest.spyOn(repository, 'findWithCursor').mockResolvedValue({
      items: [],
      nextCursor: null,
    });
    jest.spyOn(repository, 'count').mockResolvedValue(0);

    await useCase.execute(query);

    expect(repository.findWithCursor).toHaveBeenCalledWith({
      filter: { source: 'source-1', datasetId: 'dataset-123' },
      limit: 10,
      cursor: undefined,
    });
  });

  it('should filter by payload fields', async () => {
    const query = { 'payload.age': '25', 'payload.city': 'Madrid' };

    jest.spyOn(repository, 'findWithCursor').mockResolvedValue({
      items: [],
      nextCursor: null,
    });
    jest.spyOn(repository, 'count').mockResolvedValue(0);

    await useCase.execute(query);

    expect(repository.findWithCursor).toHaveBeenCalledWith({
      filter: { 'payload.age': 25, 'payload.city': 'Madrid' },
      limit: 10,
      cursor: undefined,
    });
  });

  it('should combine standard and payload filters', async () => {
    const query = {
      source: 'source-1',
      'payload.age': '30',
      'payload.active': 'true',
    };

    jest.spyOn(repository, 'findWithCursor').mockResolvedValue({
      items: [],
      nextCursor: null,
    });
    jest.spyOn(repository, 'count').mockResolvedValue(0);

    await useCase.execute(query);

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

  it('should throw BadRequestException on invalid payload filter', async () => {
    const query = { 'payload.$where': 'malicious' };

    await expect(useCase.execute(query)).rejects.toThrow(BadRequestException);
  });

  it('should return data with pagination', async () => {
    const query = { source: 'source-1' };
    const mockItems = [
      { _id: '1', source: 'source-1', datasetId: 'test', payload: {} },
    ];

    jest.spyOn(repository, 'findWithCursor').mockResolvedValue({
      items: mockItems,
      nextCursor: 'cursor123',
    });
    jest.spyOn(repository, 'count').mockResolvedValue(100);

    const result = await useCase.execute(query);

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
});
