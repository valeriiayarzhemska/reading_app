import { IsOptional, IsUUID } from 'class-validator';

export class SetClubBookDto {
  // null: the club isn't reading anything together right now
  @IsOptional()
  @IsUUID()
  bookId: string | null;
}
