import { ConfigService } from '@nestjs/config';
import { RabbitMQConfig } from '@golevelup/nestjs-rabbitmq';
import { RABBITMQ_CONFIG } from '../common/constants';

export const getRabbitMQConfig = (
  configService: ConfigService,
): RabbitMQConfig => ({
  uri: configService.getOrThrow<string>('RABBITMQ_URI'),
  exchanges: [
    {
      name: RABBITMQ_CONFIG.EXCHANGE.INGESTION,
      type: 'topic',
    },
  ],
  channels: {
    [RABBITMQ_CONFIG.CHANNEL.DEFAULT]: {
      prefetchCount: 10,
      default: true,
    },
  },
});
