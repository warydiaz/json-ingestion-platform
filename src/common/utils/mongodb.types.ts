/**
 * MongoDB filter type-safe representation
 * Prevents 'any' usage in repository queries
 */
export interface MongoDbFilter {
  [key: string]: string | number | boolean | null | MongoDbOperator | undefined;
}

/**
 * MongoDB query operators
 * Supports common comparison and array operators
 */
export interface MongoDbOperator {
  $gt?: string | number | Date | { toString(): string };
  $gte?: string | number | Date | { toString(): string };
  $lt?: string | number | Date | { toString(): string };
  $lte?: string | number | Date | { toString(): string };
  $in?: Array<string | number>;
  $ne?: string | number | boolean;
}

/**
 * Parameters for cursor-based pagination
 */
export interface CursorPaginationParams {
  filter?: MongoDbFilter;
  limit: number;
  cursor?: string;
}

/**
 * Result of cursor-based pagination query
 */
export interface CursorPaginationResult<T> {
  items: T[];
  nextCursor: string | null;
}
