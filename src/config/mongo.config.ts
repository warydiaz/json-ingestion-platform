import { ConfigService } from '@nestjs/config';
import { MongooseModuleOptions } from '@nestjs/mongoose';

export const getMongoConfig = (
  configService: ConfigService,
): MongooseModuleOptions => ({
  uri: configService.getOrThrow<string>('MONGO_URI'),
});
