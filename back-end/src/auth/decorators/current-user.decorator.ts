import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { IUser } from '../../users/interfaces/user.interface';

/**
 * @CurrentUser() — extracts request.user set by AuthGuard.
 * Use in controller params: findAll(@CurrentUser() user: IUser)
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): IUser => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
