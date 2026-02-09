import { Test, TestingModule } from '@nestjs/testing';
import { RecordsController } from './records.controller';
import { GetRecordsUseCase } from '../use-cases/get-records.use-case';

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

  it('should call getRecordsUseCase.execute with query params', async () => {
    const query = { source: 'source-1', 'payload.age': '25' };
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

    const result = await controller.getRecords(query);

    expect(getRecordsUseCase.execute).toHaveBeenCalledWith(query);
    expect(result).toBe(expectedResult);
  });
});
