import { parseMetrics, testData } from './problems/problem1';
import { ComponentRenderer, testConfig } from './problems/problem2';

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
  console.log('\nResult:', JSON.stringify(result, null, 2));
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
  
  console.log('\n📊 Component Breakdown:');
  result.components.forEach((comp, index) => {
    if (comp.isValid) {
      console.log(`  ${index + 1}. ✅ ${comp.component.type}${comp.component.id ? ` (id: ${comp.component.id})` : ''}`);
    } else {
      console.log(`  ${index + 1}. ❌ ${comp.type} - ${comp.error}`);
    }
  });
  
  if (result.errors.length > 0) {
    console.log('\n🚨 Errors:');
    result.errors.forEach((error, index) => {
      console.log(`  ${index + 1}. ${error}`);
    });
  }
  
  console.log('\n📄 Full Result:', JSON.stringify(result, null, 2));
} catch (error) {
  console.log('Error:', error);
}

console.log('\n✅ Environment is working!');
console.log('📝 Start solving problems in src/problems/');