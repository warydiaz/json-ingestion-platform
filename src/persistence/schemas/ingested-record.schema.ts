import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import type { RecordPayload } from '../../common/utils/payload.types';

export type IngestedRecordDocument = IngestedRecord & Document;

@Schema({ timestamps: true })
export class IngestedRecord {
  @Prop({ required: true })
  source: string;

  @Prop({ required: true })
  datasetId: string;

  @Prop({ type: Object, required: true })
  payload: RecordPayload;

  @Prop({ index: true })
  ingestionDate: Date;
}

export const IngestedRecordSchema =
  SchemaFactory.createForClass(IngestedRecord);

IngestedRecordSchema.index({ source: 1, datasetId: 1 });

// Indexes for commonly queried payload fields
IngestedRecordSchema.index({ 'payload.address.city': 1 });
IngestedRecordSchema.index({ 'payload.address.country': 1 });
IngestedRecordSchema.index({ 'payload.isAvailable': 1 });
IngestedRecordSchema.index({ 'payload.priceForNight': 1 });
