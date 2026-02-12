import { HttpException, HttpStatus, BadRequestException } from '@nestjs/common';
import { HttpExceptionFilter } from './http-exception.filter';

describe('HttpExceptionFilter', () => {
  let filter: HttpExceptionFilter;
  let mockResponse: { status: jest.Mock; json: jest.Mock };
  let mockHost: { switchToHttp: jest.Mock };

  beforeEach(() => {
    filter = new HttpExceptionFilter();
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockHost = {
      switchToHttp: jest.fn().mockReturnValue({
        getResponse: () => mockResponse,
      }),
    };
  });

  it('should return status from HttpException', () => {
    const exception = new BadRequestException('Invalid input');

    filter.catch(exception, mockHost as never);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
  });

  it('should return 500 for non-HttpException errors', () => {
    const exception = new Error('Unexpected error');

    filter.catch(exception, mockHost as never);

    expect(mockResponse.status).toHaveBeenCalledWith(
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  });

  it('should include statusCode, message, and timestamp in response', () => {
    const exception = new BadRequestException('Bad input');

    filter.catch(exception, mockHost as never);

    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 400,
        message: 'Bad input',
        timestamp: expect.any(String),
      }),
    );
  });

  it('should use "Internal server error" message for non-HttpException', () => {
    const exception: unknown = new Error('DB connection lost');

    filter.catch(exception, mockHost as never);

    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 500,
        message: 'Internal server error',
      }),
    );
  });

  it('should handle HttpException with custom status', () => {
    const exception = new HttpException('Not Found', HttpStatus.NOT_FOUND);

    filter.catch(exception, mockHost as never);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 404,
        message: 'Not Found',
      }),
    );
  });
});
