import { describe, expect, it } from 'vitest';
import { daysUntil, parseDeadlinePhrase, relativeDeadlineText } from '@/domain/deadline-phrase';

// Wednesday.
const TODAY = '2026-11-18';
const parse = (text: string) => parseDeadlinePhrase(text, TODAY);
const date = (iso: string) => ({ kind: 'date', date: iso });

describe('parseDeadlinePhrase', () => {
  it('reads relative spans', () => {
    expect(parse('tomorrow')).toEqual(date('2026-11-19'));
    expect(parse('in 3 weeks')).toEqual(date('2026-12-09'));
    expect(parse('10 days')).toEqual(date('2026-11-28'));
    expect(parse('in two months')).toEqual(date('2027-01-18'));
    expect(parse('a year')).toEqual(date('2027-11-18'));
  });

  it('clamps month arithmetic to the last day of the target month', () => {
    expect(parseDeadlinePhrase('in 1 month', '2026-01-31')).toEqual(date('2026-02-28'));
  });

  it('reads week, month and year ends', () => {
    expect(parse('end of week')).toEqual(date('2026-11-22'));
    expect(parse('end of month')).toEqual(date('2026-11-30'));
    expect(parse('next month')).toEqual(date('2026-12-31'));
    expect(parse('end of year')).toEqual(date('2026-12-31'));
  });

  it('reads weekdays', () => {
    expect(parse('friday')).toEqual(date('2026-11-20'));
    expect(parse('wednesday')).toEqual(date('2026-11-25'));
    expect(parse('next friday')).toEqual(date('2026-11-27'));
  });

  it('reads months and rolls past ones into next year', () => {
    expect(parse('end of March')).toEqual(date('2027-03-31'));
    expect(parse('mid April')).toEqual(date('2027-04-15'));
    expect(parse('december')).toEqual(date('2026-12-31'));
    expect(parse('March 2028')).toEqual(date('2028-03-31'));
  });

  it('reads dates, quarters and ISO strings', () => {
    expect(parse('15/12')).toEqual(date('2026-12-15'));
    expect(parse('3 Jan')).toEqual(date('2027-01-03'));
    expect(parse('January 3rd 2028')).toEqual(date('2028-01-03'));
    expect(parse('Q1 2027')).toEqual(date('2027-03-31'));
    expect(parse('Q2')).toEqual(date('2027-06-30'));
    expect(parse('2027-02-01')).toEqual(date('2027-02-01'));
  });

  it('treats empty and "someday" as no deadline', () => {
    expect(parse('')).toEqual({ kind: 'empty' });
    expect(parse('someday')).toEqual({ kind: 'none' });
  });

  it('rejects text it cannot place', () => {
    expect(parse('whenever it feels right')).toEqual({ kind: 'invalid' });
    expect(parse('31/02')).toEqual({ kind: 'invalid' });
    expect(parse('in 0 days')).toEqual({ kind: 'invalid' });
  });
});

describe('relative deadline text', () => {
  it('counts down and up from today', () => {
    expect(daysUntil('2026-11-25', TODAY)).toBe(7);
    expect(daysUntil('2026-11-18T23:00:00+07:00', TODAY)).toBe(0);
    expect(relativeDeadlineText(0)).toBe('today');
    expect(relativeDeadlineText(1)).toBe('tomorrow');
    expect(relativeDeadlineText(5)).toBe('in 5 days');
    expect(relativeDeadlineText(21)).toBe('in 3 weeks');
    expect(relativeDeadlineText(120)).toBe('in 4 months');
    expect(relativeDeadlineText(-1)).toBe('1 day overdue');
    expect(relativeDeadlineText(-9)).toBe('9 days overdue');
  });
});
