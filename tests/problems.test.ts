import { describe, test, expect } from '@jest/globals';
import { parseMetrics, testData } from '../src/problems/problem1';

describe('Problem 1: Metric Parser', () => {
  test('should parse valid metrics', () => {
    const result = parseMetrics(testData);
    expect(result.valid.length).toBeGreaterThan(0);
  });

  test('should identify invalid metrics', () => {
    const result = parseMetrics(testData);
    expect(result.errors.length).toBeGreaterThan(0);
  });
});

// Add more tests for other problems