# Data Transformer Pipeline Implementation Guide

## Overview

This document explains the step-by-step process for implementing a type-safe, composable data transformation pipeline in TypeScript. This pattern is commonly used in mobile applications to transform API data into formats suitable for UI rendering.

## Table of Contents

1. [Conceptual Foundation](#conceptual-foundation)
2. [Implementation Steps](#implementation-steps)
3. [Design Patterns Used](#design-patterns-used)
4. [Real-World Application](#real-world-application)
5. [Testing Strategy](#testing-strategy)
6. [Performance Considerations](#performance-considerations)

---

## Conceptual Foundation

### The Problem

Mobile applications frequently need to:
- Fetch data from APIs (JSON format)
- Transform data through multiple steps
- Handle both sync and async operations
- Maintain type safety throughout transformations
- Optimize data for mobile rendering (sampling, aggregation)

### The Solution: Pipeline Pattern

A **transformation pipeline** allows you to:
- Chain operations in a readable, declarative way
- Maintain type safety as data flows through transformations
- Reuse common transformations
- Handle errors gracefully
- Support both synchronous and asynchronous operations

### Example Use Case
```
Raw API Data (1000s of metrics)
    ↓
Filter by time range
    ↓
Filter by metric name
    ↓
Aggregate into hourly buckets
    ↓
Sample to 100 points (mobile optimization)
    ↓
Format for chart component
    ↓
ChartData ready for React Native/SwiftUI/Compose
```

---

## Implementation Steps

### Step 1: Define Your Data Types

**Why:** Type safety is crucial. Define all data structures before implementation.
```typescript
/**
 * Raw metric from API (W&B, CloudWatch, custom backend)
 */
export interface RawMetric {
  timestamp: Date;      // When metric was recorded
  name: string;         // Metric identifier (e.g., "loss", "accuracy")
  value: number;        // The actual value
  step: number;         // Training step or sequence number
  metadata?: Record<string, any>;  // Additional context
}

/**
 * Aggregated metric with statistics
 */
export interface AggregatedMetric {
  startTime: Date;
  endTime: Date;
  name: string;
  count: number;        // How many metrics in this bucket
  min: number;
  max: number;
  avg: number;
  sum: number;
  values: number[];     // All values in bucket
}

/**
 * Chart data point for mobile UI
 */
export interface ChartDataPoint {
  x: number;            // Timestamp in milliseconds
  y: number;            // Value to plot
  label?: string;       // Optional label for tooltips
}

/**
 * Final chart configuration
 */
export interface ChartData {
  type: 'line' | 'bar' | 'scatter';
  title: string;
  series: {
    name: string;
    data: ChartDataPoint[];
    color?: string;
  }[];
  xAxis: {
    type: 'time' | 'linear' | 'category';
    label: string;
  };
  yAxis: {
    label: string;
    min?: number;
    max?: number;
  };
}
```

**Design Decision:** Use interfaces instead of types for better IDE support and extensibility.

---

### Step 2: Define the Transformer Type

**Why:** A transformer is a function that takes input and produces output. Supporting both sync and async is critical.
```typescript
/**
 * A transformer can be synchronous or asynchronous
 * This flexibility is key for:
 * - Sync: filtering, mapping, calculations
 * - Async: API enrichment, database lookups
 */
export type Transformer<TInput, TOutput> = 
  (input: TInput) => TOutput | Promise<TOutput>;
```

**Key Insight:** The return type `TOutput | Promise<TOutput>` allows the same pipeline to handle both sync and async transformers seamlessly.

---

### Step 3: Implement the Pipeline Class

#### 3.1: Basic Structure
```typescript
export class TransformPipeline<TInput, TOutput = TInput> {
  private transformers: Transformer<any, any>[] = [];

  // Methods to implement:
  // - pipe() - add a transformer
  // - execute() - run the pipeline
}
```

**Design Decision:** 
- `TOutput = TInput` as default makes the initial pipeline type-safe
- Store transformers in an array for sequential execution
- Use `any` internally but maintain type safety at the API level

#### 3.2: Implement `pipe()` Method
```typescript
pipe<TNext>(
  transformer: Transformer<TOutput, TNext>
): TransformPipeline<TInput, TNext> {
  // Create NEW pipeline (immutability)
  const newPipeline = new TransformPipeline<TInput, TNext>();
  
  // Copy existing transformers + new one
  newPipeline.transformers = [...this.transformers, transformer];
  
  return newPipeline;
}
```

**Why Immutability?**
- Allows pipeline reuse
- Prevents accidental modification
- Enables composition patterns
- Easier to debug (no side effects)

**Type Magic:**
- Input: `TOutput` (current pipeline output)
- Output: `TNext` (new transformer output)
- Returns: `TransformPipeline<TInput, TNext>` (maintains original input, updates output)

#### 3.3: Implement `execute()` Method
```typescript
async execute(input: TInput): Promise<TOutput> {
  let result: any = input;

  // Apply each transformer sequentially
  for (let i = 0; i < this.transformers.length; i++) {
    const transformer = this.transformers[i];
    try {
      // await handles both sync and async
      result = await transformer(result);
    } catch (error) {
      throw new Error(
        `Pipeline execution failed at step ${i + 1}: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  return result as TOutput;
}
```

**Implementation Details:**

1. **Sequential execution:** Each transformer receives the output of the previous one
2. **Await everything:** `await` works on both Promises and regular values
3. **Error context:** Include step number for debugging
4. **Type assertion:** Cast final result to `TOutput` (type-safe at API level)

---

### Step 4: Create Reusable Transformers

#### 4.1: Filter by Time Range
```typescript
filterByTimeRange: (start: Date, end: Date) => {
  return (metrics: RawMetric[]): RawMetric[] => {
    const startTime = start.getTime();
    const endTime = end.getTime();

    return metrics.filter((metric) => {
      const metricTime = metric.timestamp.getTime();
      return metricTime >= startTime && metricTime <= endTime;
    });
  };
}
```

**Pattern:** Higher-order function
- Outer function: Takes configuration (start, end)
- Inner function: The actual transformer
- Benefits: Partial application, reusability

#### 4.2: Aggregate by Interval
```typescript
aggregateByInterval: (intervalMinutes: number) => {
  return (metrics: RawMetric[]): AggregatedMetric[] => {
    if (metrics.length === 0) return [];

    // 1. Group by metric name
    const metricsByName = new Map<string, RawMetric[]>();
    for (const metric of metrics) {
      if (!metricsByName.has(metric.name)) {
        metricsByName.set(metric.name, []);
      }
      metricsByName.get(metric.name)!.push(metric);
    }

    const result: AggregatedMetric[] = [];
    const intervalMs = intervalMinutes * 60 * 1000;

    // 2. Process each metric name
    for (const [name, nameMetrics] of metricsByName) {
      // Sort by time
      const sorted = [...nameMetrics].sort(
        (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
      );

      const firstTime = sorted[0].timestamp.getTime();
      const buckets = new Map<number, RawMetric[]>();

      // 3. Assign to time buckets
      for (const metric of sorted) {
        const bucketIndex = Math.floor(
          (metric.timestamp.getTime() - firstTime) / intervalMs
        );
        const bucketKey = firstTime + bucketIndex * intervalMs;

        if (!buckets.has(bucketKey)) {
          buckets.set(bucketKey, []);
        }
        buckets.get(bucketKey)!.push(metric);
      }

      // 4. Create aggregated metrics
      for (const [bucketTime, bucketMetrics] of buckets) {
        const values = bucketMetrics.map((m) => m.value);
        const sum = values.reduce((a, b) => a + b, 0);

        result.push({
          startTime: new Date(bucketTime),
          endTime: new Date(bucketTime + intervalMs),
          name,
          count: values.length,
          min: Math.min(...values),
          max: Math.max(...values),
          avg: sum / values.length,
          sum,
          values,
        });
      }
    }

    return result.sort((a, b) => 
      a.startTime.getTime() - b.startTime.getTime()
    );
  };
}
```

**Algorithm:**
1. **Group by name:** Different metrics shouldn't be aggregated together
2. **Create time buckets:** Calculate which bucket each metric belongs to
3. **Calculate statistics:** Min, max, avg, sum, count
4. **Sort results:** Chronological order for rendering

**Why This Matters:**
- Reduces data points for mobile (1000s → 100s)
- Provides statistical summary (useful for dashboards)
- Handles multiple metric types simultaneously

#### 4.3: Sample for Mobile Performance
```typescript
sampleMetrics: (maxPoints: number) => {
  return (metrics: RawMetric[]): RawMetric[] => {
    if (metrics.length <= maxPoints) return metrics;

    const step = Math.floor(metrics.length / maxPoints);
    const sampled: RawMetric[] = [];

    for (let i = 0; i < metrics.length; i += step) {
      sampled.push(metrics[i]);
    }

    // Always include the last point
    if (sampled[sampled.length - 1] !== metrics[metrics.length - 1]) {
      sampled.push(metrics[metrics.length - 1]);
    }

    return sampled;
  };
}
```

**Mobile Optimization:**
- **Problem:** Rendering 10,000 points on mobile = slow, battery drain
- **Solution:** Downsample to reasonable count (50-200 points)
- **Algorithm:** Evenly spaced sampling
- **Preservation:** Always keep first and last points for accuracy

#### 4.4: Format for Chart
```typescript
formatForChart: (options?: {
  chartType?: 'line' | 'bar' | 'scatter';
  title?: string;
  color?: string;
}) => {
  return (metrics: RawMetric[]): ChartData => {
    // Group by metric name for multi-series charts
    const seriesMap = new Map<string, ChartDataPoint[]>();

    for (const metric of metrics) {
      if (!seriesMap.has(metric.name)) {
        seriesMap.set(metric.name, []);
      }

      seriesMap.get(metric.name)!.push({
        x: metric.timestamp.getTime(),
        y: metric.value,
        label: `Step ${metric.step}`,
      });
    }

    // Convert to chart format
    const series = Array.from(seriesMap.entries()).map(([name, data]) => ({
      name,
      data: data.sort((a, b) => a.x - b.x), // Ensure chronological
      color: options?.color,
    }));

    return {
      type: options?.chartType || 'line',
      title: options?.title || 'Metrics Over Time',
      series,
      xAxis: {
        type: 'time',
        label: 'Time',
      },
      yAxis: {
        label: 'Value',
      },
    };
  };
}
```

**Bridge to UI:**
- Transforms internal data → UI component props
- Handles multi-series (multiple metrics)
- Sorts data (charts need chronological order)
- Configurable through options

#### 4.5: Async Transformer Example
```typescript
enrichWithMetadata: () => {
  return async (metrics: RawMetric[]): Promise<RawMetric[]> => {
    // Simulate API call (could be real enrichment)
    await new Promise((resolve) => setTimeout(resolve, 100));

    return metrics.map((metric) => ({
      ...metric,
      metadata: {
        ...metric.metadata,
        enriched: true,
        processedAt: new Date().toISOString(),
      },
    }));
  };
}
```

**Async Use Cases:**
- Fetch additional data from API
- Database lookups
- Rate-limited operations
- External service calls

---

### Step 5: Usage Patterns

#### Pattern 1: Simple Filter → Format
```typescript
const pipeline = new TransformPipeline<RawMetric[]>()
  .pipe(transformers.filterByTimeRange(startDate, endDate))
  .pipe(transformers.formatForChart({ title: 'Loss Over Time' }));

const chartData = await pipeline.execute(rawMetrics);
```

#### Pattern 2: Aggregation Pipeline
```typescript
const pipeline = new TransformPipeline<RawMetric[]>()
  .pipe(transformers.filterByName(['loss', 'accuracy']))
  .pipe(transformers.aggregateByInterval(60))  // 1-hour buckets
  .pipe(transformers.formatAggregatedForChart({ useAverage: true }));

const chartData = await pipeline.execute(rawMetrics);
```

#### Pattern 3: Mobile-Optimized Pipeline
```typescript
const pipeline = new TransformPipeline<RawMetric[]>()
  .pipe(transformers.filterByTimeRange(last24Hours, now))
  .pipe(transformers.sampleMetrics(100))  // Mobile: max 100 points
  .pipe(transformers.movingAverage(5))    // Smooth data
  .pipe(transformers.formatForChart());

const chartData = await pipeline.execute(rawMetrics);
```

#### Pattern 4: Custom Inline Transformer
```typescript
const pipeline = new TransformPipeline<RawMetric[]>()
  .pipe(transformers.filterByName(['loss']))
  .pipe((metrics: RawMetric[]): number => {
    // Custom: calculate average
    return metrics.reduce((sum, m) => sum + m.value, 0) / metrics.length;
  });

const avgLoss = await pipeline.execute(rawMetrics);
```

---

## Design Patterns Used

### 1. **Builder Pattern**
- Pipeline construction through method chaining
- Fluent API: `new Pipeline().pipe().pipe().pipe()`

### 2. **Chain of Responsibility**
- Each transformer handles one transformation
- Result flows to next transformer

### 3. **Higher-Order Functions**
- Transformers are functions that return functions
- Enables configuration and partial application

### 4. **Immutability**
- Each `pipe()` returns new pipeline
- Original pipeline unchanged
- Functional programming principles

### 5. **Strategy Pattern**
- Transformers are interchangeable strategies
- Runtime composition of transformations

---

## Real-World Application

### Mobile App: W&B Dashboard

**Scenario:** Display training metrics in a React Native app
```typescript
// In your React Native component
const fetchAndDisplayMetrics = async (experimentId: string) => {
  // 1. Fetch from API
  const rawMetrics = await api.getExperimentMetrics(experimentId);

  // 2. Transform for mobile
  const pipeline = new TransformPipeline<RawMetric[]>()
    .pipe(transformers.filterByTimeRange(last7Days, now))
    .pipe(transformers.sampleMetrics(50))  // Mobile: keep it light
    .pipe(transformers.formatForChart({
      chartType: 'line',
      title: 'Training Progress',
    }));

  const chartData = await pipeline.execute(rawMetrics);

  // 3. Render with your chart library
  return <LineChart data={chartData} />;
};
```

### iOS App: SwiftUI + TypeScript Bridge
```typescript
// TypeScript/Node.js backend for app
export async function generateChartConfig(
  metrics: RawMetric[]
): Promise<ChartData> {
  const pipeline = new TransformPipeline<RawMetric[]>()
    .pipe(transformers.aggregateByInterval(30))
    .pipe(transformers.formatAggregatedForChart());

  return await pipeline.execute(metrics);
}

// This JSON is sent to Swift app
// Swift decodes it into Codable structs
```

### Android App: Kotlin + TypeScript
```typescript
// Generate chart config for Android
// Kotlin uses kotlinx.serialization to decode
export async function getAndroidChartData(
  startTime: Date,
  endTime: Date
): Promise<ChartData> {
  const metrics = await fetchMetrics();
  
  const pipeline = new TransformPipeline<RawMetric[]>()
    .pipe(transformers.filterByTimeRange(startTime, endTime))
    .pipe(transformers.sampleMetrics(100))
    .pipe(transformers.formatForChart());

  return await pipeline.execute(metrics);
}
```

---

## Testing Strategy

### Unit Tests: Individual Transformers
```typescript
describe('transformers', () => {
  it('should filter by time range', () => {
    const start = new Date('2025-01-01');
    const end = new Date('2025-01-02');
    
    const transformer = transformers.filterByTimeRange(start, end);
    const result = transformer(testMetrics);
    
    expect(result.length).toBeLessThan(testMetrics.length);
    result.forEach(metric => {
      expect(metric.timestamp.getTime()).toBeGreaterThanOrEqual(start.getTime());
      expect(metric.timestamp.getTime()).toBeLessThanOrEqual(end.getTime());
    });
  });
});
```

### Integration Tests: Full Pipelines
```typescript
describe('TransformPipeline', () => {
  it('should execute complete transformation', async () => {
    const pipeline = new TransformPipeline<RawMetric[]>()
      .pipe(transformers.filterByName(['loss']))
      .pipe(transformers.sampleMetrics(10))
      .pipe(transformers.formatForChart());

    const result = await pipeline.execute(generateTestMetrics(100));
    
    expect(result.type).toBe('line');
    expect(result.series.length).toBe(1);
    expect(result.series[0].data.length).toBeLessThanOrEqual(10);
  });
});
```

### Error Handling Tests
```typescript
it('should handle errors with context', async () => {
  const pipeline = new TransformPipeline<RawMetric[]>()
    .pipe(() => { throw new Error('Test error'); });

  await expect(pipeline.execute([])).rejects.toThrow(
    'Pipeline execution failed at step 1: Test error'
  );
});
```

---

## Performance Considerations

### 1. **Sampling Early**
```typescript
// ❌ Bad: Transform all data, then sample
const bad = new TransformPipeline<RawMetric[]>()
  .pipe(transformers.aggregateByInterval(60))    // Process 10,000 points
  .pipe(transformers.movingAverage(5))           // Process 10,000 points
  .pipe(transformers.sampleMetrics(100));        // Finally reduce

// ✅ Good: Sample early, transform less
const good = new TransformPipeline<RawMetric[]>()
  .pipe(transformers.sampleMetrics(100))         // Reduce to 100 points
  .pipe(transformers.aggregateByInterval(60))    // Process 100 points
  .pipe(transformers.movingAverage(5));          // Process 100 points
```

### 2. **Mobile-Specific Optimizations**
```typescript
const MOBILE_MAX_POINTS = 100;
const MOBILE_AGGREGATE_MINUTES = 30;

const mobilePipeline = new TransformPipeline<RawMetric[]>()
  .pipe(transformers.filterByTimeRange(recentDate, now))
  .pipe(transformers.sampleMetrics(MOBILE_MAX_POINTS))  // Critical for performance
  .pipe(transformers.formatForChart());
```

### 3. **Memory Management**
```typescript
// For large datasets, consider streaming
async function* streamingTransform(metrics: RawMetric[]) {
  const BATCH_SIZE = 100;
  
  for (let i = 0; i < metrics.length; i += BATCH_SIZE) {
    const batch = metrics.slice(i, i + BATCH_SIZE);
    yield await pipeline.execute(batch);
  }
}
```

### 4. **Caching**
```typescript
const cache = new Map<string, ChartData>();

async function getCachedChart(key: string, metrics: RawMetric[]) {
  if (cache.has(key)) {
    return cache.get(key)!;
  }
  
  const result = await pipeline.execute(metrics);
  cache.set(key, result);
  return result;
}
```

---

## Advanced Patterns

### Parallel Pipelines
```typescript
const [lossChart, accuracyChart, learningRateChart] = await Promise.all([
  lossPipeline.execute(metrics),
  accuracyPipeline.execute(metrics),
  lrPipeline.execute(metrics),
]);
```

### Conditional Transformers
```typescript
const pipeline = new TransformPipeline<RawMetric[]>()
  .pipe(transformers.filterByName(['loss']))
  .pipe(isMobile ? transformers.sampleMetrics(50) : (x) => x)
  .pipe(transformers.formatForChart());
```

### Pipeline Composition
```typescript
// Create reusable pipeline segments
const mobileOptimization = (p: TransformPipeline<RawMetric[]>) =>
  p.pipe(transformers.sampleMetrics(100))
   .pipe(transformers.movingAverage(3));

// Compose pipelines
const pipeline = mobileOptimization(
  new TransformPipeline<RawMetric[]>()
    .pipe(transformers.filterByTimeRange(start, end))
).pipe(transformers.formatForChart());
```

---

## Common Pitfalls & Solutions

### Pitfall 1: Type Inference Issues
```typescript
// ❌ Problem: TypeScript can't infer final type
const pipeline = new TransformPipeline<RawMetric[], ChartData>()
  .pipe(transformers.filterByTimeRange(start, end));  // Error!

// ✅ Solution: Start with input type only
const pipeline = new TransformPipeline<RawMetric[]>()
  .pipe(transformers.filterByTimeRange(start, end))
  .pipe(transformers.formatForChart());
```

### Pitfall 2: Forgetting Async
```typescript
// ❌ Problem: Not awaiting async pipeline
const result = pipeline.execute(metrics);  // Returns Promise!

// ✅ Solution: Always await
const result = await pipeline.execute(metrics);
```

### Pitfall 3: Mutating Data
```typescript
// ❌ Bad: Mutating input
const transformer = (metrics: RawMetric[]) => {
  metrics.sort(...);  // Mutates original!
  return metrics;
};

// ✅ Good: Create new array
const transformer = (metrics: RawMetric[]) => {
  return [...metrics].sort(...);  // Copies first
};
```

---

## Interview Discussion Points

### What to Highlight

1. **Type Safety**
   - "The pipeline maintains type safety through TypeScript generics"
   - "Each pipe() call updates the output type automatically"

2. **Composability**
   - "Transformers are pure functions that can be combined in any order"
   - "We can reuse transformers across different pipelines"

3. **Async Handling**
   - "The pipeline transparently handles both sync and async transformers"
   - "This allows for API enrichment without changing the pipeline structure"

4. **Mobile Optimization**
   - "Sampling and aggregation reduce data points for mobile performance"
   - "We balance data fidelity with rendering speed"

5. **Real-World Application**
   - "This pattern bridges backend TypeScript and mobile native code"
   - "JSON becomes the contract between systems"

### Questions You Might Get

**Q: Why not just chain promises?**
A: Pipelines provide structure, type safety, error context, and reusability that raw promise chains don't.

**Q: How would you handle errors in production?**
A: Add logging, retry logic, and fallback transformers. Could implement a `pipeWithRetry()` method.

**Q: How does this scale to large datasets?**
A: Sample early, use streaming for very large datasets, implement caching, consider web workers for heavy computation.

**Q: How would you test this?**
A: Unit test each transformer, integration test full pipelines, property-based testing for transformer combinations.

---

## Conclusion

This pipeline pattern demonstrates:
- ✅ Advanced TypeScript (generics, type inference)
- ✅ Functional programming principles
- ✅ Mobile optimization awareness
- ✅ Real-world applicability
- ✅ Maintainable, testable code
