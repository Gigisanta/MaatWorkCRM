import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { calculateGoalHealth, getGoalProgressDetails } from '@/lib/goal-health';

describe('goal-health', () => {
  // Fixed base time for reproducible tests: April 8, 2026 12:00 UTC
  const BASE_DATE = new Date('2026-04-08T12:00:00Z');

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(BASE_DATE);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ============================================
  // calculateGoalHealth
  // ============================================

  describe('calculateGoalHealth', () => {
    // --- Guard clauses ---

    it('returns on-track when endDate is null', () => {
      const goal = {
        startDate: new Date('2026-01-01'),
        endDate: null,
        currentValue: 10,
        targetValue: 100,
      };
      expect(calculateGoalHealth(goal)).toBe('on-track');
    });

    it('returns on-track when targetValue is 0', () => {
      const goal = {
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-04-30'),
        currentValue: 50,
        targetValue: 0,
      };
      expect(calculateGoalHealth(goal)).toBe('on-track');
    });

    it('returns on-track when targetValue is falsy (undefined)', () => {
      const goal = {
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-04-30'),
        currentValue: 50,
        targetValue: undefined as unknown as number,
      };
      expect(calculateGoalHealth(goal)).toBe('on-track');
    });

    // --- Edge: totalDays <= 0 ---

    it('returns on-track when endDate is before startDate (totalDays <= 0)', () => {
      const goal = {
        startDate: new Date('2026-04-15'),
        endDate: new Date('2026-04-01'), // end before start
        currentValue: 20,
        targetValue: 100,
      };
      expect(calculateGoalHealth(goal)).toBe('on-track');
    });

    it('returns on-track when startDate is in the future (daysElapsed < 0)', () => {
      const goal = {
        startDate: new Date('2026-06-01'),
        endDate: new Date('2026-06-30'),
        currentValue: 5,
        targetValue: 100,
      };
      expect(calculateGoalHealth(goal)).toBe('on-track');
    });

    // --- Past deadline ---
    // BASE_DATE = April 8, 2026

    it('returns on-track when deadline passed but goal is completed', () => {
      // End date: March 15 (before base date April 8)
      // Start: Jan 1 2026, End: March 15 2026 = 73 days
      // effectiveNow = min(now, endDate) = March 15
      // daysElapsed = 73, totalDays = 73 => expectedProgress = 100%
      // currentValue = 100, targetValue = 100 => actualProgress = 100%
      // 100 >= 100 => on-track
      const goal = {
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-03-15'),
        currentValue: 100,
        targetValue: 100,
      };
      expect(calculateGoalHealth(goal)).toBe('on-track');
    });

    it('returns off-track when deadline passed and significantly behind', () => {
      // Same dates as above but only 60% complete vs 100% expected
      // actualProgress = 60, expected = 100
      // 60 < (100 - 15 = 85) => off-track
      const goal = {
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-03-15'),
        currentValue: 60,
        targetValue: 100,
      };
      expect(calculateGoalHealth(goal)).toBe('off-track');
    });

    // --- Mid-goal: on-track ---

    it('returns on-track when actualProgress >= expectedProgress', () => {
      // Start: Feb 8, End: April 30
      // totalDays: Feb 8 to Apr 30 = (20+28+31+30) = 81 days
      // daysElapsed: Feb 8 to Apr 8 = (20+28+31+8) = 87 days... wait
      // Actually from Feb 8: 20 days left in Feb, Mar=31, Apr 1-8=8 => 59 days elapsed
      // totalDays = 81, expected = 59/81 * 100 = 72.8%
      // actual = 80% (currentValue=80, targetValue=100)
      // 80 >= 72.8 => on-track
      const goal = {
        startDate: new Date('2026-02-08'),
        endDate: new Date('2026-04-30'),
        currentValue: 80,
        targetValue: 100,
      };
      expect(calculateGoalHealth(goal)).toBe('on-track');
    });

    it('returns on-track when exactly on time (100% complete at deadline)', () => {
      // End date = April 8 (today), so effectiveNow = endDate
      // Start Jan 1, End April 8 = 97 days total
      // daysElapsed = 97 => expectedProgress = 100%
      // currentValue = 100, targetValue = 100 => actual = 100%
      // 100 >= 100 => on-track
      const goal = {
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-04-08'),
        currentValue: 100,
        targetValue: 100,
      };
      expect(calculateGoalHealth(goal)).toBe('on-track');
    });

    it('returns on-track when ahead of schedule', () => {
      // Start: Feb 8, End: April 30 (81-day window)
      // daysElapsed: Feb 8 to Apr 8 = 59 days
      // expectedProgress = 59/81 * 100 = 72.8%
      // currentValue = 50, targetValue = 100 => actual = 50%
      // 50 >= 72.8 => NO, this is off-track (behind)
      // Need actual > expected: set currentValue = 85 => actual = 85%
      // 85 >= 72.8 => on-track
      const goal = {
        startDate: new Date('2026-02-08'),
        endDate: new Date('2026-04-30'),
        currentValue: 85,
        targetValue: 100,
      };
      expect(calculateGoalHealth(goal)).toBe('on-track');
    });

    // --- Mid-goal: at-risk ---

    it('returns at-risk when actualProgress is between expectedProgress and expectedProgress-15', () => {
      // Start: Feb 15, End: April 30
      // Feb 15 to April 30 total = (13+28+31+30) = 102 days
      // Wait: Feb has 28 days in 2026. Feb 15 to Mar 15 = 28 days, Mar 15 to Apr 15 = 31 days, Apr 15 to Apr 30 = 15 days => 74 days total
      // daysElapsed: Feb 15 to Apr 8 = (13+28+31+8) = 80 days... no
      // From Feb 15: 13 days left in Feb, Mar=31, Apr 1-8=8 => 52 days elapsed
      // totalDays = 74, expected = 52/74 * 100 = 70.3%
      // currentValue = 65, targetValue = 100 => actual = 65%
      // at-risk boundary: 70.3 - 15 = 55.3%
      // 65 >= 55.3 => at-risk
      const goal = {
        startDate: new Date('2026-02-15'),
        endDate: new Date('2026-04-30'),
        currentValue: 65,
        targetValue: 100,
      };
      expect(calculateGoalHealth(goal)).toBe('at-risk');
    });

    it('returns at-risk when exactly 15 percentage points below expected', () => {
      // Start: Mar 1, End: April 30
      // Mar 1 to Apr 30 = 60 days total
      // Mar 1 to Apr 8 = 38 days elapsed
      // expectedProgress = 38/60 * 100 = 63.3%
      // actual = 48.3% (currentValue = 48.3, targetValue = 100)
      // boundary = 63.3 - 15 = 48.3 => 48.3 >= 48.3 => at-risk
      const goal = {
        startDate: new Date('2026-03-01'),
        endDate: new Date('2026-04-30'),
        currentValue: 48.3,
        targetValue: 100,
      };
      expect(calculateGoalHealth(goal)).toBe('at-risk');
    });

    // --- Mid-goal: off-track ---

    it('returns off-track when actualProgress < expectedProgress - 15', () => {
      // Start: Feb 15, End: April 30 (74-day window)
      // expected = 70.3%, actual = 50% (currentValue = 50)
      // 50 < (70.3 - 15 = 55.3) => off-track
      const goal = {
        startDate: new Date('2026-02-15'),
        endDate: new Date('2026-04-30'),
        currentValue: 50,
        targetValue: 100,
      };
      expect(calculateGoalHealth(goal)).toBe('off-track');
    });

    it('returns off-track when deeply behind', () => {
      // Start: Jan 1, End: April 30 (119-day window)
      // daysElapsed: Jan 1 to Apr 8 = 97 days (31+28+31+7)
      // expectedProgress = 97/119 * 100 = 81.5%
      // actual = 40% (currentValue = 40, targetValue = 100)
      // 40 < (81.5 - 15 = 66.5) => off-track
      const goal = {
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-04-30'),
        currentValue: 40,
        targetValue: 100,
      };
      expect(calculateGoalHealth(goal)).toBe('off-track');
    });

    // --- Null startDate ---

    it('returns on-track when startDate is null (defaults to now)', () => {
      // startDate becomes now (April 8)
      // End date: April 30, so totalDays = 22
      // effectiveNow = now = start, so daysElapsed = 0 => expected = 0%
      // currentValue = 10, targetValue = 100 => actual = 10%
      // 10 >= 0 => on-track
      const goal = {
        startDate: null,
        endDate: new Date('2026-04-30'),
        currentValue: 10,
        targetValue: 100,
      };
      expect(calculateGoalHealth(goal)).toBe('on-track');
    });

    it('returns on-track when endDate is in the past with null startDate', () => {
      // endDate in the past (April 1), totalDays computed from end - start (now)
      // effectiveNow = endDate (April 1)
      // daysElapsed = (endDate - start)/day = (April 1 - April 8) ... negative!
      // Actually: start = now (April 8), end = April 1 (in past)
      // totalDays = (Apr1 - Apr8) = negative => totalDays <= 0 => on-track (guard clause)
      const goal = {
        startDate: null,
        endDate: new Date('2026-04-01'),
        currentValue: 20,
        targetValue: 100,
      };
      expect(calculateGoalHealth(goal)).toBe('on-track');
    });

    // --- Edge: startDate equals endDate ---

    it('returns on-track when startDate equals endDate (totalDays = 0)', () => {
      const goal = {
        startDate: new Date('2026-04-08'),
        endDate: new Date('2026-04-08'),
        currentValue: 10,
        targetValue: 100,
      };
      expect(calculateGoalHealth(goal)).toBe('on-track');
    });

    // --- Large numbers and decimals ---

    it('handles large targetValue correctly', () => {
      // Start: Jan 1, End: April 30 (119-day window)
      // expected = 81.5%, actual = 10% (1M / 10M) => off-track
      const goal = {
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-04-30'),
        currentValue: 1_000_000,
        targetValue: 10_000_000,
      };
      expect(calculateGoalHealth(goal)).toBe('off-track');
    });

    it('handles decimal values correctly', () => {
      // Start: Jan 1, End: April 30
      // expected = 81.5%, actual = 99.5% => on-track
      const goal = {
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-04-30'),
        currentValue: 99.5,
        targetValue: 100,
      };
      expect(calculateGoalHealth(goal)).toBe('on-track');
    });
  });

  // ============================================
  // getGoalProgressDetails
  // ============================================

  describe('getGoalProgressDetails', () => {
    it('returns correct health, actualProgress, expectedProgress, daysRemaining, isCompleted', () => {
      const goal = {
        startDate: new Date('2026-02-15'),
        endDate: new Date('2026-04-30'),
        currentValue: 65,
        targetValue: 100,
      };

      const details = getGoalProgressDetails(goal);

      expect(details.health).toBe('at-risk');
      expect(details.actualProgress).toBe(65);
      expect(typeof details.expectedProgress).toBe('number');
      expect(typeof details.daysRemaining).toBe('number');
      expect(typeof details.isCompleted).toBe('boolean');
      expect(details.expectedProgress).toBeGreaterThan(0);
      expect(details.daysRemaining).toBeGreaterThanOrEqual(0);
    });

    it('sets isCompleted to true when currentValue >= targetValue', () => {
      const goal = {
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-04-30'),
        currentValue: 100,
        targetValue: 100,
      };

      const details = getGoalProgressDetails(goal);

      expect(details.isCompleted).toBe(true);
      expect(details.actualProgress).toBe(100);
    });

    it('sets isCompleted to false when currentValue < targetValue', () => {
      const goal = {
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-04-30'),
        currentValue: 50,
        targetValue: 100,
      };

      const details = getGoalProgressDetails(goal);

      expect(details.isCompleted).toBe(false);
    });

    it('sets isCompleted to true when currentValue exceeds targetValue', () => {
      const goal = {
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-04-30'),
        currentValue: 120,
        targetValue: 100,
      };

      const details = getGoalProgressDetails(goal);

      expect(details.isCompleted).toBe(true);
    });

    it('sets daysRemaining to 0 when endDate is in the past', () => {
      const goal = {
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-03-15'),
        currentValue: 100,
        targetValue: 100,
      };

      const details = getGoalProgressDetails(goal);

      expect(details.daysRemaining).toBe(0);
    });

    it('sets daysRemaining to positive when endDate is in the future', () => {
      const goal = {
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-04-30'),
        currentValue: 50,
        targetValue: 100,
      };

      const details = getGoalProgressDetails(goal);

      expect(details.daysRemaining).toBeGreaterThan(0);
    });

    it('returns on-track health for goals with null dates', () => {
      const goal = {
        startDate: null,
        endDate: null,
        currentValue: 10,
        targetValue: 100,
      };

      const details = getGoalProgressDetails(goal);

      expect(details.health).toBe('on-track');
    });

    it('rounds actualProgress and expectedProgress to 1 decimal place', () => {
      const goal = {
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-04-30'),
        currentValue: 33,
        targetValue: 100,
      };

      const details = getGoalProgressDetails(goal);

      // actualProgress = 33%, expectedProgress ~81.5%
      // Both should have at most 1 decimal place
      const actualDecimals = details.actualProgress.toString().split('.')[1]?.length ?? 0;
      const expectedDecimals = details.expectedProgress.toString().split('.')[1]?.length ?? 0;
      expect(actualDecimals).toBeLessThanOrEqual(1);
      expect(expectedDecimals).toBeLessThanOrEqual(1);
    });

    it('returns off-track health for deeply behind goals', () => {
      const goal = {
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-04-30'),
        currentValue: 40,
        targetValue: 100,
      };

      const details = getGoalProgressDetails(goal);

      expect(details.health).toBe('off-track');
      expect(details.actualProgress).toBe(40);
    });

    it('returns at-risk health for slightly behind goals', () => {
      const goal = {
        startDate: new Date('2026-02-15'),
        endDate: new Date('2026-04-30'),
        currentValue: 65,
        targetValue: 100,
      };

      const details = getGoalProgressDetails(goal);

      expect(details.health).toBe('at-risk');
    });
  });
});
