/**
 * Turns a typed deadline such as "end of March" or "in 3 weeks" into a calendar date.
 * Pure: works on 'YYYY-MM-DD' strings and never reads the clock or the time zone.
 */

export type DeadlineParse =
  { kind: 'empty' } | { kind: 'none' } | { kind: 'date'; date: string } | { kind: 'invalid' };

const MONTHS = [
  'january',
  'february',
  'march',
  'april',
  'may',
  'june',
  'july',
  'august',
  'september',
  'october',
  'november',
  'december',
];
const WEEKDAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const NUMBER_WORDS: Record<string, number> = {
  a: 1,
  an: 1,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
};

interface Ymd {
  y: number;
  m: number; // 0-11
  d: number;
}

function toYmd(iso: string): Ymd {
  const [y = 1970, m = 1, d = 1] = iso.split('-').map(Number);
  return { y, m: m - 1, d };
}

function fromUtc(ms: number): Ymd {
  const date = new Date(ms);
  return { y: date.getUTCFullYear(), m: date.getUTCMonth(), d: date.getUTCDate() };
}

const utc = ({ y, m, d }: Ymd) => Date.UTC(y, m, d);
const DAY = 86_400_000;

export function toIso({ y, m, d }: Ymd): string {
  return `${String(y).padStart(4, '0')}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

const daysInMonth = (y: number, m: number) => new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
const addDays = (value: Ymd, n: number): Ymd => fromUtc(utc(value) + n * DAY);
const weekday = (value: Ymd) => new Date(utc(value)).getUTCDay();

/** Adds months, clamping the day (31 Jan + 1 month = 28/29 Feb). */
function addMonths(value: Ymd, n: number): Ymd {
  const total = value.y * 12 + value.m + n;
  const y = Math.floor(total / 12);
  const m = total - y * 12;
  return { y, m, d: Math.min(value.d, daysInMonth(y, m)) };
}

/** Sunday ends the week. */
const endOfWeek = (value: Ymd): Ymd => addDays(value, (7 - weekday(value)) % 7);
const endOfMonth = (y: number, m: number): Ymd => ({ y, m, d: daysInMonth(y, m) });

function monthIndex(token: string): number {
  return token.length >= 3 ? MONTHS.findIndex((name) => name.startsWith(token)) : -1;
}
function weekdayIndex(token: string): number {
  return token.length >= 3 ? WEEKDAYS.findIndex((name) => name.startsWith(token)) : -1;
}

function dayMonth(day: number, month: number, year: number | null, today: Ymd): DeadlineParse {
  if (month < 0) return { kind: 'invalid' };
  const y = year ?? today.y;
  if (day < 1 || day > daysInMonth(y, month)) return { kind: 'invalid' };
  let result: Ymd = { y, m: month, d: day };
  if (year === null && utc(result) < utc(today)) {
    result = { y: y + 1, m: month, d: Math.min(day, daysInMonth(y + 1, month)) };
  }
  return { kind: 'date', date: toIso(result) };
}

export function parseDeadlinePhrase(raw: string, todayIso: string): DeadlineParse {
  const today = toYmd(todayIso);
  const text = raw
    .toLowerCase()
    .replace(/[,.]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^(by|before|due|until) /, '');
  if (!text) return { kind: 'empty' };
  const ok = (value: Ymd): DeadlineParse => ({ kind: 'date', date: toIso(value) });
  let m: RegExpMatchArray | null;

  if (/^(none|no deadline|someday|whenever|-)$/.test(text)) return { kind: 'none' };
  if (/^(today|tonight|eod)$/.test(text)) return ok(today);
  if (/^(tomorrow|tmr)$/.test(text)) return ok(addDays(today, 1));

  m = text.match(
    /^(?:in )?(\d+|an|a|one|two|three|four|five|six|seven|eight|nine|ten) ?(d|days?|w|wks?|weeks?|mos?|months?|y|yrs?|years?)(?: (?:from now|later|time))?$/,
  );
  if (m) {
    const amount = /^\d+$/.test(m[1] ?? '') ? Number(m[1]) : (NUMBER_WORDS[m[1] ?? ''] ?? 0);
    const unit = (m[2] ?? '')[0];
    if (amount < 1 || amount > 1000) return { kind: 'invalid' };
    if (unit === 'd') return ok(addDays(today, amount));
    if (unit === 'w') return ok(addDays(today, 7 * amount));
    if (unit === 'm') return ok(addMonths(today, amount));
    return ok(addMonths(today, 12 * amount));
  }

  m = text.match(/^(?:(?:the )?end of (?:the )?)?(this |next )?(week|month|year)$/);
  if (m) {
    const next = m[1] === 'next ';
    if (m[2] === 'week') return ok(addDays(endOfWeek(today), next ? 7 : 0));
    if (m[2] === 'month') {
      const total = today.y * 12 + today.m + (next ? 1 : 0);
      return ok(endOfMonth(Math.floor(total / 12), total % 12));
    }
    return ok({ y: today.y + (next ? 1 : 0), m: 11, d: 31 });
  }

  m = text.match(/^(?:(this|next|coming) )?([a-z]+)$/);
  if (m && weekdayIndex(m[2] ?? '') >= 0) {
    const target = weekdayIndex(m[2] ?? '');
    if (m[1] === 'next') {
      // The named day in the week after this one (weeks run Monday to Sunday).
      const monday = addDays(endOfWeek(today), 1);
      return ok(addDays(monday, (target + 6) % 7));
    }
    const ahead = (target - weekday(today) + 7) % 7 || 7;
    return ok(addDays(today, ahead));
  }

  m = text.match(/^(?:(early|mid|late|(?:the )?end of) )?([a-z]+)(?: (\d{4}))?$/);
  if (m && monthIndex(m[2] ?? '') >= 0) {
    const month = monthIndex(m[2] ?? '');
    const pick = (y: number): Ymd => ({
      y,
      m: month,
      d: m?.[1] === 'early' ? 10 : m?.[1] === 'mid' ? 15 : daysInMonth(y, month),
    });
    const explicit = m[3] ? Number(m[3]) : null;
    let result = pick(explicit ?? today.y);
    if (explicit === null && utc(result) < utc(today)) result = pick(today.y + 1);
    return ok(result);
  }

  m = text.match(/^(\d{1,2})(?:st|nd|rd|th)? (?:of )?([a-z]+)(?: (\d{4}))?$/);
  if (m) return dayMonth(Number(m[1]), monthIndex(m[2] ?? ''), m[3] ? Number(m[3]) : null, today);
  m = text.match(/^([a-z]+) (\d{1,2})(?:st|nd|rd|th)?(?: (\d{4}))?$/);
  if (m) return dayMonth(Number(m[2]), monthIndex(m[1] ?? ''), m[3] ? Number(m[3]) : null, today);

  m = text.match(/^q([1-4])(?: (\d{4}))?$/);
  if (m) {
    const quarterEnd = Number(m[1]) * 3 - 1;
    const explicit = m[2] ? Number(m[2]) : null;
    let result = endOfMonth(explicit ?? today.y, quarterEnd);
    if (explicit === null && utc(result) < utc(today)) result = endOfMonth(today.y + 1, quarterEnd);
    return ok(result);
  }

  m = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (m) return dayMonth(Number(m[3]), Number(m[2]) - 1, Number(m[1]), today);
  m = text.match(/^(\d{1,2})\/(\d{1,2})(?:\/(\d{2}|\d{4}))?$/);
  if (m) {
    const year = m[3] ? (m[3].length === 2 ? 2000 + Number(m[3]) : Number(m[3])) : null;
    return dayMonth(Number(m[1]), Number(m[2]) - 1, year, today);
  }

  return { kind: 'invalid' };
}

/** Whole days from today to `dateIso` (negative when past). Accepts a date or a datetime. */
export function daysUntil(dateIso: string, todayIso: string): number {
  const target = toYmd(dateIso.slice(0, 10));
  return Math.round((utc(target) - utc(toYmd(todayIso))) / DAY);
}

/** "in 3 weeks", "tomorrow", "2 days overdue". */
export function relativeDeadlineText(days: number): string {
  if (days === 0) return 'today';
  if (days === 1) return 'tomorrow';
  if (days < 0) return `${-days} ${days === -1 ? 'day' : 'days'} overdue`;
  if (days <= 13) return `in ${days} days`;
  if (days < 60) return `in ${Math.round(days / 7)} weeks`;
  if (days < 365) return `in ${Math.round(days / 30.4)} months`;
  const years = Math.round(days / 365);
  return `in ${years} ${years === 1 ? 'year' : 'years'}`;
}
