import { IsInt, IsOptional, Max, Min } from 'class-validator';

// Only what the day sheet lets the reader fix; both optional (PATCH)
export class UpdateReadingSessionDto {
  @IsOptional()
  @IsInt()
  @Min(60)
  @Max(24 * 60 * 60)
  durationSec?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100_000)
  progressTo?: number;
}
