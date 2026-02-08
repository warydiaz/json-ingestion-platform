import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { IngestedDocument } from './schemas/ingested.schema';

export class IngestedRepository {
  constructor(
    @InjectModel(IngestedDocument.name)
    private readonly model: Model<IngestedDocument>,
  ) {}

  async create(data: Partial<IngestedDocument>) {
    return this.model.create(data);
  }

  async find(filters: Record<string, unknown>, limit: number) {
    return this.model.find(filters).limit(limit).lean();
  }
}
