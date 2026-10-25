import { Transform } from 'class-transformer';
import {
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

import {
  COMMENT_MAX_LENGTH,
  POST_MAX_LENGTH,
  type FeedKind,
  type PostInput,
} from '@reading/shared';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class FeedQuery {
  @IsIn(['following', 'all'])
  feed: FeedKind;

  // The last post of the previous page; absent for the first page
  @IsOptional()
  @IsUUID()
  cursor?: string;
}

export class CommentListQuery {
  @IsOptional()
  @IsUUID()
  cursor?: string;
}

export class CreatePostDto implements PostInput {
  // May be empty for a photo; "text or photo" is checked in PostsService
  @Transform(trim)
  @IsString()
  @MaxLength(POST_MAX_LENGTH)
  text: string;

  @IsOptional()
  @IsUUID()
  bookId?: string;

  // Which uploads are allowed is checked in PostsService
  @IsOptional()
  @IsString()
  @MaxLength(500)
  photoUrl?: string;
}

export class CreateCommentDto {
  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(COMMENT_MAX_LENGTH)
  text: string;
}
