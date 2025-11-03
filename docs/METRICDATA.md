# Metric Data Parser Implementation Guide

## Overview

This document explains the implementation of a robust JSON parser for validating and transforming API metric data in TypeScript. This pattern is essential for mobile applications that consume data from backend APIs where data quality cannot be guaranteed.

## Table of Contents

1. [The Problem](#the-problem)
2. [Solution Architecture](#solution-architecture)
3. [Implementation Steps](#implementation-steps)
4. [Design Patterns & Decisions](#design-patterns--decisions)
5. [Real-World Applications](#real-world-applications)
6. [Error Handling Strategies](#error-handling-strategies)
7. [Testing Approaches](#testing-approaches)
8. [Common Pitfalls](#common-pitfalls)

---

## The Problem

### Context

Mobile applications consuming data from APIs face several challenges:

1. **Unreliable Data Sources**
   - Backend APIs may return malformed data
   - Data types may not match expected formats
   - Required fields may be missing
   - Dates/timestamps may be in various formats

2. **Type Safety Requirements**
   - TypeScript provides compile-time safety
   - Runtime data needs validation
   - Need to bridge the gap between "unknown" JSON and typed data

3. **User Experience**
   - Invalid data shouldn't crash the app
   - Partial data should be usable
   - Errors need clear context for debugging

### Example Scenario: GPU Monitoring Dashboard

Imagine a mobile app displaying GPU metrics from a CoreWeave/W&B backend:
```json
[
  { "id": "gpu-1", "name": "GPU Utilization", "value": 85.5, "timestamp": "2025-10-27T10:00:00Z" },
  { "id": "gpu-2", "name": "GPU Temperature", "value": "75", "timestamp": "invalid-date" },
  { "id": "gpu-3", "value": 90.0 },
  { "id": "gpu-4", "name": "GPU Memory", "value": 12.5, "timestamp": "2025-10-27T10:00:00Z", "unit": "GB" }
]
```

**Problems:**
- Item 0: ✅ Valid
- Item 1: ❌ Invalid timestamp format
- Item 2: ❌ Missing required `name` field
- Item 3: ✅ Valid (with optional `unit` field)

**Goal:** Parse this data gracefully, showing valid metrics while logging errors for debugging.

---

## Solution Architecture

### High-Level Flow
```
Unknown JSON Data (from API)
         ↓
    Type Guard (is it an object?)
         ↓
    Field Validation
    - Required fields present?
    - Correct types?
    - Valid formats?
         ↓
    Type Conversion
    - String numbers → numbers
    - Validate timestamps
         ↓
    Result Separation
    - Valid items → valid[]
    - Invalid items → errors[]
         ↓
    Return ParseResult
```

### Data Structures
```typescript
// The validated metric data structure
interface MetricData {
  id: string;           // Unique identifier
  name: string;         // Metric name (e.g., "GPU Utilization")
  value: number;        // The numeric value
  timestamp: string;    // ISO 8601 timestamp
  unit?: string;        // Optional unit (e.g., "GB", "%", "°C")
}

// Error information with context
interface ParseError {
  index: number;        // Which item in the array failed
  reason: string;       // Human-readable error message
}

// The result of parsing
interface ParseResult {
  valid: MetricData[];    // Successfully parsed items
  errors: ParseError[];   // Items that failed validation
}
```

**Design Decisions:**

1. **`unit` as optional**: Not all metrics have units (e.g., accuracy is unitless)
2. **`timestamp` as string**: Keep original format for consistency; conversion to Date happens elsewhere
3. **Separate arrays**: Valid and invalid items don't interfere with each other
4. **Index tracking**: Errors include the original array index for debugging

---

## Implementation Steps

### Step 1: Define Type Interfaces
```typescript
interface MetricData {
  id: string;
  name: string;
  value: number;
  timestamp: string;
  unit?: string;  // Optional: String? in Swift/Kotlin, str | None in Python
}

interface ParseError {
  index: number;
  reason: string;
}

interface ParseResult {
  valid: MetricData[];
  errors: ParseError[];
}
```

**Why separate interfaces?**
- Clear contract for consumers
- Easy to extend
- Self-documenting
- Better IDE support

---

### Step 2: Create Helper Functions

#### 2.1: Number Validation
```typescript
/**
 * Check if value is a valid number or numeric string
 * 
 * Handles:
 * - Pure numbers: 85.5
 * - Numeric strings: "75"
 * - Invalid: NaN, undefined, null, "abc"
 */
function isValidNumber(value: unknown): boolean {
  // Case 1: Already a number
  if (typeof value === 'number' && !isNaN(value)) {
    return true;
  }
  
  // Case 2: String that can be converted to number
  if (typeof value === 'string') {
    const num = Number(value);
    return !isNaN(num);
  }
  
  return false;
}
```

**Why this matters:**
- APIs sometimes return numbers as strings (JSON stringification issues)
- Need to handle both gracefully
- `isNaN()` check prevents `NaN` from being valid

#### 2.2: Number Conversion
```typescript
/**
 * Convert value to number (handles string numbers)
 * 
 * Assumes value has already been validated with isValidNumber()
 */
function toNumber(value: unknown): number {
  if (typeof value === 'number') {
    return value;
  }
  return Number(value);
}
```

**Pattern:** Separate validation from conversion
- Validation: Returns boolean (is this convertible?)
- Conversion: Returns number (assumes already validated)
- Clean separation of concerns

#### 2.3: Timestamp Validation
```typescript
/**
 * Validate ISO 8601 date format
 * 
 * Valid examples:
 * - "2025-10-27T10:00:00Z"
 * - "2025-10-27T10:00:00.000Z"
 * - "2025-10-27T10:00:00+00:00"
 * 
 * Invalid examples:
 * - "invalid-date"
 * - "2025-10-27" (missing time component)
 * - 1635331200 (unix timestamp)
 */
function isValidTimestamp(timestamp: unknown): boolean {
  // Must be a string
  if (typeof timestamp !== 'string') {
    return false;
  }
  
  // Try to parse as date
  const date = new Date(timestamp);
  
  // Check if parsing succeeded AND string contains 'T' (ISO 8601 format)
  return !isNaN(date.getTime()) && timestamp.includes('T');
}
```

**Why check for 'T'?**
- Ensures ISO 8601 format (YYYY-MM-DDTHH:mm:ss)
- Rejects simple dates like "2025-10-27" (no time component)
- Maintains consistency with mobile date parsing

---

### Step 3: Implement Main Parser Function
```typescript
export function parseMetrics(jsonData: unknown[]): ParseResult {
  const valid: MetricData[] = [];
  const errors: ParseError[] = [];

  // Process each item with index tracking
  jsonData.forEach((item, index) => {
    // Validation Step 1: Type guard
    if (typeof item !== 'object' || item === null) {
      errors.push({
        index,
        reason: 'Item is not an object'
      });
      return; // Skip to next item
    }

    // Cast to any for property access (we'll validate each property)
    const data = item as any;

    // Validation Step 2: Required field - id
    if (typeof data.id !== 'string' || data.id.trim() === '') {
      errors.push({
        index,
        reason: 'Missing or invalid required field: id'
      });
      return;
    }

    // Validation Step 3: Required field - name
    if (typeof data.name !== 'string' || data.name.trim() === '') {
      errors.push({
        index,
        reason: 'Missing or invalid required field: name'
      });
      return;
    }

    // Validation Step 4: Required field - value
    if (!isValidNumber(data.value)) {
      errors.push({
        index,
        reason: 'Missing or invalid required field: value (must be a number)'
      });
      return;
    }

    // Validation Step 5: Required field - timestamp
    if (!isValidTimestamp(data.timestamp)) {
      errors.push({
        index,
        reason: 'Missing or invalid required field: timestamp (must be valid ISO 8601 format)'
      });
      return;
    }

    // All validations passed - construct typed object
    const metricData: MetricData = {
      id: data.id,
      name: data.name,
      value: toNumber(data.value),  // Convert if needed
      timestamp: data.timestamp
    };

    // Handle optional field - unit
    if (data.unit !== undefined && typeof data.unit === 'string') {
      metricData.unit = data.unit;
    }

    valid.push(metricData);
  });

  return { valid, errors };
}
```

---

## Design Patterns & Decisions

### 1. **Fail-Fast Validation**
```typescript
if (!isValid(field)) {
  errors.push({ index, reason: '...' });
  return; // Stop processing this item immediately
}
```

**Benefits:**
- Clear error messages (first error encountered)
- Efficient (doesn't validate all fields if one fails)
- Easy to debug (one error per item)

**Alternative (Collect All Errors):**
```typescript
const itemErrors = [];
if (!isValid(field1)) itemErrors.push('field1 invalid');
if (!isValid(field2)) itemErrors.push('field2 invalid');
// ... collect all errors before returning
```

**Trade-off:** Fail-fast is simpler; collect-all is more comprehensive.

---

### 2. **Type Guards for Safety**
```typescript
// Check if item is an object
if (typeof item !== 'object' || item === null) {
  // Handle error
}

// Check if field is a string
if (typeof data.id !== 'string') {
  // Handle error
}
```

**Why `|| item === null`?**
- In JavaScript, `typeof null === 'object'` (historical quirk)
- Must explicitly check for null

---

### 3. **String Trimming**
```typescript
if (typeof data.id !== 'string' || data.id.trim() === '') {
  // Invalid
}
```

**Why trim?**
- Catches whitespace-only strings: `"   "` is invalid
- Prevents display issues in UI
- Common API issue: accidental whitespace

---

### 4. **Optional Field Handling**
```typescript
// Don't set unit if it's undefined or not a string
if (data.unit !== undefined && typeof data.unit === 'string') {
  metricData.unit = data.unit;
}
```

**Pattern:** Only set optional fields if they exist AND are valid.

**Anti-pattern:**
```typescript
// ❌ Bad: Sets unit to undefined
metricData.unit = data.unit;

// ❌ Bad: Sets unit even if it's the wrong type
if (data.unit !== undefined) {
  metricData.unit = data.unit; // Could be a number!
}
```

---

### 5. **Error Context**
```typescript
errors.push({
  index,  // Which item failed
  reason: 'Missing or invalid required field: name'  // What went wrong
});
```

**Why include index?**
- Developer can find the bad data in the original array
- Useful for logging and debugging
- Matches the item to error reports in production

---

## Real-World Applications

### Mobile App: Displaying Metrics
```typescript
// React Native Component
const MetricsDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<MetricData[]>([]);
  const [parseErrors, setParseErrors] = useState<ParseError[]>([]);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const response = await fetch('https://api.coreweave.com/metrics');
        const jsonData = await response.json();
        
        // Parse and validate
        const result = parseMetrics(jsonData);
        
        // Set valid metrics for display
        setMetrics(result.valid);
        
        // Log errors for debugging
        if (result.errors.length > 0) {
          console.error('Metric parsing errors:', result.errors);
          // Could also send to error tracking service (Sentry, etc.)
        }
      } catch (error) {
        console.error('Failed to fetch metrics:', error);
      }
    };

    fetchMetrics();
  }, []);

  return (
    <View>
      {metrics.map(metric => (
        <MetricCard key={metric.id} metric={metric} />
      ))}
    </View>
  );
};
```

---

### iOS: Swift Integration

**TypeScript generates data → Swift decodes it**
```typescript
// TypeScript API endpoint
export async function getValidatedMetrics(): Promise<MetricData[]> {
  const rawData = await fetchFromDatabase();
  const parsed = parseMetrics(rawData);
  
  // Only return valid data to mobile app
  return parsed.valid;
}
```
```swift
// Swift side (Codable)
struct MetricData: Codable {
    let id: String
    let name: String
    let value: Double
    let timestamp: String
    let unit: String?
}

// Decode validated JSON
let decoder = JSONDecoder()
let metrics = try decoder.decode([MetricData].self, from: jsonData)
```

**Key Point:** TypeScript validation ensures Swift never receives invalid data!

---

### Android: Kotlin Integration
```kotlin
// Kotlin data class (matches TypeScript interface)
@Serializable
data class MetricData(
    val id: String,
    val name: String,
    val value: Double,
    val timestamp: String,
    val unit: String? = null
)

// Decode from validated JSON
val json = Json { ignoreUnknownKeys = true }
val metrics = json.decodeFromString<List<MetricData>>(jsonString)
```

---

## Error Handling Strategies

### Strategy 1: Fail Silently (Current Implementation)
```typescript
const result = parseMetrics(data);

// Display valid metrics
displayMetrics(result.valid);

// Log errors for developers
console.error('Parse errors:', result.errors);
```

**Pros:**
- App doesn't crash
- Users see partial data
- Developers get error info

**Cons:**
- Users might not know data is incomplete
- Silent failures can be confusing

---

### Strategy 2: Fail Loudly
```typescript
const result = parseMetrics(data);

if (result.errors.length > 0) {
  // Show error to user
  showAlert(`Failed to load ${result.errors.length} metrics`);
}

// Still display valid data
displayMetrics(result.valid);
```

**Pros:**
- User is informed
- Transparency

**Cons:**
- Might alarm users unnecessarily
- Interrupts UX

---

### Strategy 3: Partial Success Notification
```typescript
const result = parseMetrics(data);

if (result.errors.length > 0 && result.valid.length > 0) {
  // Inform user of partial success
  showToast(`Loaded ${result.valid.length} metrics (${result.errors.length} failed)`);
}

displayMetrics(result.valid);
```

**Best of both worlds:**
- User sees data
- User is informed of issues
- Non-intrusive notification

---

### Strategy 4: Retry with Defaults
```typescript
function parseMetricsWithDefaults(data: unknown[]): MetricData[] {
  const result = parseMetrics(data);
  
  // For each error, try to salvage with defaults
  result.errors.forEach(error => {
    const item = data[error.index] as any;
    
    // Provide sensible defaults for missing/invalid fields
    const salvaged: MetricData = {
      id: item?.id || `unknown-${error.index}`,
      name: item?.name || 'Unknown Metric',
      value: isValidNumber(item?.value) ? toNumber(item.value) : 0,
      timestamp: isValidTimestamp(item?.timestamp) 
        ? item.timestamp 
        : new Date().toISOString()
    };
    
    result.valid.push(salvaged);
  });
  
  return result.valid;
}
```

**Use Case:** When showing something is better than showing nothing.

---

## Testing Approaches

### Unit Tests: Individual Helpers
```typescript
describe('isValidNumber', () => {
  it('should accept valid numbers', () => {
    expect(isValidNumber(85.5)).toBe(true);
    expect(isValidNumber(0)).toBe(true);
    expect(isValidNumber(-10)).toBe(true);
  });

  it('should accept numeric strings', () => {
    expect(isValidNumber("75")).toBe(true);
    expect(isValidNumber("0.5")).toBe(true);
  });

  it('should reject invalid values', () => {
    expect(isValidNumber(NaN)).toBe(false);
    expect(isValidNumber("abc")).toBe(false);
    expect(isValidNumber(undefined)).toBe(false);
    expect(isValidNumber(null)).toBe(false);
  });
});

describe('isValidTimestamp', () => {
  it('should accept ISO 8601 format', () => {
    expect(isValidTimestamp("2025-10-27T10:00:00Z")).toBe(true);
    expect(isValidTimestamp("2025-10-27T10:00:00.000Z")).toBe(true);
  });

  it('should reject invalid formats', () => {
    expect(isValidTimestamp("invalid-date")).toBe(false);
    expect(isValidTimestamp("2025-10-27")).toBe(false);
    expect(isValidTimestamp(1635331200)).toBe(false);
  });
});
```

---

### Integration Tests: Full Parser
```typescript
describe('parseMetrics', () => {
  it('should parse all valid metrics', () => {
    const data = [
      { id: "1", name: "Metric 1", value: 10, timestamp: "2025-01-01T00:00:00Z" },
      { id: "2", name: "Metric 2", value: 20, timestamp: "2025-01-01T00:00:00Z" }
    ];

    const result = parseMetrics(data);

    expect(result.valid.length).toBe(2);
    expect(result.errors.length).toBe(0);
  });

  it('should handle numeric strings', () => {
    const data = [
      { id: "1", name: "Metric 1", value: "75", timestamp: "2025-01-01T00:00:00Z" }
    ];

    const result = parseMetrics(data);

    expect(result.valid.length).toBe(1);
    expect(result.valid[0].value).toBe(75);
    expect(typeof result.valid[0].value).toBe('number');
  });

  it('should capture all errors with context', () => {
    const data = [
      { id: "1", value: 10, timestamp: "2025-01-01T00:00:00Z" }, // Missing name
      { id: "2", name: "Metric 2", value: "abc", timestamp: "2025-01-01T00:00:00Z" } // Invalid value
    ];

    const result = parseMetrics(data);

    expect(result.valid.length).toBe(0);
    expect(result.errors.length).toBe(2);
    expect(result.errors[0].index).toBe(0);
    expect(result.errors[0].reason).toContain('name');
    expect(result.errors[1].index).toBe(1);
    expect(result.errors[1].reason).toContain('value');
  });

  it('should handle optional unit field', () => {
    const data = [
      { id: "1", name: "Memory", value: 12.5, timestamp: "2025-01-01T00:00:00Z", unit: "GB" },
      { id: "2", name: "Accuracy", value: 0.95, timestamp: "2025-01-01T00:00:00Z" }
    ];

    const result = parseMetrics(data);

    expect(result.valid[0].unit).toBe("GB");
    expect(result.valid[1].unit).toBeUndefined();
  });
});
```

---

### Edge Case Tests
```typescript
describe('parseMetrics edge cases', () => {
  it('should handle empty array', () => {
    const result = parseMetrics([]);
    expect(result.valid.length).toBe(0);
    expect(result.errors.length).toBe(0);
  });

  it('should handle null items', () => {
    const data = [null, undefined];
    const result = parseMetrics(data as any);
    expect(result.errors.length).toBe(2);
  });

  it('should handle whitespace-only strings', () => {
    const data = [
      { id: "  ", name: "Metric", value: 10, timestamp: "2025-01-01T00:00:00Z" }
    ];
    const result = parseMetrics(data);
    expect(result.errors[0].reason).toContain('id');
  });

  it('should preserve original data in valid results', () => {
    const data = [
      { id: "1", name: "Test", value: 100, timestamp: "2025-01-01T00:00:00Z", extra: "field" }
    ];
    const result = parseMetrics(data);
    
    // Only defined fields should be in result
    expect(result.valid[0]).toEqual({
      id: "1",
      name: "Test",
      value: 100,
      timestamp: "2025-01-01T00:00:00Z"
    });
  });
});
```

---

## Common Pitfalls

### Pitfall 1: Forgetting Null Check
```typescript
// ❌ Bad: typeof null === 'object' in JavaScript!
if (typeof item === 'object') {
  // This will execute for null!
}

// ✅ Good: Explicit null check
if (typeof item === 'object' && item !== null) {
  // Now safe
}
```

---

### Pitfall 2: Not Handling String Numbers
```typescript
// ❌ Bad: Rejects valid numeric strings
if (typeof data.value !== 'number') {
  return 'Invalid';
}

// ✅ Good: Accepts both numbers and numeric strings
if (!isValidNumber(data.value)) {
  return 'Invalid';
}
```

---

### Pitfall 3: Weak String Validation
```typescript
// ❌ Bad: Accepts empty/whitespace strings
if (typeof data.name === 'string') {
  // "   " passes!
}

// ✅ Good: Trim and check for empty
if (typeof data.name === 'string' && data.name.trim() !== '') {
  // Now robust
}
```

---

### Pitfall 4: Assuming Type Conversions Work
```typescript
// ❌ Bad: Number("abc") returns NaN
const value = Number(data.value);

// ✅ Good: Validate first, convert second
if (isValidNumber(data.value)) {
  const value = toNumber(data.value);
}
```

---

### Pitfall 5: Mutating Input Data
```typescript
// ❌ Bad: Modifies original array
jsonData.forEach(item => {
  item.processed = true;  // Mutates input!
});

// ✅ Good: Create new objects
const metricData: MetricData = {
  id: data.id,
  name: data.name,
  // ... new object, no mutation
};
```

---

## Performance Considerations

### For Large Datasets
```typescript
// If processing 10,000+ metrics
export function parseMetricsBatch(
  jsonData: unknown[], 
  batchSize: number = 100
): ParseResult {
  const valid: MetricData[] = [];
  const errors: ParseError[] = [];

  for (let i = 0; i < jsonData.length; i += batchSize) {
    const batch = jsonData.slice(i, i + batchSize);
    const batchResult = parseMetrics(batch);
    
    valid.push(...batchResult.valid);
    errors.push(...batchResult.errors.map(e => ({
      ...e,
      index: e.index + i  // Adjust index for batch offset
    })));
  }

  return { valid, errors };
}
```

---

### Optimization: Early Returns
```typescript
// Already optimized: fail-fast pattern
if (!isValid(field1)) return;  // Don't check other fields
if (!isValid(field2)) return;
// etc.
```

---

## Interview Discussion Points

### What to Highlight

1. **Type Safety**
   - "TypeScript provides compile-time safety, but runtime validation is crucial for API data"
   - "The parser bridges 'unknown' JSON to strongly-typed MetricData"

2. **Error Handling**
   - "Graceful degradation: app shows valid data even if some items fail"
   - "Error context helps debugging in production"

3. **Flexibility**
   - "Handles common API issues: string numbers, optional fields, malformed data"
   - "Fail-fast validation is efficient and provides clear error messages"

4. **Mobile-First**
   - "Designed for mobile where data quality affects UX"
   - "Prevents crashes from bad data"

5. **Cross-Platform**
   - "TypeScript interfaces map cleanly to Swift Codable and Kotlin data classes"
   - "Validation on backend means mobile apps always receive clean data"

### Questions You Might Get

**Q: Why not use a validation library like Zod?**
A: For this problem, manual validation demonstrates understanding of TypeScript type guards and error handling. In production, Zod is excellent (see Problem 4).

**Q: How would you handle very large datasets?**
A: Implement batching, streaming validation, or move validation to a web worker to avoid blocking the main thread.

**Q: What if the API changes format?**
A: Version the parser, use feature detection, or implement schema migration (see Problem 4 for versioning example).

**Q: How do you test this in production?**
A: Monitor error rates, log parse failures to analytics, implement alerts for high error percentages.

---

## Comparison: Manual vs. Zod

### Manual Validation (This Implementation)

**Pros:**
- ✅ Full control
- ✅ Explicit logic
- ✅ No dependencies
- ✅ Demonstrates understanding

**Cons:**
- ❌ Verbose
- ❌ More code to maintain

### Zod Validation (Problem 4)
```typescript
import { z } from 'zod';

const MetricSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  value: z.number().or(z.string().transform(Number)),
  timestamp: z.string().datetime(),
  unit: z.string().optional()
});

export function parseMetricsZod(jsonData: unknown[]): ParseResult {
  // Much simpler with Zod!
}
```

**Pros:**
- ✅ Concise
- ✅ Battle-tested
- ✅ Better error messages

**Cons:**
- ❌ Dependency
- ❌ Learning curve

**Recommendation:** Use manual for learning/interviews, use Zod for production.

---

## Conclusion

This parser demonstrates:
- ✅ TypeScript type safety at runtime
- ✅ Robust error handling
- ✅ Mobile-first design (graceful degradation)
- ✅ Cross-platform applicability (TS → Swift/Kotlin)
- ✅ Production-ready patterns
