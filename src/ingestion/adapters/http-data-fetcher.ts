import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { Readable } from 'stream';
import { parser } from 'stream-json';
import { streamArray } from 'stream-json/streamers/StreamArray';
import {
  DataBatch,
  DataStreamGenerator,
  JsonObject,
} from '../../common/utils/data-stream.types';
import { BATCH_SIZES } from '../../common/constants';

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

  private async *streamJson(
    url: string,
    batchSize: number,
  ): DataStreamGenerator {
    const response = await axios.get(url, { responseType: 'stream' });
    const inputStream: Readable = response.data;

    const jsonStream = inputStream.pipe(parser()).pipe(streamArray());

    let batch: DataBatch = [];

    for await (const { value } of jsonStream) {
      batch.push(value as JsonObject);

      if (batch.length >= batchSize) {
        this.logger.debug(`Yielding batch of ${batch.length} records`);
        yield batch;
        batch = [];
      }
    }

    if (batch.length > 0) {
      this.logger.debug(`Yielding final batch of ${batch.length} records`);
      yield batch;
    }

    this.logger.log(`Finished streaming dataset from ${url}`);
  }
}
