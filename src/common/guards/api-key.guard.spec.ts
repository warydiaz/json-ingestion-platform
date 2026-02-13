import { UnauthorizedException, type ExecutionContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiKeyGuard } from './api-key.guard';

function createMockContext(apiKey?: string): ExecutionContext {
  return {
    switchToHttp: jest.fn().mockReturnValue({
      getRequest: () => ({
        headers: apiKey ? { 'x-api-key': apiKey } : {},
      }),
    }),
    switchToRpc: jest.fn(),
    switchToWs: jest.fn(),
    getType: jest.fn().mockReturnValue('http'),
    getClass: jest.fn(),
    getHandler: jest.fn(),
    getArgs: jest.fn().mockReturnValue([]),
    getArgByIndex: jest.fn(),
  } as unknown as ExecutionContext;
}

describe('ApiKeyGuard', () => {
  let guard: ApiKeyGuard;
  let configService: ConfigService;

  beforeEach(() => {
    configService = {
      getOrThrow: jest.fn().mockReturnValue('test-secret-key'),
    } as unknown as ConfigService;
    guard = new ApiKeyGuard(configService);
  });

  it('should allow access with valid API key', () => {
    const context = createMockContext('test-secret-key');

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should throw UnauthorizedException with invalid API key', () => {
    const context = createMockContext('wrong-key');

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });

  it('should throw UnauthorizedException when API key is missing', () => {
    const context = createMockContext();

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });

  it('should throw when API_KEY env var is not configured', () => {
    (configService.getOrThrow as jest.Mock).mockImplementation(() => {
      throw new Error('API_KEY is not defined');
    });
    const context = createMockContext('some-key');

    expect(() => guard.canActivate(context)).toThrow();
  });
});
