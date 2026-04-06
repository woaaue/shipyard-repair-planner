import { describe, it, expect } from 'vitest';
import { formatCurrency, calculateDaysLeft } from './export';
import { truncate, capitalize } from './helpers';

describe('Export utilities', () => {
  it('formatCurrency formats numbers correctly', () => {
    expect(formatCurrency(1000000)).toContain('1');
    expect(formatCurrency(0)).toContain('0');
  });

  it('calculateDaysLeft returns positive for future dates', () => {
    const future = new Date();
    future.setDate(future.getDate() + 10);
    const result = calculateDaysLeft(future.toISOString());
    expect(result).toBeGreaterThan(0);
  });

  it('calculateDaysLeft returns negative for past dates', () => {
    const past = new Date();
    past.setDate(past.getDate() - 10);
    const result = calculateDaysLeft(past.toISOString());
    expect(result).toBeLessThan(0);
  });
});

describe('Helper functions', () => {
  it('truncate shortens long strings', () => {
    expect(truncate('Hello World', 5)).toBe('Hello...');
    expect(truncate('Hi', 10)).toBe('Hi');
  });

  it('capitalize works correctly', () => {
    expect(capitalize('hello')).toBe('Hello');
    expect(capitalize('HELLO')).toBe('HELLO');
  });
});