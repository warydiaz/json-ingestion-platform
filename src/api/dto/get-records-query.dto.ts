import { IsOptional, IsString, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { PAGINATION_DEFAULTS } from '../../common/constants';
import type { QueryParams } from '../../common/utils/query-parser.types';

export class GetRecordsQueryDto implements QueryParams {
  @IsOptional()
  @IsString()
  source?: string;

  @IsOptional()
  @IsString()
  datasetId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(PAGINATION_DEFAULTS.MIN_LIMIT)
  @Max(PAGINATION_DEFAULTS.MAX_LIMIT)
  limit?: number;

  @IsOptional()
  @IsString()
  cursor?: string;

  // Allow dynamic payload filters (e.g., payload.age, payload.city)
  // Validation happens in use-case via QueryParserUtil
  [key: string]: string | number | boolean | undefined;
}
