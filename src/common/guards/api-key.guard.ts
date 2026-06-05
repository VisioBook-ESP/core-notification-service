import {
  Injectable,
  CanActivate,
  ExecutionContext,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  private readonly logger = new Logger(ApiKeyGuard.name);
  private readonly validApiKeys = (process.env.VALID_API_KEYS || '').split(',').filter(Boolean);

  canActivate(context: ExecutionContext): boolean {
    // Skip API key check if no keys are configured
    if (this.validApiKeys.length === 0) {
      this.logger.warn('⚠️  No API keys configured - skipping API key validation');
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const apiKey = this.extractApiKey(request);

    if (!apiKey) {
      this.logger.warn('🔒 No API key provided');
      throw new UnauthorizedException('API key required');
    }

    if (!this.validApiKeys.includes(apiKey)) {
      this.logger.warn('🔒 Invalid API key provided');
      throw new UnauthorizedException('Invalid API key');
    }

    this.logger.log(`✓ API key validated`);
    request.apiKey = apiKey;

    return true;
  }

  private extractApiKey(request: any): string | null {
    // Check X-API-Key header
    const apiKey = request.headers['x-api-key'];

    if (apiKey) {
      return apiKey;
    }

    // Check query parameter (fallback)
    return request.query['apiKey'] || null;
  }
}
