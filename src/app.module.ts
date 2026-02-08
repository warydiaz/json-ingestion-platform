import { Module } from '@nestjs/common';
import { ApiModule } from './api/api.module';
import { IngestionModule } from './ingestion/ingestion.module';
import { PersistenceModule } from './persistence/persistence.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PersistenceModule,
    process.env.APP_ROLE === 'api' ? ApiModule : IngestionModule,
  ],
})
export class AppModule {}
