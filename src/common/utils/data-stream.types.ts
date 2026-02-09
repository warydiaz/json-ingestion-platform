/**
 * Type-safe representation for streaming JSON data processing
 * Replaces usage of 'any' in data fetcher adapters
 */

/**
 * Represents any valid JSON value
 */
export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonObject
  | JsonArray;

/**
 * Represents a JSON object with string keys and JSON values
 */
export interface JsonObject {
  [key: string]: JsonValue;
}

/**
 * Represents a JSON array
 */
export type JsonArray = JsonValue[];

/**
 * Represents a batch of JSON data items for processing
 */
export type DataBatch = JsonObject[];

/**
 * Async generator for streaming data in batches
 * Used for memory-efficient processing of large datasets
 */
export type DataStreamGenerator = AsyncGenerator<DataBatch, void, unknown>;
