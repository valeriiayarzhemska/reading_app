import { IsISO8601, Matches } from 'class-validator';

export class ListSessionsQuery {
  // A local calendar day, "2026-10-03". Matches: a date only, no time.
  // IsISO8601 strict: a real date, so "2026-02-31" is a 400, not a SQL error.
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'date must look like 2026-10-03' })
  @IsISO8601({ strict: true })
  date: string;
}
