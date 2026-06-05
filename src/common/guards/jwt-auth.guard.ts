import {
  Injectable,
  CanActivate,
  ExecutionContext,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  private readonly logger = new Logger(JwtAuthGuard.name);

  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractToken(request);

    if (!token) {
      this.logger.warn('🔒 No authorization token provided');
      throw new UnauthorizedException('Authorization token required');
    }

    try {
      // Validate JWT token format (basic check)
      const parts = token.split('.');
      if (parts.length !== 3) {
        throw new UnauthorizedException('Invalid token format');
      }

      // Decode token header and payload (without verification - would need secret)
      const decoded = this.decodeToken(token);

      // Store user info on request for use in controllers
      request.user = decoded;
      this.logger.log(`✓ User authenticated: ${decoded.userId}`);

      return true;
    } catch (error) {
      this.logger.error(`✗ Token validation failed: ${error.message}`);
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  private extractToken(request: any): string | null {
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      return null;
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return null;
    }

    return parts[1];
  }

  private decodeToken(token: string): any {
    try {
      // Decode without verification (production should use jwt.verify with secret)
      const payload = token.split('.')[1];
      const decoded = Buffer.from(payload, 'base64').toString('utf-8');
      return JSON.parse(decoded);
    } catch {
      throw new Error('Failed to decode token');
    }
  }
}
