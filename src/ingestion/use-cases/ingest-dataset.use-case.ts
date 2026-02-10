import { Injectable, Logger } from '@nestjs/common';
import { IngestedRecordRepository } from '../../persistence/repositories/ingested-record.repository';
import { IngestMessageDto } from '../dto/ingest-message.dto';
import { HttpDataFetcher } from '../adapters/http-data-fetcher';
import { MissingRequiredFieldException } from '../../common/exceptions';
import type { RecordPayload } from '../../common/utils/payload.types';
import { PayloadTransformerUtil } from '../../common/utils/payload-transformer.util';
import { BATCH_SIZES } from '../../common/constants';

@Injectable()
export class IngestDatasetUseCase {
  private readonly logger = new Logger(IngestDatasetUseCase.name);

  constructor(
    private readonly repository: IngestedRecordRepository,
    private readonly httpFetcher: HttpDataFetcher,
  ) {}

  async execute(message: IngestMessageDto): Promise<void> {
    if (!message.url) {
      throw new MissingRequiredFieldException(
        'url',
        `dataset: ${message.datasetId}`,
      );
    }

    const source = message.source || message.sourceType;

    this.logger.log(`Starting ingestion for dataset: ${message.datasetId}`);

    // 1. Remove existing records to prevent duplicates on re-ingestion
    const deleted = await this.repository.deleteByDataset(
      source,
      message.datasetId,
    );
    if (deleted > 0) {
      this.logger.log(
        `Removed ${deleted} existing records for dataset: ${message.datasetId}`,
      );
    }

    let totalProcessed = 0;
    const ingestionDate = new Date();

    // 2. Fetch data con streaming (funciona para cualquier tamaño)
    const dataStream = this.httpFetcher.fetch(
      message.url,
      BATCH_SIZES.DATA_INGESTION,
    );

    // 3. Procesar por batches
    for await (const batch of dataStream) {
      // Transformar el batch
      const records = batch.map((item) => {
        const payload = message.fieldMapping
          ? PayloadTransformerUtil.transform(item, message.fieldMapping)
          : item;

        return {
          source,
          datasetId: message.datasetId,
          payload: payload as RecordPayload,
          ingestionDate,
        };
      });

      // Persistir el batch
      await this.repository.insertMany(records);
      totalProcessed += records.length;

      this.logger.log(
        `Processed ${totalProcessed} records for dataset: ${message.datasetId}`,
      );
    }

    this.logger.log(
      `Ingestion completed for dataset: ${message.datasetId}. Total records: ${totalProcessed}`,
    );
  }
}
