import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { IngestedRecordRepository } from './repositories/ingested-record.repository';
import {
  IngestedRecord,
  IngestedRecordSchema,
} from './schemas/ingested-record.schema';
import { getMongoConfig } from '../config/mongo.config';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      useFactory: getMongoConfig,
      inject: [ConfigService],
    }),

    MongooseModule.forFeature([
      { name: IngestedRecord.name, schema: IngestedRecordSchema },
    ]),
  ],
  providers: [IngestedRecordRepository],
  exports: [IngestedRecordRepository],
})
export class PersistenceModule {}
