/**
 * Type-safe payload representation for ingested records
 * Replaces Record<string, any> with recursive type-safe structure
 */
export interface RecordPayload {
  [key: string]:
    | string
    | number
    | boolean
    | null
    | RecordPayload
    | RecordPayload[];
}
