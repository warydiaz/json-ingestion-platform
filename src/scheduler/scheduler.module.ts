import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { PublishIngestionJobsTask } from './publish-ingestion-jobs.task';
import { TriggerIngestionController } from './trigger-ingestion.controller';
import { MessagingModule } from '../messaging/messaging.module';

@Module({
  imports: [ScheduleModule.forRoot(), MessagingModule],
  controllers: [TriggerIngestionController],
  providers: [PublishIngestionJobsTask],
})
export class SchedulerModule {}
