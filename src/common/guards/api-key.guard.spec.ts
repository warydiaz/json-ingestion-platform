import { UnauthorizedException } from '@nestjs/common';
import { ApiKeyGuard } from './api-key.guard';

describe('ApiKeyGuard', () => {
  let guard: ApiKeyGuard;
  const originalEnv = process.env;

  beforeEach(() => {
    guard = new ApiKeyGuard();
    process.env = { ...originalEnv, API_KEY: 'test-secret-key' };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  function createMockContext(apiKey?: string) {
    return {
      switchToHttp: () => ({
        getRequest: () => ({
          headers: apiKey ? { 'x-api-key': apiKey } : {},
        }),
      }),
    };
  }

  it('should allow access with valid API key', () => {
    const context = createMockContext('test-secret-key');

    expect(guard.canActivate(context as never)).toBe(true);
  });

  it('should throw UnauthorizedException with invalid API key', () => {
    const context = createMockContext('wrong-key');

    expect(() => guard.canActivate(context as never)).toThrow(
      UnauthorizedException,
    );
  });

  it('should throw UnauthorizedException when API key is missing', () => {
    const context = createMockContext();

    expect(() => guard.canActivate(context as never)).toThrow(
      UnauthorizedException,
    );
  });

  it('should throw UnauthorizedException when API_KEY env var is not set', () => {
    delete process.env.API_KEY;
    const context = createMockContext('some-key');

    expect(() => guard.canActivate(context as never)).toThrow(
      UnauthorizedException,
    );
  });
});
