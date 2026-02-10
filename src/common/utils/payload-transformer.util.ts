import type { JsonObject, JsonValue } from './data-stream.types';

export type FieldMapping = Record<string, string>;

export class PayloadTransformerUtil {
  /**
   * Transform a raw item using a field mapping.
   * Maps source fields to normalized field names.
   *
   * @param item - Raw JSON object from the data source
   * @param fieldMapping - Map of normalizedField → sourceField (supports dot notation)
   * @returns Transformed object with normalized field names
   *
   * @example
   * Input:  { address: { city: "Lyon" }, isAvailable: true }
   * Mapping: { city: "address.city", available: "isAvailable" }
   * Output: { city: "Lyon", available: true }
   */
  static transform(item: JsonObject, fieldMapping: FieldMapping): JsonObject {
    const result: JsonObject = {};

    for (const [normalizedKey, sourceKey] of Object.entries(fieldMapping)) {
      const value = this.getNestedValue(item, sourceKey);
      if (value !== undefined) {
        result[normalizedKey] = value;
      }
    }

    return result;
  }

  /**
   * Get a value from a nested object using dot notation.
   * e.g. getNestedValue({ address: { city: "Lyon" } }, "address.city") → "Lyon"
   */
  private static getNestedValue(
    obj: JsonObject,
    path: string,
  ): JsonValue | undefined {
    const parts = path.split('.');
    let current: unknown = obj;

    for (const part of parts) {
      if (current === null || current === undefined || typeof current !== 'object') {
        return undefined;
      }
      current = (current as JsonObject)[part];
    }

    return current as JsonValue;
  }
}
