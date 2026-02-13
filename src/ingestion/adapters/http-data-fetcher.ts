import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { Readable } from 'stream';
import { parser } from 'stream-json';
import { streamArray } from 'stream-json/streamers/StreamArray';
import type {
  DataBatch,
  DataStreamGenerator,
  JsonObject,
} from '../../common/utils/data-stream.types';
import { BATCH_SIZES } from '../../common/constants';

const INACTIVITY_TIMEOUT_MS = 30_000;
const CONNECTION_TIMEOUT_MS = 30_000;
const MAX_BATCH_BYTES = 50 * 1024 * 1024; // 50 MB

@Injectable()
export class HttpDataFetcher {
  private readonly logger = new Logger(HttpDataFetcher.name);

  fetch(
    url: string,
    batchSize: number = BATCH_SIZES.DATA_INGESTION,
  ): DataStreamGenerator {
    this.logger.log(`Fetching dataset from ${url} (batch size: ${batchSize})`);
    return this.streamJson(url, batchSize);
  }

  private static isJsonObject(val: unknown): val is JsonObject {
    return (
      typeof val === 'object' &&
      val !== null &&
      !Array.isArray(val) &&
      !(val instanceof Date)
    );
  }

  private async *streamJson(
    url: string,
    batchSize: number,
  ): DataStreamGenerator {
    const abortController = new AbortController();
    let inputStream: Readable | null = null;
    let jsonStream: Readable | null = null;
    let inactivityTimer: ReturnType<typeof setTimeout> | null = null;

    const resetInactivityTimer = (): void => {
      if (inactivityTimer) clearTimeout(inactivityTimer);
      inactivityTimer = setTimeout(() => {
        this.logger.error(`Stream inactivity timeout after ${INACTIVITY_TIMEOUT_MS}ms for ${url}`);
        abortController.abort();
      }, INACTIVITY_TIMEOUT_MS);
    };

    try {
      const response = await axios.get<Readable>(url, {
        responseType: 'stream',
        signal: abortController.signal,
        timeout: CONNECTION_TIMEOUT_MS,
      });

      inputStream = response.data;

      const jsonParser = parser();
      const arrayStream = streamArray();
      jsonStream = inputStream.pipe(jsonParser).pipe(arrayStream);

      // Propagate errors through the pipeline
      inputStream.on('error', (err) => {
        jsonStream?.destroy(err);
      });
      jsonParser.on('error', (err) => {
        jsonStream?.destroy(err);
      });

      // Reset inactivity timer on incoming data
      inputStream.on('data', () => resetInactivityTimer());
      resetInactivityTimer();

      let batch: DataBatch = [];
      let batchBytes = 0;

      for await (const { value } of jsonStream) {
        if (!HttpDataFetcher.isJsonObject(value)) {
          this.logger.warn(`Skipping non-object value: ${typeof value}`);
          continue;
        }

        batch.push(value);
        batchBytes += JSON.stringify(value).length;

        if (batch.length >= batchSize || batchBytes >= MAX_BATCH_BYTES) {
          this.logger.debug(
            `Yielding batch of ${batch.length} records (${batchBytes} bytes)`,
          );
          yield batch;
          batch = [];
          batchBytes = 0;
        }
      }

      if (batch.length > 0) {
        this.logger.debug(
          `Yielding final batch of ${batch.length} records (${batchBytes} bytes)`,
        );
        yield batch;
      }

      this.logger.log(`Finished streaming dataset from ${url}`);
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        this.logger.error(`Stream aborted for ${url}`);
      }
      throw error;
    } finally {
      if (inactivityTimer) clearTimeout(inactivityTimer);
      if (jsonStream && !jsonStream.destroyed) {
        jsonStream.destroy();
      }
      if (inputStream && !inputStream.destroyed) {
        inputStream.destroy();
      }
    }
  }
}
