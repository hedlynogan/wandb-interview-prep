import { parseMetrics, testData } from './problems/problem1';
import { ComponentRenderer, testConfig } from './problems/problem2';
import { ApiClient } from './problems/problem3';
import {
  validateDashboardConfig,
  validateMetric,
  validateAndMigrateDashboard,
  testDashboardData,
  testInvalidDashboardData,
  testMetricData,
  testOldVersionData
} from './problems/problem4';
import {
  TransformPipeline,
  transformers,
  generateSampleMetrics,
  examplePipeline1,
  examplePipeline2,
  examplePipeline3,
  examplePipeline4,
  type RawMetric
} from './problems/problem5';

console.log('🚀 Mobile JSON Practice Environment');
console.log('=====================================\n');

// ============================================
// PROBLEM 1: Metric Parser
// ============================================
console.log('Testing Problem 1: Metric Parser');
console.log('------------------------------------');
try {
  const result = parseMetrics(testData);
  console.log('✅ Valid Metrics:', result.valid.length);
  console.log('❌ Errors:', result.errors.length);
} catch (error) {
  console.log('Error:', error);
}

// ============================================
// PROBLEM 2: Component Renderer
// ============================================
console.log('\n\nTesting Problem 2: Component Renderer');
console.log('------------------------------------');
try {
  const renderer = new ComponentRenderer();
  const result = renderer.render(testConfig);

  console.log('📱 Screen:', result.screen);
  console.log('✅ Valid Components:', result.components.filter(c => c.isValid).length);
  console.log('❌ Invalid/Unknown Components:', result.components.filter(c => !c.isValid).length);
} catch (error) {
  console.log('Error:', error);
}

// ============================================
// PROBLEM 3: API Client
// ============================================
console.log('\n\nTesting Problem 3: API Client');
console.log('------------------------------------');

