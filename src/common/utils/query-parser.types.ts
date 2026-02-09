/**
 * Represents the input query parameters
 * Can contain standard filters and dynamic payload filters
 */
export interface QueryParams {
  source?: string;
  datasetId?: string;
  limit?: number;
  cursor?: string;
  [key: string]: string | number | boolean | undefined;
}

/**
 * Standard MongoDB filter fields (non-payload)
 */
export interface StandardFilters {
  source?: string;
  datasetId?: string;
  [key: string]: string | number | boolean | undefined;
}

/**
 * Payload-specific filters with MongoDB dot notation
 * Example: { 'payload.age': 25, 'payload.city': 'Madrid' }
 */
export interface PayloadFilters {
  [key: string]: string | number | boolean | null;
}

/**
 * Result of parsing query parameters
 */
export interface ParsedQuery {
  standardFilters: StandardFilters;
  payloadFilters: PayloadFilters;
}

/**
 * Supported primitive value types after parsing
 */
export type ParsedValue = string | number | boolean | null;
