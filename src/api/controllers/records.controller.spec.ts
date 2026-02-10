import { Test, TestingModule } from '@nestjs/testing';
import { RecordsController } from './records.controller';
import { GetRecordsUseCase } from '../use-cases/get-records.use-case';
import type { ParsedQuery } from '../../common/utils/query-parser.types';

describe('RecordsController', () => {
  let controller: RecordsController;
  let getRecordsUseCase: GetRecordsUseCase;

  beforeEach(async () => {
    const mockGetRecordsUseCase = {
      execute: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [RecordsController],
      providers: [
        {
          provide: GetRecordsUseCase,
          useValue: mockGetRecordsUseCase,
        },
      ],
    }).compile();

    controller = module.get<RecordsController>(RecordsController);
    getRecordsUseCase = module.get<GetRecordsUseCase>(GetRecordsUseCase);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call getRecordsUseCase.execute with parsed filters, limit, and cursor', async () => {
    const query = { source: 'source-1', limit: 20, cursor: 'abc123' };
    const filters: ParsedQuery = {
      standardFilters: { source: 'source-1' },
      payloadFilters: {},
    };
    const expectedResult = {
      data: [],
      pagination: {
        total: 0,
        limit: 20,
        nextCursor: null,
        hasMore: false,
      },
    };

    jest.spyOn(getRecordsUseCase, 'execute').mockResolvedValue(expectedResult);

    const result = await controller.getRecords(query, filters);

    expect(getRecordsUseCase.execute).toHaveBeenCalledWith(
      filters,
      20,
      'abc123',
    );
    expect(result).toBe(expectedResult);
  });

  it('should pass undefined limit and cursor when not provided', async () => {
    const query = { source: 'source-1' };
    const filters: ParsedQuery = {
      standardFilters: { source: 'source-1' },
      payloadFilters: {},
    };
    const expectedResult = {
      data: [],
      pagination: {
        total: 0,
        limit: 10,
        nextCursor: null,
        hasMore: false,
      },
    };

    jest.spyOn(getRecordsUseCase, 'execute').mockResolvedValue(expectedResult);

    const result = await controller.getRecords(query, filters);

    expect(getRecordsUseCase.execute).toHaveBeenCalledWith(
      filters,
      undefined,
      undefined,
    );
    expect(result).toBe(expectedResult);
  });
});
