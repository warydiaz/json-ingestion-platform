import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { RabbitMQPublisher } from '../messaging/rabbitmq.publisher';
import { DatasetsConfigService } from '../config/datasets.config';
import { SCHEDULER_CONFIG } from '../common/constants';

@Injectable()
export class PublishIngestionJobsTask {
  private readonly logger = new Logger(PublishIngestionJobsTask.name);

  constructor(private readonly publisher: RabbitMQPublisher) {}

  @Cron(SCHEDULER_CONFIG.CRON.INGESTION_JOBS)
  async handleCron() {
    this.logger.log('Publishing ingestion jobs...');

    // Load datasets from configuration file
    const datasets = DatasetsConfigService.loadDatasets();

    this.logger.log(`Found ${datasets.length} datasets to ingest`);

    // Publish a job for each configured dataset
    for (const dataset of datasets) {
      this.logger.log(
        `Publishing job for dataset: ${dataset.datasetId} (${dataset.description || 'no description'})`,
      );

      await this.publisher.publishIngestionJob({
        datasetId: dataset.datasetId,
        source: dataset.source,
        sourceType: dataset.sourceType,
        url: dataset.url,
        bucket: dataset.bucket,
        key: dataset.key,
        fieldMapping: dataset.fieldMapping,
      });
    }

    this.logger.log(
      `Jobs published successfully (${datasets.length} datasets)`,
    );
  }
}
