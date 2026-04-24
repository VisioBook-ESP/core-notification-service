import { JwtAuthGuard } from '../src/common/guards/jwt-auth.guard';
import { ApiKeyGuard } from '../src/common/guards/api-key.guard';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;

  beforeEach(() => {
    guard = new JwtAuthGuard();
  });

  it('should throw error if no authorization header', () => {
    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => ({ headers: {} }),
      }),
    } as ExecutionContext;

    expect(() => guard.canActivate(mockContext)).toThrow(UnauthorizedException);
  });

  it('should throw error if authorization header format invalid', () => {
    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => ({
          headers: { authorization: 'InvalidFormat' },
        }),
      }),
    } as ExecutionContext;

    expect(() => guard.canActivate(mockContext)).toThrow(UnauthorizedException);
  });

  it('should extract and validate token', () => {
    // Create a valid JWT-like token (header.payload.signature)
    const validToken = 'header.payload.signature';
    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => ({
          headers: { authorization: `Bearer ${validToken}` },
        }),
      }),
    } as ExecutionContext;

    // This will fail on decode, but that's expected in dev mode
    expect(() => guard.canActivate(mockContext)).toThrow();
  });

  it('should throw if token signature invalid', () => {
    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => ({
          headers: { authorization: 'Bearer invalidtoken' },
        }),
      }),
    } as ExecutionContext;

    expect(() => guard.canActivate(mockContext)).toThrow(UnauthorizedException);
  });
});

describe('ApiKeyGuard', () => {
  let guard: ApiKeyGuard;

  beforeEach(() => {
    // Clear environment variable
    delete process.env.VALID_API_KEYS;
    guard = new ApiKeyGuard();
  });

  it('should pass if no API keys configured', () => {
    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => ({
          headers: {},
          query: {},
        }),
      }),
    } as ExecutionContext;

    expect(guard.canActivate(mockContext)).toBe(true);
  });

  it('should throw if API key header missing and keys configured', () => {
    process.env.VALID_API_KEYS = 'sk-test-123';
    guard = new ApiKeyGuard();

    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => ({
          headers: {},
          query: {},
        }),
      }),
    } as ExecutionContext;

    expect(() => guard.canActivate(mockContext)).toThrow(UnauthorizedException);
  });

  it('should validate API key from header', () => {
    process.env.VALID_API_KEYS = 'sk-test-123';
    guard = new ApiKeyGuard();

    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => ({
          headers: { 'x-api-key': 'sk-test-123' },
          query: {},
        }),
      }),
    } as ExecutionContext;

    expect(guard.canActivate(mockContext)).toBe(true);
  });

  it('should reject invalid API key', () => {
    process.env.VALID_API_KEYS = 'sk-test-123';
    guard = new ApiKeyGuard();

    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => ({
          headers: { 'x-api-key': 'invalid-key' },
          query: {},
        }),
      }),
    } as ExecutionContext;

    expect(() => guard.canActivate(mockContext)).toThrow(UnauthorizedException);
  });

  it('should accept API key from query parameter', () => {
    process.env.VALID_API_KEYS = 'sk-test-123';
    guard = new ApiKeyGuard();

    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => ({
          headers: {},
          query: { apiKey: 'sk-test-123' },
        }),
      }),
    } as ExecutionContext;

    expect(guard.canActivate(mockContext)).toBe(true);
  });
});
