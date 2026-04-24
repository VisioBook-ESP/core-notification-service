import {
  Injectable,
  CanActivate,
  ExecutionContext,
  Logger,
  ForbiddenException,
} from '@nestjs/common';

@Injectable()
export class RolesGuard implements CanActivate {
  private readonly logger = new Logger(RolesGuard.name);

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      this.logger.warn('🔒 User not authenticated');
      throw new ForbiddenException('User not authenticated');
    }

    const userRole = user.role || 'user';
    const requiredRoles = Reflect.getMetadata('roles', context.getHandler());

    if (!requiredRoles || requiredRoles.length === 0) {
      return true; // No role requirement
    }

    const hasRole = requiredRoles.includes(userRole);

    if (!hasRole) {
      this.logger.warn(
        `🔒 Access denied for user ${user.userId} with role ${userRole}. Required: ${requiredRoles.join(', ')}`,
      );
      throw new ForbiddenException(`Access denied. Required roles: ${requiredRoles.join(', ')}`);
    }

    this.logger.log(`✓ Role authorization passed for ${user.userId}: ${userRole}`);
    return true;
  }
}
