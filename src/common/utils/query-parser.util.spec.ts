import { QueryParserUtil } from './query-parser.util';
import { InvalidFieldPathException } from '../../common/exceptions';

describe('QueryParserUtil', () => {
  describe('parseQuery', () => {
    it('should parse standard filters (source, datasetId)', () => {
      const query = {
        source: 'source-1',
        datasetId: 'dataset-123',
      };

      const result = QueryParserUtil.parseQuery(query);

      expect(result.standardFilters).toEqual({
        source: 'source-1',
        datasetId: 'dataset-123',
      });
      expect(result.payloadFilters).toEqual({});
    });

    it('should parse payload filters with type coercion', () => {
      const query = {
        age: '25',
        active: 'true',
        name: 'John',
      };

      const result = QueryParserUtil.parseQuery(query);

      expect(result.standardFilters).toEqual({});
      expect(result.payloadFilters).toEqual({
        'payload.age': 25,
        'payload.active': true,
        'payload.name': { $regex: 'John', $options: 'i' },
      });
    });

    it('should combine standard and payload filters', () => {
      const query = {
        source: 'source-1',
        age: '30',
        city: 'Barcelona',
      };

      const result = QueryParserUtil.parseQuery(query);

      expect(result.standardFilters).toEqual({ source: 'source-1' });
      expect(result.payloadFilters).toEqual({
        'payload.age': 30,
        'payload.city': { $regex: 'Barcelona', $options: 'i' },
      });
    });

    it('should skip pagination params (limit, cursor)', () => {
      const query = {
        source: 'source-1',
        limit: 20,
        cursor: 'abc123',
        age: '25',
      };

      const result = QueryParserUtil.parseQuery(query);

      expect(result.standardFilters).toEqual({ source: 'source-1' });
      expect(result.payloadFilters).toEqual({ 'payload.age': 25 });
      expect(result.standardFilters).not.toHaveProperty('limit');
      expect(result.standardFilters).not.toHaveProperty('cursor');
    });

    it('should parse boolean values correctly', () => {
      const query = {
        active: 'true',
        deleted: 'false',
      };

      const result = QueryParserUtil.parseQuery(query);

      expect(result.payloadFilters).toEqual({
        'payload.active': true,
        'payload.deleted': false,
      });
    });

    it('should parse null value correctly', () => {
      const query = { deletedAt: 'null' };

      const result = QueryParserUtil.parseQuery(query);

      expect(result.payloadFilters).toEqual({
        'payload.deletedAt': null,
      });
    });

    it('should parse numbers correctly (exact match)', () => {
      const query = {
        age: '25',
        price: '19.99',
        count: '0',
      };

      const result = QueryParserUtil.parseQuery(query);

      expect(result.payloadFilters).toEqual({
        'payload.age': 25,
        'payload.price': 19.99,
        'payload.count': 0,
      });
    });
  });

  describe('partial text search', () => {
    it('should use case-insensitive regex for string values', () => {
      const query = { city: 'Ly' };

      const result = QueryParserUtil.parseQuery(query);

      expect(result.payloadFilters).toEqual({
        'payload.city': { $regex: 'Ly', $options: 'i' },
      });
    });

    it('should escape special regex characters', () => {
      const query = { name: 'John (Jr.)' };

      const result = QueryParserUtil.parseQuery(query);

      expect(result.payloadFilters).toEqual({
        'payload.name': { $regex: 'John \\(Jr\\.\\)', $options: 'i' },
      });
    });

    it('should use regex for non-parseable strings', () => {
      const query = {
        name: 'John Doe',
        email: 'john@example.com',
      };

      const result = QueryParserUtil.parseQuery(query);

      expect(result.payloadFilters['payload.name']).toEqual({
        $regex: 'John Doe',
        $options: 'i',
      });
    });
  });

  describe('numeric range filters', () => {
    it('should parse _min suffix as $gte', () => {
      const query = { price_min: '100' };

      const result = QueryParserUtil.parseQuery(query);

      expect(result.payloadFilters).toEqual({
        'payload.price': { $gte: 100 },
      });
    });

    it('should parse _max suffix as $lte', () => {
      const query = { price_max: '500' };

      const result = QueryParserUtil.parseQuery(query);

      expect(result.payloadFilters).toEqual({
        'payload.price': { $lte: 500 },
      });
    });

    it('should parse _gt suffix as $gt', () => {
      const query = { age_gt: '18' };

      const result = QueryParserUtil.parseQuery(query);

      expect(result.payloadFilters).toEqual({
        'payload.age': { $gt: 18 },
      });
    });

    it('should parse _lt suffix as $lt', () => {
      const query = { age_lt: '65' };

      const result = QueryParserUtil.parseQuery(query);

      expect(result.payloadFilters).toEqual({
        'payload.age': { $lt: 65 },
      });
    });

    it('should combine _min and _max on the same field', () => {
      const query = { price_min: '100', price_max: '500' };

      const result = QueryParserUtil.parseQuery(query);

      expect(result.payloadFilters).toEqual({
        'payload.price': { $gte: 100, $lte: 500 },
      });
    });

    it('should combine _gt and _lt on the same field', () => {
      const query = { age_gt: '18', age_lt: '65' };

      const result = QueryParserUtil.parseQuery(query);

      expect(result.payloadFilters).toEqual({
        'payload.age': { $gt: 18, $lt: 65 },
      });
    });

    it('should ignore range filters with non-numeric values', () => {
      const query = { price_min: 'abc' };

      const result = QueryParserUtil.parseQuery(query);

      expect(result.payloadFilters).toEqual({});
    });

    it('should handle decimal range values', () => {
      const query = { price_min: '19.99', price_max: '99.99' };

      const result = QueryParserUtil.parseQuery(query);

      expect(result.payloadFilters).toEqual({
        'payload.price': { $gte: 19.99, $lte: 99.99 },
      });
    });
  });

  describe('combined filters', () => {
    it('should handle exact, partial text, and range filters together', () => {
      const query = {
        source: 'source-1',
        available: 'true',
        city: 'Ly',
        price_min: '100',
        price_max: '500',
      };

      const result = QueryParserUtil.parseQuery(query);

      expect(result.standardFilters).toEqual({ source: 'source-1' });
      expect(result.payloadFilters).toEqual({
        'payload.available': true,
        'payload.city': { $regex: 'Ly', $options: 'i' },
        'payload.price': { $gte: 100, $lte: 500 },
      });
    });
  });

  describe('security - MongoDB injection prevention', () => {
    it('should reject MongoDB operators in field path', () => {
      const query = { $where: 'malicious code' };

      expect(() => QueryParserUtil.parseQuery(query)).toThrow(
        InvalidFieldPathException,
      );
      expect(() => QueryParserUtil.parseQuery(query)).toThrow(
        /MongoDB operators not allowed/,
      );
    });

    it('should reject unsafe characters in field path', () => {
      const query = { 'field@special': 'value' };

      expect(() => QueryParserUtil.parseQuery(query)).toThrow(
        InvalidFieldPathException,
      );
      expect(() => QueryParserUtil.parseQuery(query)).toThrow(
        /only alphanumeric and underscore allowed/,
      );
    });

    it('should allow safe field names with underscores', () => {
      const query = { user_id: '123' };

      const result = QueryParserUtil.parseQuery(query);

      expect(result.payloadFilters).toEqual({
        'payload.user_id': 123,
      });
    });
  });

  describe('input validation', () => {
    it('should throw error for null query', () => {
      expect(() => QueryParserUtil.parseQuery(null as any)).toThrow(
        'Query must be a valid object',
      );
    });

    it('should throw error for undefined query', () => {
      expect(() => QueryParserUtil.parseQuery(undefined as any)).toThrow(
        'Query must be a valid object',
      );
    });

    it('should throw error for non-object query', () => {
      expect(() => QueryParserUtil.parseQuery('invalid' as any)).toThrow(
        'Query must be a valid object',
      );
    });

    it('should handle empty query object', () => {
      const result = QueryParserUtil.parseQuery({});

      expect(result.standardFilters).toEqual({});
      expect(result.payloadFilters).toEqual({});
    });

    it('should skip undefined values from class-transformer DTO instances', () => {
      const query = {
        source: undefined,
        datasetId: undefined,
        age: '25',
      };

      const result = QueryParserUtil.parseQuery(query);

      expect(result.standardFilters).toEqual({});
      expect(result.payloadFilters).toEqual({ 'payload.age': 25 });
    });
  });

  describe('value type parsing edge cases', () => {
    it('should parse zero as number, not falsy', () => {
      const query = { count: '0' };
      const result = QueryParserUtil.parseQuery(query);

      expect(result.payloadFilters['payload.count']).toBe(0);
    });

    it('should parse negative numbers correctly', () => {
      const query = { temperature: '-15.5', balance: '-100' };

      const result = QueryParserUtil.parseQuery(query);

      expect(result.payloadFilters['payload.temperature']).toBe(-15.5);
      expect(result.payloadFilters['payload.balance']).toBe(-100);
    });

    it('should handle already-parsed boolean values', () => {
      const query = { active: true, deleted: false };

      const result = QueryParserUtil.parseQuery(query);

      expect(result.payloadFilters['payload.active']).toBe(true);
      expect(result.payloadFilters['payload.deleted']).toBe(false);
    });

    it('should handle already-parsed number values', () => {
      const query = { age: 25, price: 19.99 };

      const result = QueryParserUtil.parseQuery(query);

      expect(result.payloadFilters['payload.age']).toBe(25);
      expect(result.payloadFilters['payload.price']).toBe(19.99);
    });
  });

  describe('additional security tests', () => {
    it('should reject multiple MongoDB operators', () => {
      const maliciousQueries = [
        { $ne: 'value' },
        { $gt: '10' },
        { $lt: '5' },
        { $regex: '.*' },
        { $or: 'array' },
      ];

      maliciousQueries.forEach((query) => {
        expect(() => QueryParserUtil.parseQuery(query)).toThrow(
          InvalidFieldPathException,
        );
      });
    });

    it('should reject special characters in field names', () => {
      const maliciousQueries = [
        { 'field!name': 'value' },
        { 'field#name': 'value' },
        { 'field%name': 'value' },
        { 'field&name': 'value' },
        { 'field*name': 'value' },
      ];

      maliciousQueries.forEach((query) => {
        expect(() => QueryParserUtil.parseQuery(query)).toThrow(
          InvalidFieldPathException,
        );
      });
    });

    it('should allow numbers in field names', () => {
      const query = { field123: 'value' };

      const result = QueryParserUtil.parseQuery(query);

      expect(result.payloadFilters).toEqual({
        'payload.field123': { $regex: 'value', $options: 'i' },
      });
    });
  });
});
