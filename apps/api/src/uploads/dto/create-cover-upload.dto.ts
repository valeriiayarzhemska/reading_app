import { COVER_MAX_BYTES } from '@reading/shared';
import { IsInt, Max, Min } from 'class-validator';

export class CreateCoverUploadDto {
  // Bytes of the JPEG the app is about to upload
  @IsInt()
  @Min(1)
  @Max(COVER_MAX_BYTES)
  size: number;
}
