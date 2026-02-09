import { Module } from '@nestjs/common';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { ConfigService } from '@nestjs/config';
import { RabbitMQPublisher } from './rabbitmq.publisher';
import { getRabbitMQConfig } from '../config/rabbitmq.config';

@Module({
  imports: [
    RabbitMQModule.forRootAsync({
      useFactory: getRabbitMQConfig,
      inject: [ConfigService],
    }),
  ],
  providers: [RabbitMQPublisher],
  exports: [RabbitMQPublisher],
})
export class MessagingModule {}
