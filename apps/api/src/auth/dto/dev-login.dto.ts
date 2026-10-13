import { IsUUID } from 'class-validator';

export class DevLoginDto {
  @IsUUID()
  userId: string;
}
