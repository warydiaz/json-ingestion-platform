import { QueryParserUtil } from './query-parser.util';
import {
  InvalidFieldPathException,
  EmptyFieldPathException,
} from '../../common/exceptions';

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
        'payload.age': '25',
        'payload.active': 'true',
        'payload.name': 'John',
      };

      const result = QueryParserUtil.parseQuery(query);

      expect(result.standardFilters).toEqual({});
      expect(result.payloadFilters).toEqual({
        'payload.age': 25, // Number
        'payload.active': true, // Boolean
        'payload.name': 'John', // String
      });
    });

    it('should parse nested payload fields', () => {
      const query = {
        'payload.address.city': 'Madrid',
        'payload.address.zipCode': '28001',
      };

      const result = QueryParserUtil.parseQuery(query);

      expect(result.payloadFilters).toEqual({
        'payload.address.city': 'Madrid',
        'payload.address.zipCode': 28001,
      });
    });

    it('should combine standard and payload filters', () => {
      const query = {
        source: 'source-1',
        'payload.age': '30',
        'payload.city': 'Barcelona',
      };

      const result = QueryParserUtil.parseQuery(query);

      expect(result.standardFilters).toEqual({ source: 'source-1' });
      expect(result.payloadFilters).toEqual({
        'payload.age': 30,
        'payload.city': 'Barcelona',
      });
    });

    it('should skip pagination params (limit, cursor)', () => {
      const query = {
        source: 'source-1',
        limit: 20,
        cursor: 'abc123',
        'payload.age': '25',
      };

      const result = QueryParserUtil.parseQuery(query);

      expect(result.standardFilters).toEqual({ source: 'source-1' });
      expect(result.payloadFilters).toEqual({ 'payload.age': 25 });
      expect(result.standardFilters).not.toHaveProperty('limit');
      expect(result.standardFilters).not.toHaveProperty('cursor');
    });

    it('should parse boolean values correctly', () => {
      const query = {
        'payload.active': 'true',
        'payload.deleted': 'false',
      };

      const result = QueryParserUtil.parseQuery(query);

      expect(result.payloadFilters).toEqual({
        'payload.active': true,
        'payload.deleted': false,
      });
    });

    it('should parse null value correctly', () => {
      const query = {
        'payload.deletedAt': 'null',
      };

      const result = QueryParserUtil.parseQuery(query);

      expect(result.payloadFilters).toEqual({
        'payload.deletedAt': null,
      });
    });

    it('should parse numbers correctly', () => {
      const query = {
        'payload.age': '25',
        'payload.price': '19.99',
        'payload.count': '0',
      };

      const result = QueryParserUtil.parseQuery(query);

      expect(result.payloadFilters).toEqual({
        'payload.age': 25,
        'payload.price': 19.99,
        'payload.count': 0,
      });
    });

    it('should keep strings as strings when not parseable', () => {
      const query = {
        'payload.name': 'John Doe',
        'payload.email': 'john@example.com',
      };

      const result = QueryParserUtil.parseQuery(query);

      expect(result.payloadFilters).toEqual({
        'payload.name': 'John Doe',
        'payload.email': 'john@example.com',
      });
    });
  });

  describe('security - MongoDB injection prevention', () => {
    it('should reject MongoDB operators in field path', () => {
      const query = {
        'payload.$where': 'malicious code',
      };

      expect(() => QueryParserUtil.parseQuery(query)).toThrow(
        InvalidFieldPathException,
      );
      expect(() => QueryParserUtil.parseQuery(query)).toThrow(
        /MongoDB operators not allowed/,
      );
    });

    it('should reject $ in nested field path', () => {
      const query = {
        'payload.user.$gt': '10',
      };

      expect(() => QueryParserUtil.parseQuery(query)).toThrow(
        InvalidFieldPathException,
      );
      expect(() => QueryParserUtil.parseQuery(query)).toThrow(/\$gt/);
    });

    it('should reject unsafe characters in field path', () => {
      const query = {
        'payload.field@special': 'value',
      };

      expect(() => QueryParserUtil.parseQuery(query)).toThrow(
        InvalidFieldPathException,
      );
      expect(() => QueryParserUtil.parseQuery(query)).toThrow(
        /only alphanumeric and underscore allowed/,
      );
    });

    it('should reject empty field path', () => {
      const query = {
        'payload.': 'value',
      };

      expect(() => QueryParserUtil.parseQuery(query)).toThrow(
        EmptyFieldPathException,
      );
    });

    it('should allow safe field names with underscores', () => {
      const query = {
        'payload.user_id': '123',
        'payload.created_at': '2024-01-01',
      };

      const result = QueryParserUtil.parseQuery(query);

      expect(result.payloadFilters).toEqual({
        'payload.user_id': 123,
        'payload.created_at': '2024-01-01',
      });
    });

    it('should allow nested fields with dots', () => {
      const query = {
        'payload.user.profile.name': 'John',
      };

      const result = QueryParserUtil.parseQuery(query);

      expect(result.payloadFilters).toEqual({
        'payload.user.profile.name': 'John',
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
        'payload.age': '25',
      };

      const result = QueryParserUtil.parseQuery(query);

      expect(result.standardFilters).toEqual({});
      expect(result.payloadFilters).toEqual({ 'payload.age': 25 });
    });
  });

  describe('value type parsing edge cases', () => {
    it('should parse zero as number, not falsy', () => {
      const query = { 'payload.count': '0' };
      const result = QueryParserUtil.parseQuery(query);

      expect(result.payloadFilters['payload.count']).toBe(0);
      expect(typeof result.payloadFilters['payload.count']).toBe('number');
    });

    it('should parse negative numbers correctly', () => {
      const query = {
        'payload.temperature': '-15.5',
        'payload.balance': '-100',
      };

      const result = QueryParserUtil.parseQuery(query);

      expect(result.payloadFilters['payload.temperature']).toBe(-15.5);
      expect(result.payloadFilters['payload.balance']).toBe(-100);
    });

    it('should handle string with spaces correctly', () => {
      const query = {
        'payload.name': '  John Doe  ',
      };

      const result = QueryParserUtil.parseQuery(query);

      expect(result.payloadFilters['payload.name']).toBe('John Doe');
    });

    it('should parse scientific notation as numbers', () => {
      const query = {
        'payload.value': '1e5',
        'payload.small': '1.5e-3',
      };

      const result = QueryParserUtil.parseQuery(query);

      expect(result.payloadFilters['payload.value']).toBe(100000);
      expect(result.payloadFilters['payload.small']).toBe(0.0015);
    });

    it('should keep string that looks like number but has text', () => {
      const query = {
        'payload.code': '123abc',
        'payload.reference': 'ref-456',
      };

      const result = QueryParserUtil.parseQuery(query);

      expect(result.payloadFilters['payload.code']).toBe('123abc');
      expect(result.payloadFilters['payload.reference']).toBe('ref-456');
    });

    it('should handle already-parsed boolean values', () => {
      const query = {
        'payload.active': true,
        'payload.deleted': false,
      };

      const result = QueryParserUtil.parseQuery(query);

      expect(result.payloadFilters['payload.active']).toBe(true);
      expect(result.payloadFilters['payload.deleted']).toBe(false);
    });

    it('should handle already-parsed number values', () => {
      const query = {
        'payload.age': 25,
        'payload.price': 19.99,
      };

      const result = QueryParserUtil.parseQuery(query);

      expect(result.payloadFilters['payload.age']).toBe(25);
      expect(result.payloadFilters['payload.price']).toBe(19.99);
    });
  });

  describe('additional security tests', () => {
    it('should reject multiple MongoDB operators', () => {
      const maliciousQueries = [
        { 'payload.$ne': 'value' },
        { 'payload.$gt': '10' },
        { 'payload.$lt': '5' },
        { 'payload.$regex': '.*' },
        { 'payload.$or': 'array' },
      ];

      maliciousQueries.forEach((query) => {
        expect(() => QueryParserUtil.parseQuery(query)).toThrow(
          InvalidFieldPathException,
        );
      });
    });

    it('should reject special characters in field names', () => {
      const maliciousQueries = [
        { 'payload.field!name': 'value' },
        { 'payload.field#name': 'value' },
        { 'payload.field%name': 'value' },
        { 'payload.field&name': 'value' },
        { 'payload.field*name': 'value' },
      ];

      maliciousQueries.forEach((query) => {
        expect(() => QueryParserUtil.parseQuery(query)).toThrow(
          InvalidFieldPathException,
        );
      });
    });

    it('should allow numbers in field names', () => {
      const query = {
        'payload.field123': 'value',
        'payload.user2_name': 'John',
      };

      const result = QueryParserUtil.parseQuery(query);

      expect(result.payloadFilters).toEqual({
        'payload.field123': 'value',
        'payload.user2_name': 'John',
      });
    });
  });
});
