import { ShelfStatus } from '@reading/shared';
import { IsEnum, IsOptional } from 'class-validator';

export class ListUserBooksQuery {
  @IsOptional()
  @IsEnum(ShelfStatus)
  status?: ShelfStatus;
}