async function testApiClient() {
  try {
    const client = new ApiClient('https://api.coreweave.com');

    console.log('📋 Testing API Client...');
    const listResponse = await client.getExperiments(1);

    if (listResponse.success) {
      console.log(`✅ Success! Found ${listResponse.data.total} experiments`);
    } else {
      console.log(`❌ Error: ${listResponse.error.message}`);
    }
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// ============================================
// PROBLEM 4: Schema Validator with Zod
// ============================================
console.log('\n\nTesting Problem 4: Schema Validator with Zod');
console.log('------------------------------------');

function testSchemaValidator() {
  // Test 1: Valid dashboard config
  console.log('\n📋 Test 1: Validate Valid Dashboard Config');
  const validResult = validateDashboardConfig(testDashboardData);

  if (validResult.success) {
    console.log('✅ Validation passed!');
    console.log(`   Version: ${validResult.data.version}`);
    console.log(`   Layout: ${validResult.data.layout}`);
    console.log(`   Theme: ${validResult.data.theme}`);
    console.log(`   Widgets: ${validResult.data.widgets.length}`);
  } else {
    console.log('❌ Validation failed:', validResult.errors);
  }

  // Test 2: Invalid dashboard config
  console.log('\n\n⚠️  Test 2: Validate Invalid Dashboard Config');
  const invalidResult = validateDashboardConfig(testInvalidDashboardData);

  if (!invalidResult.success) {
    console.log('❌ Expected validation errors:');
    invalidResult.errors.forEach((error, index) => {
      console.log(`   ${index + 1}. ${error}`);
    });
  } else {
    console.log('Unexpected: Validation passed');
  }

  // Test 3: Single metric validation
  console.log('\n\n📊 Test 3: Validate Single Metric');
  const metricResult = validateMetric(testMetricData);

  if (metricResult.success) {
    console.log('✅ Metric validation passed!');
    console.log(`   Name: ${metricResult.data.name}`);
    console.log(`   Value: ${metricResult.data.value}${metricResult.data.unit || ''}`);
    console.log(`   Timestamp: ${metricResult.data.timestamp}`);
    if (metricResult.data.tags) {
      console.log(`   Tags: ${metricResult.data.tags.join(', ')}`);
    }
  } else {
    console.log('❌ Validation failed:', metricResult.errors);
  }

  // Test 4: Schema migration
  console.log('\n\n🔄 Test 4: Schema Migration (v0.9 → v1.0)');
  const migratedResult = validateAndMigrateDashboard(testOldVersionData);

  if (migratedResult.success) {
    console.log('✅ Migration successful!');
    console.log(`   Original version: 0.9`);
    console.log(`   Migrated version: ${migratedResult.data.version}`);
    console.log(`   Layout: ${migratedResult.data.layout} (migrated from 'type' field)`);
    console.log(`   Theme: ${migratedResult.data.theme} (default added)`);
  } else {
    console.log('❌ Migration failed:', migratedResult.errors);
  }
}

// ============================================
// PROBLEM 5: Data Transformer Pipeline
// ============================================
console.log('\n\nTesting Problem 5: Data Transformer Pipeline');
console.log('------------------------------------');

async function testTransformPipeline() {
  // Test 1: Basic filtering and formatting
  console.log('\n📊 Test 1: Basic Filtering and Chart Formatting');
  try {
    const result1 = await examplePipeline1();
    console.log(`✅ Generated chart with ${result1.series.length} series`);
    console.log(`   Chart type: ${result1.type}`);
    console.log(`   Title: ${result1.title}`);
    const totalPoints = result1.series.reduce((sum, s) => sum + s.data.length, 0);
    console.log(`   Total data points: ${totalPoints}`);
    console.log(`   Series names: ${result1.series.map(s => s.name).join(', ')}`);
  } catch (error) {
    console.log('❌ Error:', error);
  }

  // Test 2: Aggregation pipeline
  console.log('\n\n⏰ Test 2: Time-based Aggregation');
  try {
    const result2 = await examplePipeline2();
    console.log(`✅ Generated aggregated chart`);
    console.log(`   Chart type: ${result2.type}`);
    console.log(`   Series: ${result2.series.map(s => s.name).join(', ')}`);
    result2.series.forEach(series => {
      console.log(`   ${series.name}: ${series.data.length} data points`);
    });
  } catch (error) {
    console.log('❌ Error:', error);
  }

  // Test 3: Async transformation with smoothing
  console.log('\n\n🔄 Test 3: Async Enrichment + Moving Average');
  try {
    const result3 = await examplePipeline3();
    console.log(`✅ Generated smoothed chart`);
    console.log(`   Chart type: ${result3.type}`);
    console.log(`   Title: ${result3.title}`);
    console.log(`   Data has been enriched and smoothed`);
  } catch (error) {
    console.log('❌ Error:', error);
  }

  // Test 4: Custom inline transformer
  console.log('\n\n🧮 Test 4: Custom Transformer (Calculate Average)');
  try {
    const avgLoss = await examplePipeline4();
    console.log(`✅ Average loss calculated: ${avgLoss.toFixed(4)}`);
  } catch (error) {
    console.log('❌ Error:', error);
  }

  // Test 5: Custom pipeline demonstration
  console.log('\n\n🎯 Test 5: Custom Pipeline for Mobile Optimization');
  try {
    const start = new Date('2025-01-01');
    const end = new Date('2025-01-01T12:00:00');

    const mobilePipeline = new TransformPipeline<RawMetric[]>()
      .pipe(transformers.filterByTimeRange(start, end))
      .pipe(transformers.filterByName(['accuracy']))
      .pipe(transformers.sampleMetrics(20)) // Reduce to 20 points for mobile
      .pipe(transformers.formatForChart({
        chartType: 'line',
        title: 'Model Accuracy (Mobile Optimized)',
        color: '#10b981'
      }));

    const metrics = generateSampleMetrics(500);
    const result = await mobilePipeline.execute(metrics);

    console.log(`✅ Mobile-optimized chart created`);
    console.log(`   Original metrics: 500`);
    console.log(`   After filtering: reduced to time range`);
    console.log(`   Final data points: ${result.series[0].data.length}`);
    console.log(`   Chart optimized for mobile rendering`);
  } catch (error) {
    console.log('❌ Error:', error);
  }

  // Test 6: Error handling
  console.log('\n\n⚠️  Test 6: Error Handling in Pipeline');
  try {
    const errorPipeline = new TransformPipeline<RawMetric[]>()
      .pipe(transformers.filterByName(['loss']))
      .pipe((metrics: RawMetric[]) => {
        throw new Error('Simulated pipeline error');
      });

    await errorPipeline.execute(generateSampleMetrics());
    console.log('❌ Error should have been thrown');
  } catch (error) {
    if (error instanceof Error) {
      console.log(`✅ Error properly caught: "${error.message}"`);
    }
  }

  // Test 7: Pipeline composition
  console.log('\n\n🔗 Test 7: Complex Pipeline Composition');
  try {
    const complexPipeline = new TransformPipeline<RawMetric[]>()
      .pipe(transformers.filterByName(['loss', 'accuracy']))
      .pipe(transformers.enrichWithMetadata()) // Async
      .pipe(transformers.movingAverage(3)) // Smooth with 3-point window
      .pipe(transformers.aggregateByInterval(30)) // 30-minute buckets
      .pipe(transformers.formatAggregatedForChart({
        chartType: 'bar',
        title: 'Smoothed & Aggregated Training Metrics',
        useAverage: true
      }));

    const result = await complexPipeline.execute(generateSampleMetrics(100));
    console.log(`✅ Complex pipeline executed successfully`);
    console.log(`   Pipeline length: ${complexPipeline.length} transformers`);
    console.log(`   Chart created with ${result.series.length} series`);
    console.log(`   Operations: filter → enrich → smooth → aggregate → format`);
  } catch (error) {
    console.log('❌ Error:', error);
  }
}

// Main execution wrapper
async function main() {
  await testApiClient();
  testSchemaValidator();
  await testTransformPipeline();

  console.log('\n\n🎉 All tests complete!');
  console.log('=====================================');
  console.log('📝 Problems solved:');
  console.log('   ✅ Problem 1: Metric Parser');
  console.log('   ✅ Problem 2: Component Renderer');
  console.log('   ✅ Problem 3: Type-Safe API Client');
  console.log('   ✅ Problem 4: Schema Validator with Zod');
  console.log('   ✅ Problem 5: Data Transformer Pipeline');
  console.log('\n💡 Check out the problems in src/problems/');
  console.log('🚀 Ready for your interview!');
}

// Run main function
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});