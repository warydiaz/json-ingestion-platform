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
  datasetId: string;

  @IsEnum(DataSourceType)
  sourceType: DataSourceType;

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
