import { BookFormat, ProgressUnit, ShelfStatus } from '@reading/shared';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';

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
