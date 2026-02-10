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

import type { MongoDbOperator } from './mongodb.types';

/**
 * MongoDB filter value — can be a primitive or an operator object
 * Examples:
 *   25                           → exact match
 *   { $regex: 'Ly', $options: 'i' } → partial text
 *   { $gte: 100, $lte: 500 }    → numeric range
 */
export type PayloadFilterValue =
  | string
  | number
  | boolean
  | null
  | MongoDbOperator;

/**
 * Payload-specific filters with MongoDB dot notation
 * Example: { 'payload.age': 25, 'payload.city': { $regex: 'Ma', $options: 'i' } }
 */
export interface PayloadFilters {
  [key: string]: PayloadFilterValue;
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
