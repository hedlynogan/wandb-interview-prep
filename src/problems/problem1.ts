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

interface ParseResult {
  // Your code here
}

// TODO: Implement the parser
export function parseMetrics(jsonData: unknown[]): ParseResult {
  // Your code here
  throw new Error("Not implemented");
}

// Test data
export const testData = [
  { "id": "gpu-1", "name": "GPU Utilization", "value": 85.5, "timestamp": "2025-10-27T10:00:00Z" },
  { "id": "gpu-2", "name": "GPU Temperature", "value": "75", "timestamp": "invalid-date" },
  { "id": "gpu-3", "value": 90.0 },
  { "id": "gpu-4", "name": "GPU Memory", "value": 12.5, "timestamp": "2025-10-27T10:00:00Z", "unit": "GB" }
];