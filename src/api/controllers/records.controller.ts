import { Controller, Get, Query } from '@nestjs/common';
import { GetRecordsUseCase } from '../use-cases/get-records.use-case';
import { GetRecordsQueryDto } from '../dto/get-records-query.dto';
import { ParsedFilters } from '../../common/decorators/parsed-filters.decorator';
import type { ParsedQuery } from '../../common/utils/query-parser.types';

@Controller('records')
export class RecordsController {
  constructor(private readonly getRecordsUseCase: GetRecordsUseCase) {}

  @Get()
  async getRecords(
    @Query() query: GetRecordsQueryDto,
    @ParsedFilters() filters: ParsedQuery,
  ) {
    return this.getRecordsUseCase.execute(filters, query.limit, query.cursor);
  }
}
