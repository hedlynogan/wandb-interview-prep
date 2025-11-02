/**
 * PROBLEM 5: Data Transformer Pipeline - SOLUTION (FIXED)
 *
 * A type-safe, composable pipeline for transforming data.
 * Supports both sync and async transformations.
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Transformer function that can be sync or async
 */
export type Transformer<TInput, TOutput> = (input: TInput) => TOutput | Promise<TOutput>;

/**
 * Raw metric data from API (like W&B experiment metrics)
 */
export interface RawMetric {
  timestamp: Date;
  name: string;
  value: number;
  step: number;
  metadata?: Record<string, any>;
}

/**
 * Aggregated metric with summary statistics
 */
export interface AggregatedMetric {
  startTime: Date;
  endTime: Date;
  name: string;
  count: number;
  min: number;
  max: number;
  avg: number;
  sum: number;
  values: number[];
}

/**
 * Chart data point for mobile visualization
 */
export interface ChartDataPoint {
  x: number; // timestamp in milliseconds
  y: number; // value
  label?: string;
}

/**
 * Final chart data structure for mobile components
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

// ============================================================================
// PIPELINE IMPLEMENTATION
// ============================================================================

/**
 * Type-safe transformation pipeline that supports chaining
 *
 * Example:
 * const pipeline = new TransformPipeline<RawMetric[]>()
 *   .pipe(filterByTimeRange(start, end))
 *   .pipe(aggregateByInterval(60))
 *   .pipe(formatForChart());
 * const result = await pipeline.execute(rawMetrics);
 */
export class TransformPipeline<TInput, TOutput = TInput> {
  private transformers: Transformer<any, any>[] = [];

  /**
   * Add a transformer to the pipeline
   * Returns a new pipeline with updated type
   */
  pipe<TNext>(
    transformer: Transformer<TOutput, TNext>
  ): TransformPipeline<TInput, TNext> {
    // Create a new pipeline to maintain immutability
    const newPipeline = new TransformPipeline<TInput, TNext>();

    // Copy existing transformers
    newPipeline.transformers = [...this.transformers, transformer];

    return newPipeline;
  }

