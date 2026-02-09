import { Injectable, BadRequestException } from '@nestjs/common';
import { IngestedRecordRepository } from '../../persistence/repositories/ingested-record.repository';
import { QueryParserUtil } from '../../common/utils/query-parser.util';
import type { QueryParams } from '../../common/utils/query-parser.types';
import type { MongoDbFilter } from '../../common/utils/mongodb.types';
import { PAGINATION_DEFAULTS } from '../../common/constants';

@Injectable()
export class GetRecordsUseCase {
  constructor(private readonly repository: IngestedRecordRepository) {}

  async execute(query: QueryParams) {
    const { limit = PAGINATION_DEFAULTS.LIMIT, cursor } = query;

    try {
      // Parse query into standard filters (source, datasetId) and payload filters
      const { standardFilters, payloadFilters } =
        QueryParserUtil.parseQuery(query);

      // Combine all filters for MongoDB query
      const filter: MongoDbFilter = {
        ...standardFilters,
        ...payloadFilters,
      };

      // Execute query — use estimatedCount when no filters for O(1) performance
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
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
