import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '../../common/constants/roles.constant';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { IUser } from '../../users/interfaces/user.interface';

/**
 * RolesGuard — Authorization only.
 * Reads @Roles() metadata, compares against request.user.role.
 * Requires AuthGuard to run first (to set request.user).
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // If no @Roles() decorator, any authenticated user passes
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user: IUser = request.user;

    if (!requiredRoles.includes(user.role as Role)) {
      throw new ForbiddenException(
        'You do not have permission to access this resource',
      );
    }

    return true;
  }
}
