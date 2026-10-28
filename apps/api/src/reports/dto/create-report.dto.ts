import { Transform } from 'class-transformer';
import { IsIn, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

import {
  REPORT_NOTE_MAX,
  ReportReason,
  ReportTarget,
  type ReportInput,
} from '@reading/shared';

export class CreateReportDto implements ReportInput {
  @IsIn(Object.values(ReportTarget))
  targetType: ReportTarget;

  @IsUUID()
  targetId: string;

  @IsIn(Object.values(ReportReason))
  reason: ReportReason;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsOptional()
  @IsString()
  @MaxLength(REPORT_NOTE_MAX)
  note?: string;
}
