import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { GetRecordsUseCase } from '../use-cases/get-records.use-case';
import { GetRecordsQueryDto } from '../dto/get-records-query.dto';
import { ParsedFilters } from '../../common/decorators/parsed-filters.decorator';
import type { ParsedQuery } from '../../common/utils/query-parser.types';

@ApiTags('Records')
@Controller('records')
export class RecordsController {
  constructor(private readonly getRecordsUseCase: GetRecordsUseCase) {}

  @Get()
  @ApiOperation({
    summary:
      'Retrieve ingested records with filtering and cursor-based pagination',
  })
  @ApiQuery({
    name: 'source',
    required: false,
    description: 'Filter by data source',
  })
  @ApiQuery({
    name: 'datasetId',
    required: false,
    description: 'Filter by dataset ID',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Number of records per page (1-100)',
    example: 10,
  })
  @ApiQuery({
    name: 'cursor',
    required: false,
    description: 'Cursor for pagination (ObjectId of last record)',
  })
  @ApiResponse({ status: 200, description: 'Records retrieved successfully' })
  @ApiResponse({ status: 400, description: 'Invalid query parameters' })
  async getRecords(
    @Query() query: GetRecordsQueryDto,
    @ParsedFilters() filters: ParsedQuery,
  ) {
    return this.getRecordsUseCase.execute(filters, query.limit, query.cursor);
  }
}
