
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

// ============================================
// Zod Schemas
// ============================================

// Metric schema: Individual metric data point
export const MetricSchema = z.object({
  id: z.string().min(1, 'Metric ID is required'),
  name: z.string().min(1, 'Metric name is required'),
  value: z.number().min(0, 'Metric value must be non-negative'),
  timestamp: z.string().datetime('Must be a valid ISO 8601 datetime'),
  unit: z.string().optional(),
  tags: z.array(z.string()).optional()
});

// Widget schema: Dashboard widget configuration
export const WidgetSchema = z.object({
  id: z.string().min(1, 'Widget ID is required'),
  type: z.enum(['chart', 'table', 'metric', 'gauge']),
  title: z.string().min(1, 'Widget title is required'),
  position: z.object({
    x: z.number().int().min(0),
    y: z.number().int().min(0),
    width: z.number().int().min(1).max(12),
    height: z.number().int().min(1).max(12)
  }),
  data: z.array(z.number()).optional(),
  config: z.record(z.string(), z.any()).optional()
});

// Dashboard configuration schema
export const DashboardConfigSchema = z.object({
  version: z.string().regex(/^\d+\.\d+$/, 'Version must be in format X.Y (e.g., 1.0)'),
  layout: z.enum(['grid', 'flex', 'fixed']),
  theme: z.enum(['light', 'dark', 'auto']).optional().default('light'),
  widgets: z.array(WidgetSchema).min(1, 'Dashboard must have at least one widget'),
  metadata: z.object({
    createdAt: z.string().datetime().optional(),
    updatedAt: z.string().datetime().optional(),
    author: z.string().optional()
  }).optional()
});

// ============================================
// Type Inference from Schemas
// ============================================

// TypeScript types inferred from Zod schemas
export type Metric = z.infer<typeof MetricSchema>;
export type Widget = z.infer<typeof WidgetSchema>;
export type DashboardConfig = z.infer<typeof DashboardConfigSchema>;

// ============================================
// Validation Result Types
// ============================================

interface ValidationSuccess<T> {
  success: true;
  data: T;
  errors?: never;
}

interface ValidationFailure {
  success: false;
  data?: never;
  errors: string[];
}

type ValidationResult<T> = ValidationSuccess<T> | ValidationFailure;

// ============================================
// Validation Functions
// ============================================

/**
 * Validate dashboard configuration with detailed error messages
 */
export function validateDashboardConfig(data: unknown): ValidationResult<DashboardConfig> {
  const result = DashboardConfigSchema.safeParse(data);

  if (result.success) {
    return {
      success: true,
      data: result.data
    };
  }

  // Extract detailed error messages from Zod
  const errors = result.error.issues.map((err: z.ZodIssue) => {
    const path = err.path.join('.');
    return path ? `${path}: ${err.message}` : err.message;
  });

  return {
    success: false,
    errors
  };
}

/**
 * Validate a single metric
 */
export function validateMetric(data: unknown): ValidationResult<Metric> {
  const result = MetricSchema.safeParse(data);

  if (result.success) {
    return {
      success: true,
      data: result.data
    };
  }

  const errors = result.error.issues.map((err: z.ZodIssue) => {
    const path = err.path.join('.');
    return path ? `${path}: ${err.message}` : err.message;
  });

  return {
    success: false,
    errors
  };
}

/**
 * Validate an array of metrics
 */
export function validateMetrics(data: unknown): ValidationResult<Metric[]> {
  // First check if it's an array
  if (!Array.isArray(data)) {
    return {
      success: false,
      errors: ['Data must be an array']
    };
  }

  // Validate each metric individually
  const validMetrics: Metric[] = [];
  const allErrors: string[] = [];

  data.forEach((item, index) => {
    const result = validateMetric(item);
    if (result.success) {
      validMetrics.push(result.data);
    } else {
      result.errors.forEach(err => {
        allErrors.push(`[${index}] ${err}`);
      });
    }
  });

  // If any errors, return failure
  if (allErrors.length > 0) {
    return {
      success: false,
      errors: allErrors
    };
  }

  return {
    success: true,
    data: validMetrics
  };
}

/**
 * Validate and migrate dashboard config from older versions
 */
export function validateAndMigrateDashboard(data: unknown): ValidationResult<DashboardConfig> {
  // Type guard: ensure it's an object
  if (typeof data !== 'object' || data === null) {
    return {
      success: false,
      errors: ['Data must be an object']
    };
  }

  const config = data as any;

  // Handle version migration
  if (!config.version) {
    // Assume old format, migrate to 1.0
    config.version = '1.0';
  }

  // Migrate from version 0.9 to 1.0
  if (config.version === '0.9') {
    // In version 0.9, layout was called 'type'
    if (config.type) {
      config.layout = config.type;
      delete config.type;
    }
    config.version = '1.0';
  }

  // Migrate from version 1.0 to 1.1 (if needed)
  if (config.version === '1.0') {
    // Add default theme if missing
    if (!config.theme) {
      config.theme = 'light';
    }
  }

  // Now validate with current schema
  return validateDashboardConfig(config);
}

// ============================================
// Test Data
// ============================================

export const testDashboardData = {
  version: "1.0",
  layout: "grid",
  theme: "dark",
  widgets: [
    {
      id: "widget-1",
      type: "chart",
      title: "GPU Usage",
      position: { x: 0, y: 0, width: 6, height: 4 },
      data: [45, 67, 89, 72, 91]
    },
    {
      id: "widget-2",
      type: "metric",
      title: "CPU Temperature",
      position: { x: 6, y: 0, width: 3, height: 2 },
      data: [75]
    },
    {
      id: "widget-3",
      type: "table",
      title: "Active Jobs",
      position: { x: 6, y: 2, width: 3, height: 2 },
      config: { columns: ['id', 'status', 'progress'] }
    }
  ],
  metadata: {
    createdAt: "2025-10-27T10:00:00Z",
    updatedAt: "2025-10-27T11:00:00Z",
    author: "admin"
  }
};

export const testInvalidDashboardData = {
  version: "1.0",
  layout: "grid",
  widgets: [
    {
      id: "",  // Invalid: empty ID
      type: "chart",
      title: "GPU Usage",
      position: { x: 0, y: 0, width: 6, height: 4 }
    },
    {
      id: "widget-2",
      type: "invalid-type",  // Invalid: wrong type
      title: "CPU Temperature",
      position: { x: 6, y: 0, width: 15, height: 2 }  // Invalid: width > 12
    }
  ]
};

export const testMetricData: Metric = {
  id: "metric-1",
  name: "GPU Utilization",
  value: 85.5,
  timestamp: "2025-10-27T10:00:00Z",
  unit: "%",
  tags: ["production", "gpu-1"]
};

export const testOldVersionData = {
  version: "0.9",
  type: "grid",  // Old field name (should be 'layout' in v1.0)
  widgets: [
    {
      id: "widget-1",
      type: "chart",
      title: "Legacy Dashboard",
      position: { x: 0, y: 0, width: 12, height: 4 },
      data: [10, 20, 30]
    }
  ]
};