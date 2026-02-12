import { Controller, Post, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiSecurity,
} from '@nestjs/swagger';
import { PublishIngestionJobsTask } from './publish-ingestion-jobs.task';
import { ApiKeyGuard } from '../common/guards/api-key.guard';

@ApiTags('Admin')
@ApiSecurity('api-key')
@UseGuards(ApiKeyGuard)
@Controller('admin')
export class TriggerIngestionController {
  constructor(private readonly task: PublishIngestionJobsTask) {}

  @Post('trigger-ingestion')
  @ApiOperation({
    summary: 'Manually trigger ingestion jobs for all configured datasets',
  })
  @ApiResponse({
    status: 201,
    description: 'Ingestion jobs published successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing API key',
  })
  async triggerIngestion() {
    await this.task.handleCron();
    return { message: 'Ingestion jobs published successfully' };
  }
}
