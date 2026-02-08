import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class IngestedDocument extends Document {
  @Prop({ required: true })
  source: string;

  @Prop({ type: Object, required: true })
  attributes: Record<string, unknown>;
}

export const IngestedSchema = SchemaFactory.createForClass(IngestedDocument);