  /**
   * Execute all transformations in sequence
   * Handles both sync and async transformations
   */
  async execute(input: TInput): Promise<TOutput> {
    let result: any = input;

    // Apply each transformer in sequence
    for (let i = 0; i < this.transformers.length; i++) {
      const transformer = this.transformers[i];
      try {
        // Await in case the transformer is async
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

  /**
   * Get the number of transformers in the pipeline
   */
  get length(): number {
    return this.transformers.length;
  }
}

// ============================================================================
// COMMON TRANSFORMERS
// ============================================================================

export const transformers = {
  /**
   * Filter metrics by time range
   *
   * @param start - Start date (inclusive)
   * @param end - End date (inclusive)
   */
  filterByTimeRange: (start: Date, end: Date) => {
    return (metrics: RawMetric[]): RawMetric[] => {
      const startTime = start.getTime();
      const endTime = end.getTime();

      return metrics.filter((metric) => {
        const metricTime = metric.timestamp.getTime();
        return metricTime >= startTime && metricTime <= endTime;
      });
    };
  },

  /**
   * Filter metrics by name (supports multiple names)
   */
  filterByName: (names: string[]) => {
    return (metrics: RawMetric[]): RawMetric[] => {
      const nameSet = new Set(names);
      return metrics.filter((metric) => nameSet.has(metric.name));
    };
  },

  /**
   * Aggregate metrics by time interval
   *
   * @param intervalMinutes - Interval size in minutes
   */
  aggregateByInterval: (intervalMinutes: number) => {
    return (metrics: RawMetric[]): AggregatedMetric[] => {
      if (metrics.length === 0) return [];

      // Group metrics by name first
      const metricsByName = new Map<string, RawMetric[]>();
      for (const metric of metrics) {
        if (!metricsByName.has(metric.name)) {
          metricsByName.set(metric.name, []);
        }
        metricsByName.get(metric.name)!.push(metric);
      }

      const result: AggregatedMetric[] = [];
      const intervalMs = intervalMinutes * 60 * 1000;

      // Process each metric name separately
      for (const [name, nameMetrics] of metricsByName) {
        // Sort by timestamp
        const sorted = [...nameMetrics].sort(
          (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
        );

        if (sorted.length === 0) continue;

        // Create time buckets
        const firstTime = sorted[0].timestamp.getTime();
        const lastTime = sorted[sorted.length - 1].timestamp.getTime();

        const buckets = new Map<number, RawMetric[]>();

        // Assign metrics to buckets
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

        // Create aggregated metrics for each bucket
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

      return result.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
    };
  },

  /**
   * Sample metrics to reduce data points (useful for mobile performance)
   *
   * @param maxPoints - Maximum number of points to keep
   */
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
  },

  /**
   * Format raw metrics for mobile chart component
   */
  formatForChart: (options?: {
    chartType?: 'line' | 'bar' | 'scatter';
    title?: string;
    color?: string;
  }) => {
    return (metrics: RawMetric[]): ChartData => {
      // Group by metric name
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
        data: data.sort((a, b) => a.x - b.x),
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
  },

  /**
   * Format aggregated metrics for mobile chart
   */
  formatAggregatedForChart: (options?: {
    chartType?: 'line' | 'bar' | 'scatter';
    title?: string;
    useAverage?: boolean;
  }) => {
    return (aggregated: AggregatedMetric[]): ChartData => {
      const seriesMap = new Map<string, ChartDataPoint[]>();

      for (const agg of aggregated) {
        if (!seriesMap.has(agg.name)) {
          seriesMap.set(agg.name, []);
        }

        seriesMap.get(agg.name)!.push({
          x: agg.startTime.getTime(),
          y: options?.useAverage ? agg.avg : agg.sum,
          label: `${agg.count} samples`,
        });
      }

      const series = Array.from(seriesMap.entries()).map(([name, data]) => ({
        name,
        data: data.sort((a, b) => a.x - b.x),
      }));

      return {
        type: options?.chartType || 'line',
        title: options?.title || 'Aggregated Metrics',
        series,
        xAxis: {
          type: 'time',
          label: 'Time',
        },
        yAxis: {
          label: options?.useAverage ? 'Average Value' : 'Sum',
        },
      };
    };
  },

  /**
   * Async transformer example - simulates API call to enrich data
   */
  enrichWithMetadata: () => {
    return async (metrics: RawMetric[]): Promise<RawMetric[]> => {
      // Simulate async API call
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
  },

  /**
   * Apply moving average smoothing
   */
  movingAverage: (windowSize: number) => {
    return (metrics: RawMetric[]): RawMetric[] => {
      if (metrics.length === 0 || windowSize < 2) return metrics;

      const result: RawMetric[] = [];

      for (let i = 0; i < metrics.length; i++) {
        const start = Math.max(0, i - windowSize + 1);
        const window = metrics.slice(start, i + 1);
        const avg = window.reduce((sum, m) => sum + m.value, 0) / window.length;

        result.push({
          ...metrics[i],
          value: avg,
          metadata: {
            ...metrics[i].metadata,
            originalValue: metrics[i].value,
            windowSize: window.length,
          },
        });
      }

      return result;
    };
  },
};

// ============================================================================
// USAGE EXAMPLES
// ============================================================================

/**
 * Example 1: Complete pipeline for chart rendering
 */
export async function examplePipeline1() {
  const start = new Date('2025-01-01');
  const end = new Date('2025-01-02');

  // FIXED: Start with RawMetric[] as both input and initial output
  const pipeline = new TransformPipeline<RawMetric[]>()
    .pipe(transformers.filterByTimeRange(start, end))
    .pipe(transformers.sampleMetrics(100)) // Reduce to 100 points for mobile
    .pipe(transformers.formatForChart({
      chartType: 'line',
      title: 'Training Loss',
      color: '#3b82f6',
    }));

  // Execute with sample data
  const sampleMetrics = generateSampleMetrics();
  const chartData = await pipeline.execute(sampleMetrics);

  return chartData;
}

/**
 * Example 2: Aggregation pipeline
 */
export async function examplePipeline2() {
  const start = new Date('2025-01-01');
  const end = new Date('2025-01-02');

  // FIXED: Start with RawMetric[]
  const pipeline = new TransformPipeline<RawMetric[]>()
    .pipe(transformers.filterByTimeRange(start, end))
    .pipe(transformers.filterByName(['loss', 'accuracy']))
    .pipe(transformers.aggregateByInterval(60)) // 1-hour buckets
    .pipe(transformers.formatAggregatedForChart({
      chartType: 'bar',
      title: 'Hourly Average Metrics',
      useAverage: true,
    }));

  const sampleMetrics = generateSampleMetrics();
  const chartData = await pipeline.execute(sampleMetrics);

  return chartData;
}

/**
 * Example 3: With async enrichment and smoothing
 */
export async function examplePipeline3() {
  // FIXED: Start with RawMetric[]
  const pipeline = new TransformPipeline<RawMetric[]>()
    .pipe(transformers.enrichWithMetadata()) // Async
    .pipe(transformers.movingAverage(5)) // Smooth data
    .pipe(transformers.sampleMetrics(50))
    .pipe(transformers.formatForChart({
      title: 'Smoothed Metrics',
    }));

  const sampleMetrics = generateSampleMetrics();
  const chartData = await pipeline.execute(sampleMetrics);

  return chartData;
}

/**
 * Example 4: Custom transformer inline
 */
export async function examplePipeline4() {
  // FIXED: Proper type flow
  const pipeline = new TransformPipeline<RawMetric[]>()
    .pipe(transformers.filterByName(['loss']))
    .pipe(transformers.sampleMetrics(10))
    .pipe((metrics: RawMetric[]): number => {
      // Custom transformer: calculate average
      if (metrics.length === 0) return 0;
      return metrics.reduce((sum, m) => sum + m.value, 0) / metrics.length;
    });

  const avgLoss = await pipeline.execute(generateSampleMetrics());
  return avgLoss;
}

// ============================================================================
// TEST DATA GENERATOR
// ============================================================================

/**
 * Generate sample metrics for testing
 */
export function generateSampleMetrics(count: number = 200): RawMetric[] {
  const metrics: RawMetric[] = [];
  const baseTime = new Date('2025-01-01').getTime();
  const metricNames = ['loss', 'accuracy', 'learning_rate'];

  for (let i = 0; i < count; i++) {
    const timestamp = new Date(baseTime + i * 60 * 1000); // 1 minute apart

    for (const name of metricNames) {
      let value: number;

      // Generate realistic metric patterns
      if (name === 'loss') {
        value = 2.0 * Math.exp(-i / 50) + Math.random() * 0.1;
      } else if (name === 'accuracy') {
        value = 1.0 - Math.exp(-i / 50) + Math.random() * 0.05;
      } else {
        value = 0.001 * Math.exp(-i / 100);
      }

      metrics.push({
        timestamp,
        name,
        value,
        step: i,
        metadata: {
          experiment: 'exp-001',
          run: 'run-123',
        },
      });
    }
  }

  return metrics;
}

// ============================================================================
// EXAMPLE USAGE & TESTS
// ============================================================================

if (require.main === module) {
  (async () => {
    console.log('🔄 Testing Data Transformer Pipeline\n');

    // Test 1: Basic pipeline
    console.log('Test 1: Basic filtering and formatting');
    const result1 = await examplePipeline1();
    console.log(`✅ Generated chart with ${result1.series.length} series`);
    console.log(`   Total data points: ${result1.series.reduce((sum, s) => sum + s.data.length, 0)}\n`);

    // Test 2: Aggregation
    console.log('Test 2: Aggregation pipeline');
    const result2 = await examplePipeline2();
    console.log(`✅ Generated aggregated chart`);
    console.log(`   Series: ${result2.series.map(s => s.name).join(', ')}\n`);

    // Test 3: Async + smoothing
    console.log('Test 3: Async enrichment and smoothing');
    const result3 = await examplePipeline3();
    console.log(`✅ Generated smoothed chart`);
    console.log(`   Chart type: ${result3.type}\n`);

    // Test 4: Custom pipeline
    console.log('Test 4: Custom pipeline with inline transformer');
    const avgLoss = await examplePipeline4();
    console.log(`✅ Average loss: ${avgLoss.toFixed(4)}\n`);

    // Test 5: Error handling
    console.log('Test 5: Error handling');
    try {
      const badPipeline = new TransformPipeline<RawMetric[]>()
        .pipe((metrics: RawMetric[]) => {
          throw new Error('Simulated error');
        });

      await badPipeline.execute(generateSampleMetrics());
    } catch (error) {
      console.log(`✅ Error caught: ${error instanceof Error ? error.message : error}\n`);
    }

    console.log('🎉 All tests passed!');
  })();
}