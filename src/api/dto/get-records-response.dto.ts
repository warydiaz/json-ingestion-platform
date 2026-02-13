import type { IngestedRecord } from '../../persistence/schemas/ingested-record.schema';

export interface PaginationInfo {
  total: number;
  limit: number;
  nextCursor: string | null;
  hasMore: boolean;
}

export interface GetRecordsResponse {
  data: IngestedRecord[];
  pagination: PaginationInfo;
}
