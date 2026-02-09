import {
  InvalidFieldPathException,
  EmptyFieldPathException,
} from '../exceptions';
import {
  QueryParams,
  ParsedQuery,
  ParsedValue,
  StandardFilters,
  PayloadFilters,
} from './query-parser.types';

export class QueryParserUtil {
  private static readonly PAYLOAD_PREFIX = 'payload.';
  private static readonly SAFE_FIELD_REGEX = /^[a-zA-Z0-9_.]+$/;
  private static readonly PAGINATION_PARAMS = ['limit', 'cursor'] as const;
  private static readonly MONGODB_OPERATOR_PREFIX = '$';

  // Type coercion constants
  private static readonly BOOLEAN_TRUE = 'true';
  private static readonly BOOLEAN_FALSE = 'false';
  private static readonly NULL_STRING = 'null';

  /**
   * Parse query parameters into MongoDB filter
   * Separates standard filters (source, datasetId) from payload filters
   *
   * @example
   * Input: { source: 'source-1', 'payload.age': '25', 'payload.city': 'Madrid' }
   * Output: {
   *   standardFilters: { source: 'source-1' },
   *   payloadFilters: { 'payload.age': 25, 'payload.city': 'Madrid' }
   * }
   */
  static parseQuery(query: QueryParams): ParsedQuery {
    // Validate input
    if (!query || typeof query !== 'object') {
      throw new Error('Query must be a valid object');
    }

    const standardFilters: StandardFilters = {};
    const payloadFilters: PayloadFilters = {};

    for (const [key, rawValue] of Object.entries(query)) {
      // Skip undefined values (e.g. from class-transformer DTO instances)
      if (rawValue === undefined) {
        continue;
      }

      // Skip pagination params
      if (this.isPaginationParam(key)) {
        continue;
      }

      if (key.startsWith(this.PAYLOAD_PREFIX)) {
        // Extract field path: "payload.age" -> "age"
        const fieldPath = key.substring(this.PAYLOAD_PREFIX.length);

        // Security: validate field path to prevent MongoDB injection
        this.validateFieldPath(fieldPath);

        // Parse value type (convert strings to proper types)
        const value = this.parseValue(rawValue);

        // Add to payload filters with MongoDB nested syntax
        payloadFilters[`payload.${fieldPath}`] = value;
      } else {
        // Standard filter (source, datasetId)
        standardFilters[key] = rawValue;
      }
    }

    return { standardFilters, payloadFilters };
  }

  /**
   * Check if a key is a pagination parameter
   */
  private static isPaginationParam(key: string): boolean {
    return this.PAGINATION_PARAMS.includes(
      key as (typeof this.PAGINATION_PARAMS)[number],
    );
  }

  /**
   * Validate field path to prevent MongoDB injection attacks
   * Rejects MongoDB operators ($where, $gt, etc.) and unsafe characters
   */
  private static validateFieldPath(fieldPath: string): void {
    // Reject empty paths
    if (!fieldPath) {
      throw new EmptyFieldPathException();
    }

    // Support nested paths: "address.city" is valid
    const parts = fieldPath.split('.');

    for (const part of parts) {
      // Reject MongoDB operators (anything starting with $)
      if (part.startsWith(this.MONGODB_OPERATOR_PREFIX)) {
        throw new InvalidFieldPathException(
          part,
          'MongoDB operators not allowed',
        );
      }

      // Reject unsafe characters (only allow alphanumeric, underscore)
      if (!this.isSafeFieldName(part)) {
        throw new InvalidFieldPathException(
          part,
          'only alphanumeric and underscore allowed',
        );
      }
    }
  }

  /**
   * Check if a field name contains only safe characters
   */
  private static isSafeFieldName(fieldName: string): boolean {
    return this.SAFE_FIELD_REGEX.test(fieldName);
  }

  /**
   * Parse string value to appropriate type
   * Converts strings to numbers, booleans, or null when possible
   */
  private static parseValue(value: unknown): ParsedValue {
    // Handle non-string primitive values
    if (typeof value === 'number' || typeof value === 'boolean') {
      return value;
    }

    // Handle null/undefined
    if (value === null || value === undefined) {
      return null;
    }

    // Handle objects (should not normally happen in query params)
    if (typeof value === 'object') {
      return null;
    }

    // Handle symbols and other exotic types
    if (typeof value !== 'string') {
      return null;
    }

    // Now TypeScript knows value is definitely a string
    const str = value.trim();

    // Try parsing in order: boolean, null, number, string
    // Note: We can't use ?? for null check because null is nullish
    const booleanValue = this.tryParseBoolean(str);
    if (booleanValue !== undefined) {
      return booleanValue;
    }

    if (str === this.NULL_STRING) {
      return null;
    }

    const numberValue = this.tryParseNumber(str);
    if (numberValue !== undefined) {
      return numberValue;
    }

    // Default: keep as string
    return str;
  }

  /**
   * Try to parse string as boolean
   * Returns true/false if valid, undefined otherwise
   */
  private static tryParseBoolean(str: string): boolean | undefined {
    if (str === this.BOOLEAN_TRUE) return true;
    if (str === this.BOOLEAN_FALSE) return false;
    return undefined;
  }

  /**
   * Try to parse string as number
   * Returns number if valid, undefined otherwise
   */
  private static tryParseNumber(str: string): number | undefined {
    // Empty string is not a valid number
    if (str === '') return undefined;

    const num = Number(str);
    return !isNaN(num) ? num : undefined;
  }
}
