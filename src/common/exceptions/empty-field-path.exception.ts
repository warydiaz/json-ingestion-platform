import { BadRequestException } from '@nestjs/common';

/**
 * Exception thrown when a payload field path is empty
 */
export class EmptyFieldPathException extends BadRequestException {
  constructor() {
    super('Payload field path cannot be empty');
    this.name = 'EmptyFieldPathException';
  }
}
