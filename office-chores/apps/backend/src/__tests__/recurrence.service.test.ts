import {
  getOccurrencesInWindow,
  getNextNOccurrences,
} from '../services/recurrence.service';

describe('recurrence.service', () => {
  const monday = (dateStr: string) => new Date(`${dateStr}T00:00:00.000Z`);

  // Base rule: every 2 weeks on Monday, starting 2024-01-08 (a Monday)
  const baseRule = {
    intervalWeeks: 2,
    dayOfWeek: 1, // Monday
    startDate: new Date('2024-01-08T00:00:00.000Z'),
    endDate: null,
  };

  describe('getOccurrencesInWindow', () => {
    it('returns occurrences within a 4-week window', () => {
      const start = new Date('2024-01-08T00:00:00.000Z');
      const end = new Date('2024-02-04T00:00:00.000Z');
      const result = getOccurrencesInWindow(baseRule, start, end);

      expect(result).toHaveLength(2);
      expect(result[0].toISOString().startsWith('2024-01-08')).toBe(true);
      expect(result[1].toISOString().startsWith('2024-01-22')).toBe(true);
    });

    it('returns empty array if window is before start date', () => {
      const start = new Date('2023-12-01T00:00:00.000Z');
      const end = new Date('2024-01-01T00:00:00.000Z');
      const result = getOccurrencesInWindow(baseRule, start, end);
      expect(result).toHaveLength(0);
    });

    it('respects endDate', () => {
      const rule = { ...baseRule, endDate: new Date('2024-01-22T00:00:00.000Z') };
      const start = new Date('2024-01-01T00:00:00.000Z');
      const end = new Date('2024-03-01T00:00:00.000Z');
      const result = getOccurrencesInWindow(rule, start, end);
      expect(result).toHaveLength(2); // Jan 8 and Jan 22 only
      expect(result[result.length - 1].toISOString().startsWith('2024-01-22')).toBe(true);
    });

    it('returns exactly the occurrence on window boundary', () => {
      const start = new Date('2024-01-08T00:00:00.000Z');
      const end = new Date('2024-01-08T00:00:00.000Z');
      const result = getOccurrencesInWindow(baseRule, start, end);
      expect(result).toHaveLength(1);
    });

    it('handles 1-week interval', () => {
      const rule = { ...baseRule, intervalWeeks: 1 };
      const start = new Date('2024-01-08T00:00:00.000Z');
      const end = new Date('2024-01-29T00:00:00.000Z');
      const result = getOccurrencesInWindow(rule, start, end);
      expect(result).toHaveLength(4); // Jan 8, 15, 22, 29
    });
  });

  describe('getNextNOccurrences', () => {
    it('returns the next N dates after a given date', () => {
      const after = new Date('2024-01-01T00:00:00.000Z');
      const result = getNextNOccurrences(baseRule, after, 3);
      expect(result).toHaveLength(3);
      expect(result[0].toISOString().startsWith('2024-01-08')).toBe(true);
      expect(result[1].toISOString().startsWith('2024-01-22')).toBe(true);
      expect(result[2].toISOString().startsWith('2024-02-05')).toBe(true);
    });

    it('returns fewer items if endDate cuts it short', () => {
      const rule = { ...baseRule, endDate: new Date('2024-01-22T00:00:00.000Z') };
      const result = getNextNOccurrences(rule, new Date('2024-01-01T00:00:00.000Z'), 10);
      expect(result).toHaveLength(2); // Jan 8, Jan 22
    });

    it('returns empty if after is past endDate', () => {
      const rule = { ...baseRule, endDate: new Date('2024-01-01T00:00:00.000Z') };
      const result = getNextNOccurrences(rule, new Date('2024-02-01T00:00:00.000Z'), 5);
      expect(result).toHaveLength(0);
    });

    it('returns 0 results when n=0', () => {
      const result = getNextNOccurrences(baseRule, new Date('2024-01-01T00:00:00.000Z'), 0);
      expect(result).toHaveLength(0);
    });
  });
});
