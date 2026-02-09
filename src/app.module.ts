import { Module } from '@nestjs/common';
import { ConfigModule } from './config/config.module';
import { ApiModule } from './api/api.module';
import { IngestionModule } from './ingestion/ingestion.module';
import { PersistenceModule } from './persistence/persistence.module';
import { SchedulerModule } from './scheduler/scheduler.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule,
    PersistenceModule,
    SchedulerModule,
    HealthModule,
    ApiModule,
    IngestionModule,
  ],
})
export class AppModule {}
