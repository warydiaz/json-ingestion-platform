import {
  IsEnum,
  IsString,
  IsOptional,
  IsObject,
  ValidateIf,
  IsNotEmpty,
} from 'class-validator';

export enum DataSourceType {
  S3 = 'S3',
  HTTP = 'HTTP',
  FILE = 'FILE',
}

export class IngestMessageDto {
  @IsString()
  @IsNotEmpty()
  datasetId!: string;

  @IsEnum(DataSourceType)
  sourceType!: DataSourceType;

  @IsOptional()
  @IsString()
  source?: string;

  // S3 fields - required only when sourceType is S3
  @ValidateIf((o: IngestMessageDto) => o.sourceType === DataSourceType.S3)
  @IsString()
  @IsNotEmpty()
  bucket?: string;

  @ValidateIf((o: IngestMessageDto) => o.sourceType === DataSourceType.S3)
  @IsString()
  @IsNotEmpty()
  key?: string;

  // HTTP fields - required only when sourceType is HTTP
  @ValidateIf((o: IngestMessageDto) => o.sourceType === DataSourceType.HTTP)
  @IsString()
  @IsNotEmpty()
  url?: string;

  @IsOptional()
  @IsObject()
  fieldMapping?: Record<string, string>;
}

// Discriminated union types for type-safe narrowing in use cases
interface BaseIngestMessage {
  readonly datasetId: string;
  readonly source?: string;
  readonly fieldMapping?: Record<string, string>;
}

export interface S3IngestMessage extends BaseIngestMessage {
  readonly sourceType: DataSourceType.S3;
  readonly bucket: string;
  readonly key: string;
}

export interface HttpIngestMessage extends BaseIngestMessage {
  readonly sourceType: DataSourceType.HTTP;
  readonly url: string;
}

export interface FileIngestMessage extends BaseIngestMessage {
  readonly sourceType: DataSourceType.FILE;
}

export type IngestMessage = S3IngestMessage | HttpIngestMessage | FileIngestMessage;

export function toIngestMessage(dto: IngestMessageDto): IngestMessage {
  switch (dto.sourceType) {
    case DataSourceType.HTTP: {
      if (!dto.url) {
        throw new Error('url is required for HTTP source');
      }
      return {
        datasetId: dto.datasetId,
        sourceType: DataSourceType.HTTP,
        url: dto.url,
        source: dto.source,
        fieldMapping: dto.fieldMapping,
      };
    }
    case DataSourceType.S3: {
      if (!dto.bucket || !dto.key) {
        throw new Error('bucket and key are required for S3 source');
      }
      return {
        datasetId: dto.datasetId,
        sourceType: DataSourceType.S3,
        bucket: dto.bucket,
        key: dto.key,
        source: dto.source,
        fieldMapping: dto.fieldMapping,
      };
    }
    case DataSourceType.FILE: {
      return {
        datasetId: dto.datasetId,
        sourceType: DataSourceType.FILE,
        source: dto.source,
        fieldMapping: dto.fieldMapping,
      };
    }
  }
}
