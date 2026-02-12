import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { IngestedRecordRepository } from './ingested-record.repository';
import { IngestedRecord } from '../schemas/ingested-record.schema';

jest.mock('../../config/datasets.config', () => ({
  DatasetsConfigService: {
    loadDatasets: jest
      .fn()
      .mockReturnValue([
        { fieldMapping: { city: 'address.city', price: 'pricePerNight' } },
      ]),
  },
}));

describe('IngestedRecordRepository', () => {
  let repository: IngestedRecordRepository;
  let mockModel: Record<string, jest.Mock>;

  beforeEach(async () => {
    mockModel = {
      insertMany: jest.fn().mockResolvedValue([]),
      find: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue([]),
      countDocuments: jest.fn().mockResolvedValue(0),
      estimatedDocumentCount: jest.fn().mockResolvedValue(0),
      deleteMany: jest.fn().mockResolvedValue({ deletedCount: 0 }),
      collection: {
        createIndex: jest.fn().mockResolvedValue('ok'),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IngestedRecordRepository,
        { provide: getModelToken(IngestedRecord.name), useValue: mockModel },
      ],
    }).compile();

    repository = module.get<IngestedRecordRepository>(IngestedRecordRepository);
  });

  describe('insertMany', () => {
    it('should insert records using the model', async () => {
      const records = [
        { source: 's1', datasetId: 'd1', payload: { city: 'Lyon' } },
      ];

      await repository.insertMany(records);

      expect(mockModel.insertMany).toHaveBeenCalledWith(records, {
        ordered: false,
      });
    });

    it('should skip insertion for empty array', async () => {
      await repository.insertMany([]);

      expect(mockModel.insertMany).not.toHaveBeenCalled();
    });
  });

  describe('findWithCursor', () => {
    it('should query without cursor filter when cursor is not provided', async () => {
      mockModel.lean.mockResolvedValue([]);

      await repository.findWithCursor({ filter: { source: 's1' }, limit: 10 });

      expect(mockModel.find).toHaveBeenCalledWith({ source: 's1' });
      expect(mockModel.sort).toHaveBeenCalledWith({ _id: 1 });
      expect(mockModel.limit).toHaveBeenCalledWith(11);
    });

    it('should add $gt filter when cursor is provided', async () => {
      const cursorId = new Types.ObjectId().toString();
      mockModel.lean.mockResolvedValue([]);

      await repository.findWithCursor({
        filter: {},
        limit: 10,
        cursor: cursorId,
      });

      expect(mockModel.find).toHaveBeenCalledWith({
        _id: { $gt: expect.any(Types.ObjectId) as unknown },
      });
    });

    it('should detect hasNextPage and return correct items', async () => {
      const items = Array.from({ length: 3 }, (_, i) => ({
        _id: new Types.ObjectId(),
        source: 's1',
        datasetId: 'd1',
        payload: { id: i },
      }));
      mockModel.lean.mockResolvedValue(items);

      const result = await repository.findWithCursor({
        filter: {},
        limit: 2,
      });

      expect(result.items).toHaveLength(2);
      expect(result.nextCursor).toBe(items[1]._id.toString());
    });

    it('should return null nextCursor when no more pages', async () => {
      const items = [{ _id: new Types.ObjectId(), source: 's1', payload: {} }];
      mockModel.lean.mockResolvedValue(items);

      const result = await repository.findWithCursor({
        filter: {},
        limit: 10,
      });

      expect(result.items).toHaveLength(1);
      expect(result.nextCursor).toBeNull();
    });
  });

  describe('count', () => {
    it('should count documents with filter', async () => {
      mockModel.countDocuments.mockResolvedValue(42);

      const result = await repository.count({ source: 's1' });

      expect(result).toBe(42);
      expect(mockModel.countDocuments).toHaveBeenCalledWith({ source: 's1' });
    });
  });

  describe('estimatedCount', () => {
    it('should return estimated document count', async () => {
      mockModel.estimatedDocumentCount.mockResolvedValue(5000);

      const result = await repository.estimatedCount();

      expect(result).toBe(5000);
    });
  });

  describe('deleteByDataset', () => {
    it('should delete by source and datasetId and return count', async () => {
      mockModel.deleteMany.mockResolvedValue({ deletedCount: 15 });

      const result = await repository.deleteByDataset('s1', 'd1');

      expect(result).toBe(15);
      expect(mockModel.deleteMany).toHaveBeenCalledWith({
        source: 's1',
        datasetId: 'd1',
      });
    });
  });

  describe('ensurePayloadIndexes', () => {
    it('should create indexes for payload fields on module init', async () => {
      await repository.onModuleInit();

      expect(mockModel.collection.createIndex).toHaveBeenCalledWith(
        { 'payload.city': 1 },
        { background: true },
      );
      expect(mockModel.collection.createIndex).toHaveBeenCalledWith(
        { 'payload.price': 1 },
        { background: true },
      );
    });
  });
});
