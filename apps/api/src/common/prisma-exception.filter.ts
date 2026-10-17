import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  ConflictException,
  HttpException,
  NotFoundException,
} from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';

import { Prisma } from '../generated/prisma/client.js';

// Full list of codes: https://www.prisma.io/docs/orm/reference/error-reference
export function toHttpException(
  error: Prisma.PrismaClientKnownRequestError,
): HttpException | null {
  switch (error.code) {
    case 'P2002': // unique constraint failed
      return new ConflictException('This record already exists');
    case 'P2003': // foreign key constraint failed
      return new BadRequestException('A related record does not exist');
    case 'P2025': // record to update/delete not found
      return new NotFoundException('Record not found');
    default:
      return null;
  }
}

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter extends BaseExceptionFilter {
  catch(error: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    // Unknown codes fall through to Nest's default handler (500 + logged)
    super.catch(toHttpException(error) ?? error, host);
  }
}
