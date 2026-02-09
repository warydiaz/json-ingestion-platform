import { Injectable, Logger } from '@nestjs/common';
import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { IngestDatasetUseCase } from '../use-cases/ingest-dataset.use-case';
import { IngestMessageDto } from '../dto/ingest-message.dto';
import { RABBITMQ_CONFIG } from '../../common/constants';

@Injectable()
export class IngestDatasetWorker {
  private readonly logger = new Logger(IngestDatasetWorker.name);

  constructor(private readonly ingestUseCase: IngestDatasetUseCase) {}

  @RabbitSubscribe({
    exchange: RABBITMQ_CONFIG.EXCHANGE.INGESTION,
    routingKey: RABBITMQ_CONFIG.ROUTING_KEY.INGESTION_JOB,
    queue: RABBITMQ_CONFIG.QUEUE.INGESTION,
  })
  async handle(message: IngestMessageDto): Promise<void> {
    this.logger.log(`Received ingestion job for dataset ${message.datasetId}`);

    try {
      await this.ingestUseCase.execute(message);
      this.logger.log(`Ingestion completed for dataset ${message.datasetId}`);
    } catch (error) {
      this.logger.error(
        `Ingestion failed for dataset ${message.datasetId}`,
        error.stack,
      );

      // IMPORTANT: Throwing the error triggers RabbitMQ retry mechanism
      throw error;
    }
  }
}
