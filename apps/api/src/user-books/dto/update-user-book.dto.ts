import {
  IsEnum,
  IsInt,
  IsISO8601,
  IsOptional,
  Max,
  Min,
} from 'class-validator';

import {
  BookFormat,
  DatePrecision,
  ProgressUnit,
  ShelfStatus,
} from '@reading/shared';

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

  // When the book was really finished, e.g. years ago from the rating sheet.
  // Setting it: only for books on the Read shelf; checked against startedAt
  // and "now". null removes the finish (a mistake, or from the calendar).
  @IsOptional()
  @IsISO8601({ strict: true })
  finishedAt?: string | null;

  // How exactly finishedAt is known; sent together with finishedAt
  @IsOptional()
  @IsEnum(DatePrecision)
  finishedPrecision?: DatePrecision;

  @IsOptional()
  @IsISO8601({ strict: true })
  startedAt?: string;
}
