import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersRepository } from '../../users/users.repository';

/**
 * AuthGuard — Authentication only.
 * Reads x-auth-token header, resolves user, attaches to request.user.
 * RolesGuard handles authorization separately.
 */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly usersRepository: UsersRepository) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = request.headers['x-auth-token'];

    if (!token) {
      throw new UnauthorizedException('Missing auth token');
    }

    const user = this.usersRepository.findByToken(token as string);
    if (!user) {
      throw new UnauthorizedException('Invalid or expired token');
    }

    request.user = user;
    return true;
  }
}
