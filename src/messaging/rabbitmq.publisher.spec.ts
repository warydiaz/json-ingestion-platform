import { Test, TestingModule } from '@nestjs/testing';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { RabbitMQPublisher } from './rabbitmq.publisher';
import {
  DataSourceType,
  IngestMessageDto,
} from '../ingestion/dto/ingest-message.dto';
import { RABBITMQ_CONFIG } from '../common/constants';

describe('RabbitMQPublisher', () => {
  let publisher: RabbitMQPublisher;
  let mockAmqpConnection: Record<string, jest.Mock>;

  beforeEach(async () => {
    mockAmqpConnection = {
      publish: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RabbitMQPublisher,
        { provide: AmqpConnection, useValue: mockAmqpConnection },
      ],
    }).compile();

    publisher = module.get<RabbitMQPublisher>(RabbitMQPublisher);
  });

  it('should publish to the correct exchange and routing key', async () => {
    const message: IngestMessageDto = {
      datasetId: 'test',
      sourceType: DataSourceType.HTTP,
      url: 'https://example.com/data.json',
    };

    await publisher.publishIngestionJob(message);

    expect(mockAmqpConnection.publish).toHaveBeenCalledWith(
      RABBITMQ_CONFIG.EXCHANGE.INGESTION,
      RABBITMQ_CONFIG.ROUTING_KEY.INGESTION_JOB,
      message,
    );
  });

  it('should pass the complete message payload', async () => {
    const message: IngestMessageDto = {
      datasetId: 'large-data',
      sourceType: DataSourceType.HTTP,
      source: 'source-2',
      url: 'https://example.com/large.json',
      fieldMapping: { city: 'address.city' },
    };

    await publisher.publishIngestionJob(message);

    expect(mockAmqpConnection.publish).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(String),
      message,
    );
  });
});
