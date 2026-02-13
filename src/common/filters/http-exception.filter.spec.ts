import {
  HttpException,
  HttpStatus,
  BadRequestException,
  type ArgumentsHost,
} from '@nestjs/common';
import { HttpExceptionFilter } from './http-exception.filter';

function createMockHost(mockResponse: {
  status: jest.Mock;
  json: jest.Mock;
}): ArgumentsHost {
  return {
    switchToHttp: jest.fn().mockReturnValue({
      getResponse: () => mockResponse,
    }),
    switchToRpc: jest.fn(),
    switchToWs: jest.fn(),
    getType: jest.fn().mockReturnValue('http'),
    getArgs: jest.fn().mockReturnValue([]),
    getArgByIndex: jest.fn(),
  } as unknown as ArgumentsHost;
}

describe('HttpExceptionFilter', () => {
  let filter: HttpExceptionFilter;
  let mockResponse: { status: jest.Mock; json: jest.Mock };
  let mockHost: ArgumentsHost;

  beforeEach(() => {
    filter = new HttpExceptionFilter();
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockHost = createMockHost(mockResponse);
  });

  it('should return status from HttpException', () => {
    const exception = new BadRequestException('Invalid input');

    filter.catch(exception, mockHost);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
  });

  it('should return 500 for non-HttpException errors', () => {
    const exception = new Error('Unexpected error');

    filter.catch(exception, mockHost);

    expect(mockResponse.status).toHaveBeenCalledWith(
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  });

  it('should include statusCode, message, and timestamp in response', () => {
    const exception = new BadRequestException('Bad input');

    filter.catch(exception, mockHost);

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

    filter.catch(exception, mockHost);

    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 500,
        message: 'Internal server error',
      }),
    );
  });

  it('should handle HttpException with custom status', () => {
    const exception = new HttpException('Not Found', HttpStatus.NOT_FOUND);

    filter.catch(exception, mockHost);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 404,
        message: 'Not Found',
      }),
    );
  });
});
