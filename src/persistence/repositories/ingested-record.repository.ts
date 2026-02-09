import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  IngestedRecord,
  IngestedRecordDocument,
} from '../schemas/ingested-record.schema';
import {
  MongoDbFilter,
  CursorPaginationParams,
  CursorPaginationResult,
} from '../../common/utils/mongodb.types';

@Injectable()
export class IngestedRecordRepository {
  constructor(
    @InjectModel(IngestedRecord.name)
    private readonly model: Model<IngestedRecordDocument>,
  ) {}

  async insertMany(records: Partial<IngestedRecord>[]): Promise<void> {
    if (!records.length) return;

    await this.model.insertMany(records, {
      ordered: false,
    });
  }

  async findWithCursor(
    params: CursorPaginationParams,
  ): Promise<CursorPaginationResult<IngestedRecord>> {
    const { filter = {}, limit, cursor } = params;

    const query: MongoDbFilter = { ...filter };

    if (cursor) {
      query._id = { $gt: new Types.ObjectId(cursor) };
    }

    const data = await this.model
      .find(query)
      .sort({ _id: 1 })
      .limit(limit + 1)
      .lean();

    const hasNextPage = data.length > limit;
    const items = hasNextPage ? data.slice(0, limit) : data;

    return {
      items,
      nextCursor: hasNextPage ? items[items.length - 1]._id.toString() : null,
    };
  }

  async count(filter: MongoDbFilter = {}): Promise<number> {
    return this.model.countDocuments(filter);
  }

  async estimatedCount(): Promise<number> {
    return this.model.estimatedDocumentCount();
  }

  async deleteByDataset(source: string, datasetId: string): Promise<number> {
    const result = await this.model.deleteMany({ source, datasetId });
    return result.deletedCount;
  }
}
