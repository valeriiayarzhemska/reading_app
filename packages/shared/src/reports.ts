export const REPORT_NOTE_MAX = 500;

// Keep in sync with the enums in schema.prisma
export const ReportTarget = {
  BOOK: 'BOOK',
  POST: 'POST',
  COMMENT: 'COMMENT',
  MESSAGE: 'MESSAGE',
  REVIEW: 'REVIEW',
} as const;

export type ReportTarget = (typeof ReportTarget)[keyof typeof ReportTarget];

export const ReportReason = {
  SPAM: 'SPAM',
  OFFENSIVE: 'OFFENSIVE',
  WRONG_INFO: 'WRONG_INFO',
  OTHER: 'OTHER',
} as const;

export type ReportReason = (typeof ReportReason)[keyof typeof ReportReason];

// POST /reports
export interface ReportInput {
  targetType: ReportTarget;
  targetId: string;
  reason: ReportReason;
  note?: string;
}
