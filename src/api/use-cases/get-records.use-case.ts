import { Injectable } from '@nestjs/common';
import { IngestedRecordRepository } from '../../persistence/repositories/ingested-record.repository';
import type { ParsedQuery } from '../../common/utils/query-parser.types';
import type { MongoDbFilter } from '../../common/utils/mongodb.types';
import type { GetRecordsResponse } from '../dto/get-records-response.dto';
import { PAGINATION_DEFAULTS } from '../../common/constants';

@Injectable()
export class GetRecordsUseCase {
  constructor(private readonly repository: IngestedRecordRepository) {}

  async execute(
    parsedFilters: ParsedQuery,
    limit: number = PAGINATION_DEFAULTS.LIMIT,
    cursor?: string,
  ): Promise<GetRecordsResponse> {
    const { standardFilters, payloadFilters } = parsedFilters;

    const filter: MongoDbFilter = {
      ...standardFilters,
      ...payloadFilters,
    };

    const hasFilters = Object.keys(filter).length > 0;
    const countPromise = hasFilters
      ? this.repository.count(filter)
      : this.repository.estimatedCount();

    const [result, total] = await Promise.all([
      this.repository.findWithCursor({ filter, limit, cursor }),
      countPromise,
    ]);

    return {
      data: result.items,
      pagination: {
        total,
        limit,
        nextCursor: result.nextCursor,
        hasMore: result.nextCursor !== null,
      },
    };
  }
}
