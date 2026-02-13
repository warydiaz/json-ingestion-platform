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

const STREAM_TIMEOUT_MS = 30_000;
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

    const timeout = setTimeout(() => {
      abortController.abort();
    }, STREAM_TIMEOUT_MS);

    try {
      const response = await axios.get<Readable>(url, {
        responseType: 'stream',
        signal: abortController.signal,
        timeout: STREAM_TIMEOUT_MS,
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
        this.logger.error(`Stream timeout after ${STREAM_TIMEOUT_MS}ms for ${url}`);
      }
      throw error;
    } finally {
      clearTimeout(timeout);
      if (jsonStream && !jsonStream.destroyed) {
        jsonStream.destroy();
      }
      if (inputStream && !inputStream.destroyed) {
        inputStream.destroy();
      }
    }
  }
}
