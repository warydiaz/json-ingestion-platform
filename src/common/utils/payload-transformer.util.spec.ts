import { PayloadTransformerUtil } from './payload-transformer.util';

describe('PayloadTransformerUtil', () => {
  describe('transform', () => {
    it('should map flat fields', () => {
      const item = { city: 'Madrid', availability: true, pricePerNight: 200 };
      const mapping = {
        city: 'city',
        available: 'availability',
        price: 'pricePerNight',
      };

      const result = PayloadTransformerUtil.transform(item, mapping);

      expect(result).toEqual({
        city: 'Madrid',
        available: true,
        price: 200,
      });
    });

    it('should map nested source fields using dot notation', () => {
      const item = {
        address: { country: 'France', city: 'Lyon' },
        isAvailable: true,
        priceForNight: 270,
      };
      const mapping = {
        city: 'address.city',
        country: 'address.country',
        available: 'isAvailable',
        price: 'priceForNight',
      };

      const result = PayloadTransformerUtil.transform(item, mapping);

      expect(result).toEqual({
        city: 'Lyon',
        country: 'France',
        available: true,
        price: 270,
      });
    });

    it('should skip fields that do not exist in the source', () => {
      const item = { name: 'Test' };
      const mapping = {
        name: 'name',
        city: 'address.city',
      };

      const result = PayloadTransformerUtil.transform(item, mapping);

      expect(result).toEqual({ name: 'Test' });
    });

    it('should handle empty mapping', () => {
      const item = { city: 'Madrid', price: 100 };
      const mapping = {};

      const result = PayloadTransformerUtil.transform(item, mapping);

      expect(result).toEqual({});
    });

    it('should handle deeply nested source fields', () => {
      const item = {
        data: { location: { address: { city: 'Tokyo' } } },
      };
      const mapping = {
        city: 'data.location.address.city',
      };

      const result = PayloadTransformerUtil.transform(item, mapping);

      expect(result).toEqual({ city: 'Tokyo' });
    });

    it('should preserve null values from source', () => {
      const item = { name: null, price: 0 };
      const mapping = {
        name: 'name',
        price: 'price',
      };

      const result = PayloadTransformerUtil.transform(item, mapping);

      expect(result).toEqual({ name: null, price: 0 });
    });

    it('should normalize both source structures to the same output', () => {
      const source1Item = {
        address: { city: 'Lyon' },
        isAvailable: true,
        priceForNight: 270,
      };
      const source1Mapping = {
        city: 'address.city',
        available: 'isAvailable',
        price: 'priceForNight',
      };

      const source2Item = {
        city: 'Lyon',
        availability: true,
        pricePerNight: 270,
      };
      const source2Mapping = {
        city: 'city',
        available: 'availability',
        price: 'pricePerNight',
      };

      const result1 = PayloadTransformerUtil.transform(
        source1Item,
        source1Mapping,
      );
      const result2 = PayloadTransformerUtil.transform(
        source2Item,
        source2Mapping,
      );

      expect(result1).toEqual(result2);
      expect(result1).toEqual({
        city: 'Lyon',
        available: true,
        price: 270,
      });
    });
  });
});
