import {
  BadRequestException,
  createParamDecorator,
  ExecutionContext,
} from '@nestjs/common';
import { isUUID } from 'class-validator';
import type { Request } from 'express';
import { DEFAULT_DEV_USER_ID } from './dev-users.js';

// TEMPORARY: reads the user from the x-user-id header (or a default dev user).
// In Stage 3 only this function changes — it will read the user from the JWT.
// Controllers using @CurrentUserId() stay the same.
export const CurrentUserId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest<Request>();
    const header = request.headers['x-user-id'];

    if (header === undefined) {
      return DEFAULT_DEV_USER_ID;
    }

    if (typeof header !== 'string' || !isUUID(header)) {
      throw new BadRequestException('Invalid x-user-id header');
    }

    return header;
  },
);
