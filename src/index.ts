import { parseMetrics, testData } from './problems/problem1';

console.log('🚀 Mobile JSON Practice Environment');
console.log('=====================================\n');

console.log('Testing Problem 1: Metric Parser');
try {
  const result = parseMetrics(testData);
  console.log('Result:', JSON.stringify(result, null, 2));
} catch (error) {
  console.log('Error:', error);
}

console.log('\n✅ Environment is working!');
console.log('📝 Start solving problems in src/problems/');