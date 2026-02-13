import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { PublishIngestionJobsTask } from './publish-ingestion-jobs.task';
import { TriggerIngestionController } from './trigger-ingestion.controller';
import { MessagingModule } from '../messaging/messaging.module';
import { ApiKeyGuard } from '../common/guards/api-key.guard';

@Module({
  imports: [ScheduleModule.forRoot(), MessagingModule],
  controllers: [TriggerIngestionController],
  providers: [PublishIngestionJobsTask, ApiKeyGuard],
})
export class SchedulerModule {}
