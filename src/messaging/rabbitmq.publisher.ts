import { Injectable } from '@nestjs/common';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { IngestMessageDto } from '../ingestion/dto/ingest-message.dto';
import { RABBITMQ_CONFIG } from '../common/constants';
@Injectable()
export class RabbitMQPublisher {
  constructor(private readonly amqpConnection: AmqpConnection) {}

  async publishIngestionJob(message: IngestMessageDto): Promise<void> {
    await this.amqpConnection.publish(
      RABBITMQ_CONFIG.EXCHANGE.INGESTION,
      RABBITMQ_CONFIG.ROUTING_KEY.INGESTION_JOB,
      message,
    );
  }
}
