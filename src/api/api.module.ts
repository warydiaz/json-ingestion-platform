import { Module } from '@nestjs/common';
import { RecordsController } from './controllers/records.controller';
import { GetRecordsUseCase } from './use-cases/get-records.use-case';
import { PersistenceModule } from '../persistence/persistence.module';

@Module({
  imports: [PersistenceModule],
  controllers: [RecordsController],
  providers: [GetRecordsUseCase],
})
export class ApiModule {}
