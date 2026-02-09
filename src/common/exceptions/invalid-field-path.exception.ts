import { BadRequestException } from '@nestjs/common';

/**
 * Exception thrown when a field path is invalid or contains unsafe characters
 * Used to prevent MongoDB injection attacks
 */
export class InvalidFieldPathException extends BadRequestException {
  constructor(fieldPath: string, reason: string) {
    super(`Invalid field path "${fieldPath}": ${reason}`);
    this.name = 'InvalidFieldPathException';
  }
}
