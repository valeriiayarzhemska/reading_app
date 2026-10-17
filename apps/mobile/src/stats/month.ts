const pad = (value: number) => String(value).padStart(2, '0');

// "2026-10" for the month the phone is in right now (local time, not UTC)
export function currentMonth(now = new Date()): string {
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}`;
}

export function today(now = new Date()): string {
  return `${currentMonth(now)}-${pad(now.getDate())}`;
}

// shiftMonth("2026-01", -1) → "2025-12"
export function shiftMonth(month: string, delta: number): string {
  const [year, monthNumber] = month.split('-').map(Number);
  const date = new Date(year, monthNumber - 1 + delta, 1);

  return currentMonth(date);
}

// Weeks of 7 cells, Monday first; null = a day of the previous/next month
export function monthGrid(month: string): (string | null)[][] {
  const [year, monthNumber] = month.split('-').map(Number);
  const daysInMonth = new Date(year, monthNumber, 0).getDate();
  // getDay(): Sunday = 0. Shifted so Monday = 0 … Sunday = 6
  const leadingBlanks = (new Date(year, monthNumber - 1, 1).getDay() + 6) % 7;

  const cells: (string | null)[] = [
    ...Array<null>(leadingBlanks).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => `${month}-${pad(i + 1)}`),
  ];

  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  return Array.from({ length: cells.length / 7 }, (_, week) =>
    cells.slice(week * 7, week * 7 + 7),
  );
}
