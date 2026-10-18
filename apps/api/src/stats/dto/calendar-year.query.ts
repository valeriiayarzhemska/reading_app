import { Matches } from 'class-validator';

import { YEAR_PATTERN } from '@reading/shared';

export class CalendarYearQuery {
  @Matches(YEAR_PATTERN, { message: 'year must look like 2026' })
  year: string;
}
