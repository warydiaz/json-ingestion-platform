import { CallHandler, ExecutionContext } from '@nestjs/common';
import { of } from 'rxjs';
import { LoggingInterceptor } from './logging.interceptor';

describe('LoggingInterceptor', () => {
  let interceptor: LoggingInterceptor;

  beforeEach(() => {
    interceptor = new LoggingInterceptor();
  });

  function createMockContext(method: string, url: string): ExecutionContext {
    return {
      switchToHttp: () => ({
        getRequest: () => ({ method, url }),
        getResponse: () => ({}),
        getNext: () => jest.fn(),
      }),
      getClass: () => Object,
      getHandler: () => jest.fn(),
      getArgs: () => [],
      getArgByIndex: () => ({}),
      switchToRpc: jest.fn(),
      switchToWs: jest.fn(),
      getType: () => 'http',
    } as unknown as ExecutionContext;
  }

  function createMockHandler(response: unknown = {}): CallHandler {
    return {
      handle: () => of(response),
    };
  }

  it('should return the response from the handler', (done) => {
    const context = createMockContext('GET', '/records');
    const handler = createMockHandler({ data: [] });

    interceptor.intercept(context, handler).subscribe({
      next: (value) => {
        expect(value).toEqual({ data: [] });
      },
      complete: () => done(),
    });
  });

  it('should pass through the observable chain', (done) => {
    const context = createMockContext('POST', '/admin/trigger-ingestion');
    const handler = createMockHandler({ message: 'ok' });

    const result = interceptor.intercept(context, handler);

    result.subscribe({
      next: (value) => {
        expect(value).toEqual({ message: 'ok' });
      },
      complete: () => done(),
    });
  });
});
