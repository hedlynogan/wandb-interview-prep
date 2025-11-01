/**
 * PROBLEM 4: JSON Schema Validator with Zod
 *
 * Use Zod (or write your own validator) to create runtime type checking.
 * This is crucial for mobile apps receiving data from APIs.
 *
 * Task:
 * 1. Define Zod schemas for complex nested data
 * 2. Implement validation with detailed error messages
 * 3. Create type inference from schemas
 * 4. Handle schema migrations/versioning
 */

import { z } from 'zod';

// TODO: Define Zod schemas
export const MetricSchema = z.object({
  // Your code here
});

export const DashboardConfigSchema = z.object({
  // Your code here
});

// TODO: Infer TypeScript types from schemas
export type Metric = z.infer<typeof MetricSchema>;
export type DashboardConfig = z.infer<typeof DashboardConfigSchema>;

// TODO: Implement validator with detailed errors
export function validateDashboardConfig(data: unknown): {
  success: boolean;
  data?: DashboardConfig;
  errors?: string[];
} {
  // Your code here
  throw new Error("Not implemented");
}

// Test data
export const testDashboardData = {
  version: "1.0",
  layout: "grid",
  widgets: [
    {
      id: "widget-1",
      type: "chart",
      title: "GPU Usage",
      data: [/* ... */]
    }
  ]
};