import { IsEnum, IsOptional, IsUUID } from 'class-validator';

import { BookFormat, ProgressUnit, ShelfStatus } from '@reading/shared';

export class AddUserBookDto {
  @IsUUID()
  bookId: string;

  @IsEnum(ShelfStatus)
  status: ShelfStatus;

  @IsEnum(BookFormat)
  format: BookFormat;

  // Defaults from the format: audio → MINUTES, otherwise PAGES
  @IsOptional()
  @IsEnum(ProgressUnit)
  progressUnit?: ProgressUnit;
}
