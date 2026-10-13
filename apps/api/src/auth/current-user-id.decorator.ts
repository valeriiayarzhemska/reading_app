import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import type { AuthenticatedRequest } from './auth.guard.js';

// Set by AuthGuard from the access token
export const CurrentUserId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const { userId } = ctx.switchToHttp().getRequest<AuthenticatedRequest>();

    // Only reachable on a @Public() route by mistake
    if (!userId) {
      throw new UnauthorizedException();
    }

    return userId;
  },
);
