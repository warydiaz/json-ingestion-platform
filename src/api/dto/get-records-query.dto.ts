import { IsOptional, IsString, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { PAGINATION_DEFAULTS } from '../../common/constants';

export class GetRecordsQueryDto {
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
}
