import { Injectable, Logger } from '@nestjs/common';
import { IngestedRecordRepository } from '../../persistence/repositories/ingested-record.repository';
import {
  type IngestMessageDto,
  type HttpIngestMessage,
  DataSourceType,
  toIngestMessage,
} from '../dto/ingest-message.dto';
import { HttpDataFetcher } from '../adapters/http-data-fetcher';
import { PayloadTransformerUtil } from '../../common/utils/payload-transformer.util';
import type { CreateRecordInput } from '../../common/utils/mongodb.types';
import type { JsonObject } from '../../common/utils/data-stream.types';
import type { RecordPayload } from '../../common/utils/payload.types';
import { BATCH_SIZES } from '../../common/constants';

@Injectable()
export class IngestDatasetUseCase {
  private readonly logger = new Logger(IngestDatasetUseCase.name);

  constructor(
    private readonly repository: IngestedRecordRepository,
    private readonly httpFetcher: HttpDataFetcher,
  ) {}

  async execute(dto: IngestMessageDto): Promise<void> {
    const message = toIngestMessage(dto);

    if (message.sourceType !== DataSourceType.HTTP) {
      this.logger.warn(
        `Source type ${message.sourceType} not yet supported for dataset: ${message.datasetId}`,
      );
      return;
    }

    await this.ingestFromHttp(message);
  }

  private async ingestFromHttp(message: HttpIngestMessage): Promise<void> {
    const source = message.source ?? message.sourceType;

    this.logger.log(`Starting ingestion for dataset: ${message.datasetId}`);

    let totalProcessed = 0;
    const ingestionDate = new Date();

    // 1. Stream and insert new records first
    const dataStream = this.httpFetcher.fetch(
      message.url,
      BATCH_SIZES.DATA_INGESTION,
    );

    try {
      // 2. Remove existing records before inserting new ones
      const deleted = await this.repository.deleteByDataset(
        source,
        message.datasetId,
      );
      if (deleted > 0) {
        this.logger.log(
          `Removed ${deleted} existing records for dataset: ${message.datasetId}`,
        );
      }

      // 3. Process in batches
      for await (const batch of dataStream) {
        const records = this.transformBatch(
          batch,
          source,
          message.datasetId,
          message.fieldMapping,
          ingestionDate,
        );

        await this.repository.insertMany(records);
        totalProcessed += records.length;

        this.logger.log(
          `Processed ${totalProcessed} records for dataset: ${message.datasetId}`,
        );
      }

      this.logger.log(
        `Ingestion completed for dataset: ${message.datasetId}. Total records: ${totalProcessed}`,
      );
    } catch (error) {
      this.logger.error(
        `Ingestion failed for dataset: ${message.datasetId} after ${totalProcessed} records`,
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
  }

  private transformBatch(
    batch: JsonObject[],
    source: string,
    datasetId: string,
    fieldMapping: Record<string, string> | undefined,
    ingestionDate: Date,
  ): CreateRecordInput[] {
    return batch.map((item) => {
      const payload = fieldMapping
        ? PayloadTransformerUtil.transform(item, fieldMapping)
        : item;

      return {
        source,
        datasetId,
        payload: payload as RecordPayload,
        ingestionDate,
      };
    });
  }
}
