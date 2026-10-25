import { ArrayMaxSize, ArrayUnique, IsArray, IsUUID } from 'class-validator';

import { FAVORITES_MAX } from '@reading/shared';

export class SetFavoritesDto {
  // Shelf entries in display order; [] clears the favorites
  @IsArray()
  @ArrayMaxSize(FAVORITES_MAX)
  @ArrayUnique()
  @IsUUID('all', { each: true })
  userBookIds: string[];
}
