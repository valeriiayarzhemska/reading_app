import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

import { DEV_USERS } from '@reading/shared';

export class DevLoginDto {
  // Without an example Swagger shows a random UUID, which is no dev user
  @ApiProperty({
    example: DEV_USERS[0].id,
    description: DEV_USERS.map(
      (user) => `${user.displayName}: ${user.id}`,
    ).join(', '),
  })
  @IsUUID()
  userId: string;
}
