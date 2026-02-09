import { BadRequestException } from '@nestjs/common';

/**
 * Exception thrown when a required field is missing
 * Used to replace generic Error with specific NestJS exception
 */
export class MissingRequiredFieldException extends BadRequestException {
  constructor(fieldName: string, context?: string) {
    const message = context
      ? `Required field "${fieldName}" is missing in ${context}`
      : `Required field "${fieldName}" is missing`;
    super(message);
    this.name = 'MissingRequiredFieldException';
  }
}
