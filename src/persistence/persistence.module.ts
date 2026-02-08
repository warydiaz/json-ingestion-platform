import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { IngestedDocument, IngestedSchema } from './schemas/ingested.schema';
import { IngestedRepository } from './ingested.repository';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('MONGO_URI'),
      }),
      inject: [ConfigService],
    }),

    MongooseModule.forFeature([
      {
        name: IngestedDocument.name,
        schema: IngestedSchema,
      },
    ]),
  ],
  providers: [IngestedRepository],
  exports: [IngestedRepository],
})
export class PersistenceModule {}
