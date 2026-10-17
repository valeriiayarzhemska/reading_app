import { IsEnum, IsOptional } from 'class-validator';

import { ShelfStatus } from '@reading/shared';

export class ListUserBooksQuery {
  @IsOptional()
  @IsEnum(ShelfStatus)
  status?: ShelfStatus;
}
