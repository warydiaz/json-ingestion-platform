import {
  InvalidFieldPathException,
  EmptyFieldPathException,
} from '../exceptions';
import type {
  QueryParams,
  ParsedQuery,
  ParsedValue,
  StandardFilters,
  PayloadFilters,
} from './query-parser.types';
import type { MongoDbOperator } from './mongodb.types';

// Range suffixes for numeric range queries
const RANGE_SUFFIXES: Record<string, string> = {
  _min: '$gte',
  _max: '$lte',
  _gt: '$gt',
  _lt: '$lt',
};

export class QueryParserUtil {
  private static readonly SAFE_FIELD_REGEX = /^[a-zA-Z0-9_.]+$/;
  private static readonly STANDARD_PARAMS = ['source', 'datasetId'] as const;
  private static readonly PAGINATION_PARAMS = ['limit', 'cursor'] as const;
  private static readonly MONGODB_OPERATOR_PREFIX = '$';

  // Type coercion constants
  private static readonly BOOLEAN_TRUE = 'true';
  private static readonly BOOLEAN_FALSE = 'false';
  private static readonly NULL_STRING = 'null';

  /**
   * Parse query parameters into MongoDB filter
   * Separates standard filters (source, datasetId) from payload filters
   * Any unknown parameter is treated as a payload filter automatically
   *
   * Supports:
   * - Exact match: city=Lyon, available=true, price=120
   * - Partial text (case-insensitive): name=john → regex match
   * - Numeric ranges: price_min=100&price_max=500, age_gt=18
   *
   * @example
   * Input: { source: 'source-1', city: 'Ly', price_min: '100', price_max: '500' }
   * Output: {
   *   standardFilters: { source: 'source-1' },
   *   payloadFilters: {
   *     'payload.city': { $regex: 'Ly', $options: 'i' },
   *     'payload.price': { $gte: 100, $lte: 500 }
   *   }
   * }
   */
  static parseQuery(query: QueryParams): ParsedQuery {
    if (!query || typeof query !== 'object') {
      throw new Error('Query must be a valid object');
    }

    const standardFilters: StandardFilters = {};
    const payloadFilters: PayloadFilters = {};

    for (const [key, rawValue] of Object.entries(query)) {
      if (rawValue === undefined) {
        continue;
      }

      if (this.isPaginationParam(key)) {
        continue;
      }

      if (this.isStandardParam(key)) {
        standardFilters[key] = rawValue;
      } else {
        this.addPayloadFilter(key, rawValue, payloadFilters);
      }
    }

    return { standardFilters, payloadFilters };
  }

  private static isMongoDbOperator(val: unknown): val is MongoDbOperator {
    return (
      typeof val === 'object' &&
      val !== null &&
      !Array.isArray(val) &&
      Object.keys(val).every((k) => k.startsWith('$'))
    );
  }

  /**
   * Add a payload filter, handling range suffixes and partial text
   */
  private static addPayloadFilter(
    key: string,
    rawValue: string | number | boolean,
    payloadFilters: PayloadFilters,
  ): void {
    // Check for range suffix (_min, _max, _gt, _lt)
    const rangeMatch = this.extractRangeSuffix(key);

    if (rangeMatch) {
      const { fieldPath, operator } = rangeMatch;
      this.validateFieldPath(fieldPath);
      const numValue = this.parseNumericValue(rawValue);
      if (numValue === undefined) return;

      const mongoKey = `payload.${fieldPath}`;
      const existing = payloadFilters[mongoKey];

      // Merge with existing range operators on the same field
      if (this.isMongoDbOperator(existing)) {
        (existing as Record<string, unknown>)[operator] = numValue;
      } else {
        payloadFilters[mongoKey] = { [operator]: numValue };
      }
    } else {
      this.validateFieldPath(key);
      const value = this.parseValue(rawValue);
      const mongoKey = `payload.${key}`;

      // Strings → partial text search (case-insensitive regex)
      if (typeof value === 'string') {
        payloadFilters[mongoKey] = {
          $regex: this.escapeRegex(value),
          $options: 'i',
        };
      } else {
        payloadFilters[mongoKey] = value;
      }
    }
  }

  /**
   * Extract range suffix from field name
   * e.g. "price_min" → { fieldPath: "price", operator: "$gte" }
   */
  private static extractRangeSuffix(
    key: string,
  ): { fieldPath: string; operator: string } | null {
    for (const [suffix, operator] of Object.entries(RANGE_SUFFIXES)) {
      if (key.endsWith(suffix)) {
        const fieldPath = key.slice(0, -suffix.length);
        if (fieldPath) {
          return { fieldPath, operator };
        }
      }
    }
    return null;
  }

  /**
   * Parse a value as numeric only (for range filters)
   */
  private static parseNumericValue(value: unknown): number | undefined {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') return this.tryParseNumber(value.trim());
    return undefined;
  }

  /**
   * Escape special regex characters to prevent ReDoS
   */
  private static escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  private static isStandardParam(key: string): boolean {
    return this.STANDARD_PARAMS.includes(
      key as (typeof this.STANDARD_PARAMS)[number],
    );
  }

  private static isPaginationParam(key: string): boolean {
    return this.PAGINATION_PARAMS.includes(
      key as (typeof this.PAGINATION_PARAMS)[number],
    );
  }

  /**
   * Validate field path to prevent MongoDB injection attacks
   */
  private static validateFieldPath(fieldPath: string): void {
    if (!fieldPath) {
      throw new EmptyFieldPathException();
    }

    const parts = fieldPath.split('.');

    for (const part of parts) {
      if (part.startsWith(this.MONGODB_OPERATOR_PREFIX)) {
        throw new InvalidFieldPathException(
          part,
          'MongoDB operators not allowed',
        );
      }

      if (!this.isSafeFieldName(part)) {
        throw new InvalidFieldPathException(
          part,
          'only alphanumeric and underscore allowed',
        );
      }
    }
  }

  private static isSafeFieldName(fieldName: string): boolean {
    return this.SAFE_FIELD_REGEX.test(fieldName);
  }

  /**
   * Parse string value to appropriate type
   */
  private static parseValue(value: unknown): ParsedValue {
    if (typeof value === 'number' || typeof value === 'boolean') {
      return value;
    }

    if (value === null || value === undefined) {
      return null;
    }

    if (typeof value === 'object') {
      return null;
    }

    if (typeof value !== 'string') {
      return null;
    }

    const str = value.trim();

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

    return str;
  }

  private static tryParseBoolean(str: string): boolean | undefined {
    if (str === this.BOOLEAN_TRUE) return true;
    if (str === this.BOOLEAN_FALSE) return false;
    return undefined;
  }

  private static tryParseNumber(str: string): number | undefined {
    if (str === '') return undefined;
    const num = Number(str);
    return !isNaN(num) ? num : undefined;
  }
}
