import { Controller, Post } from '@nestjs/common';
import { PublishIngestionJobsTask } from './publish-ingestion-jobs.task';

@Controller('admin')
export class TriggerIngestionController {
  constructor(private readonly task: PublishIngestionJobsTask) {}

  @Post('trigger-ingestion')
  async triggerIngestion() {
    await this.task.handleCron();
    return { message: 'Ingestion jobs published successfully' };
  }
}
