import { Transform } from 'class-transformer';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class SearchUsersQuery {
  // "@bob" finds bob too: people often type the @ they see on profiles
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().replace(/^@/, '') : value,
  )
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  query: string;
}
