import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { QueryParserUtil } from '../utils/query-parser.util';
import type { ParsedQuery } from '../utils/query-parser.types';

/**
 * Custom parameter decorator that extracts and parses query filters
 * from the request, separating standard filters from payload filters.
 *
 * @example
 * @Get()
 * async getRecords(@ParsedFilters() filters: ParsedQuery) {
 *   // filters.standardFilters → { source: '...', datasetId: '...' }
 *   // filters.payloadFilters  → { 'payload.city': { $regex: 'Ly', $options: 'i' } }
 * }
 */
export const ParsedFilters = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): ParsedQuery => {
    const request = ctx.switchToHttp().getRequest<Request>();
    return QueryParserUtil.parseQuery(request.query as Record<string, string>);
  },
);
