import { Module } from '@nestjs/common';
import { IngestDatasetWorker } from './workers/ingest-dataset.worker';
import { IngestDatasetUseCase } from './use-cases/ingest-dataset.use-case';
import { HttpDataFetcher } from './adapters/http-data-fetcher';
import { PersistenceModule } from '../persistence/persistence.module';

@Module({
  imports: [PersistenceModule],
  providers: [IngestDatasetWorker, IngestDatasetUseCase, HttpDataFetcher],
})
export class IngestionModule {}
