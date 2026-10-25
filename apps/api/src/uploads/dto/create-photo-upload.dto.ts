import { IsInt, Max, Min } from 'class-validator';

import { CHAT_PHOTO_MAX_BYTES } from '@reading/shared';

// Chat and post photos: both shrunk by the app to ~1280 px JPEGs
export class CreatePhotoUploadDto {
  // Bytes of the JPEG the app is about to upload
  @IsInt()
  @Min(1)
  @Max(CHAT_PHOTO_MAX_BYTES)
  size: number;
}
