import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';

import { IS_PUBLIC_KEY } from './public.decorator.js';
import { TokenService } from './token.service.js';

export interface AuthenticatedRequest extends Request {
  userId?: string;
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly tokens: TokenService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Global guards run before socket handlers too, but a socket message has
    // no headers: sockets are checked once, when they connect (ChatGateway)
    if (context.getType() !== 'http') {
      return true;
    }

    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const [scheme, token] = request.headers.authorization?.split(' ') ?? [];

    if (scheme !== 'Bearer' || !token) {
      throw new UnauthorizedException();
    }

    const userId = await this.tokens.verifyAccessToken(token);

    if (!userId) {
      throw new UnauthorizedException();
    }

    request.userId = userId;

    return true;
  }
}
