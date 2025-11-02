
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

// Main execution wrapper
async function main() {
  await testApiClient();
  testSchemaValidator();

  console.log('\n\n✅ All tests complete!');
  console.log('📝 Check out the problems in src/problems/');
}

// Run main function
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});