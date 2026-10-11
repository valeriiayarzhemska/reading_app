import { BookFormat, ProgressUnit, ShelfStatus } from '@reading/shared';
import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';

export class UpdateUserBookDto {
  @IsOptional()
  @IsEnum(ShelfStatus)
  status?: ShelfStatus;

  @IsOptional()
  @IsEnum(BookFormat)
  format?: BookFormat;

  @IsOptional()
  @IsEnum(ProgressUnit)
  progressUnit?: ProgressUnit;

  @IsOptional()
  @IsInt()
  @Min(0)
  currentProgress?: number;

  // null clears the rating (@IsOptional skips validation for null too)
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  rating?: number | null;
}
