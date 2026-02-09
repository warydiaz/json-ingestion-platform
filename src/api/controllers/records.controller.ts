import { Controller, Get, Query } from '@nestjs/common';
import { GetRecordsUseCase } from '../use-cases/get-records.use-case';
import { GetRecordsQueryDto } from '../dto/get-records-query.dto';

@Controller('records')
export class RecordsController {
  constructor(private readonly getRecordsUseCase: GetRecordsUseCase) {}

  @Get()
  async getRecords(@Query() query: GetRecordsQueryDto) {
    return this.getRecordsUseCase.execute(query);
  }
}
