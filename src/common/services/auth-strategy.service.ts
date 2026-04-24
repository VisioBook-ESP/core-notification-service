import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class AuthStrategyService {
  private readonly logger = new Logger(AuthStrategyService.name);

  /**
   * Get authentication strategy based on request headers
   */
  getAuthStrategy(request: any): 'jwt' | 'apiKey' | 'none' {
    const hasJwt = !!request.headers.authorization?.startsWith('Bearer ');
    const hasApiKey = !!request.headers['x-api-key'];

    if (hasJwt) {
      return 'jwt';
    }

    if (hasApiKey) {
      return 'apiKey';
    }

    return 'none';
  }

  /**
   * Get requester identifier based on auth strategy
   */
  getRequesterIdentifier(request: any): string {
    const strategy = this.getAuthStrategy(request);

    if (strategy === 'jwt' && request.user) {
      return `user:${request.user.userId}`;
    }

    if (strategy === 'apiKey') {
      return `service:${request.apiKey?.substring(0, 8)}...`;
    }

    return 'anonymous';
  }
}
