/**
 * PROBLEM 1: Metric Data Parser
 *
 * You're building a mobile dashboard that displays GPU metrics from a backend API.
 * The API returns JSON data, but it's not always well-formed.
 *
 * Task:
 * 1. Define TypeScript interfaces for MetricData
 * 2. Write a parser that validates and transforms the JSON
 * 3. Handle missing/invalid fields gracefully
 * 4. Return an array of valid metrics and an array of errors
 *
 * Input example:
 * [
 *   { "id": "gpu-1", "name": "GPU Utilization", "value": 85.5, "timestamp": "2025-10-27T10:00:00Z" },
 *   { "id": "gpu-2", "name": "GPU Temperature", "value": "75", "timestamp": "invalid-date" },
 *   { "id": "gpu-3", "value": 90.0 }, // missing name
 *   { "id": "gpu-4", "name": "GPU Memory", "value": 12.5, "timestamp": "2025-10-27T10:00:00Z", "unit": "GB" }
 * ]
 *
 * Expected output:
 * {
 *   valid: [MetricData, MetricData],
 *   errors: [{ index: 1, reason: "..." }, { index: 2, reason: "..." }]
 * }
 */

// TODO: Define your interfaces here
interface MetricData {
  id: string;
  name: string;
  value: number;
  timestamp: string;
  unit?: string;  // Optional field, like String? in Kotlin/Swift or str | None in Python
}
interface ParseError {
  index: number;
  reason: string;
}
interface ParseResult {
  valid: MetricData[];
  errors: ParseError[];
}
// Helper function to check if a value is a valid number or numeric string
function isValidNumber(value: unknown): boolean {
  if (typeof value === 'number' && !isNaN(value)) {
    return true;
  }
  if (typeof value === 'string') {
    const num = Number(value);
    return !isNaN(num);
  }
  return false;
}

// Helper function to convert to number (handles string numbers)
function toNumber(value: unknown): number {
  if (typeof value === 'number') {
    return value;
  }
  return Number(value);
}
// Helper function to validate ISO 8601 date format
function isValidTimestamp(timestamp: unknown): boolean {
  if (typeof timestamp !== 'string') {
    return false;
  }
  // Check if it's a valid ISO 8601 date string
  const date = new Date(timestamp);
  return !isNaN(date.getTime()) && timestamp.includes('T');
}
// TODO: Implement the parser
export function parseMetrics(jsonData: unknown[]): ParseResult {
  const valid: MetricData[] = [];
  const errors: ParseError[] = [];

  // Iterate through each item with its index
  jsonData.forEach((item, index) => {
    // Type guard: ensure item is an object
    if (typeof item !== 'object' || item === null) {
      errors.push({
        index,
        reason: 'Item is not an object'
      });
      return; // Continue to next item (like 'continue' in a for loop)
    }

    // Cast to any to access properties (we'll validate them)
    const data = item as any;

    // Validate required field: id
    if (typeof data.id !== 'string' || data.id.trim() === '') {
      errors.push({
        index,
        reason: 'Missing or invalid required field: id'
      });
      return;
    }

    // Validate required field: name
    if (typeof data.name !== 'string' || data.name.trim() === '') {
      errors.push({
        index,
        reason: 'Missing or invalid required field: name'
      });
      return;
    }

    // Validate required field: value (must be number or numeric string)
    if (!isValidNumber(data.value)) {
      errors.push({
        index,
        reason: 'Missing or invalid required field: value (must be a number)'
      });
      return;
    }

    // Validate required field: timestamp
    if (!isValidTimestamp(data.timestamp)) {
      errors.push({
        index,
        reason: 'Missing or invalid required field: timestamp (must be valid ISO 8601 format)'
      });
      return;
    }

    // All validations passed - create the MetricData object
    const metricData: MetricData = {
      id: data.id,
      name: data.name,
      value: toNumber(data.value),
      timestamp: data.timestamp
    };

    // Add optional unit field if present
    if (data.unit !== undefined && typeof data.unit === 'string') {
      metricData.unit = data.unit;
    }

    valid.push(metricData);
  });

  return { valid, errors };
}

// Test data
export const testData = [
  { "id": "gpu-1", "name": "GPU Utilization", "value": 85.5, "timestamp": "2025-10-27T10:00:00Z" },
  { "id": "gpu-2", "name": "GPU Temperature", "value": "75", "timestamp": "invalid-date" },
  { "id": "gpu-3", "value": 90.0 },
  { "id": "gpu-4", "name": "GPU Memory", "value": 12.5, "timestamp": "2025-10-27T10:00:00Z", "unit": "GB" }
];