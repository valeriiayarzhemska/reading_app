import { Matches } from 'class-validator';

import { MONTH_PATTERN } from '@reading/shared';

export class CalendarQuery {
  // "2026-10"; the format check also keeps the value safe to build dates from
  @Matches(MONTH_PATTERN, { message: 'month must look like 2026-10' })
  month: string;
}
