import { InternalServerErrorException } from '@nestjs/common';

/**
 * Exception thrown when configuration file cannot be loaded
 * Used to replace generic Error with specific NestJS exception
 */
export class ConfigLoadingException extends InternalServerErrorException {
  constructor(filePath: string, originalError: Error) {
    super(
      `Failed to load configuration from "${filePath}": ${originalError.message}`,
    );
    this.name = 'ConfigLoadingException';
  }
}
