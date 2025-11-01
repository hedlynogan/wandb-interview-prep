
```markdown
# CoreWeave TypeScript Practice

A TypeScript practice project focused on JSON parsing, data validation, and type safety for mobile/backend API integration scenarios.

## 📋 Project Overview

This project contains programming exercises that demonstrate real-world TypeScript patterns commonly used in mobile and web development, particularly when dealing with API responses that may contain malformed or inconsistent data.

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher recommended)
- npm (comes with Node.js)

### Installation
```
bash
# Install dependencies
npm install

# Run the main application
npm start

# Run tests
npm test

# Run tests in watch mode (re-runs on file changes)
npm test:watch
```
## 📁 Project Structure
```

Coreweave/
├── src/
│   ├── problems/
│   │   └── problem1.ts          # Metric Data Parser implementation
│   └── index.ts                 # Main entry point for manual testing
├── tests/
│   └── problems.test.ts         # Jest unit tests
├── node_modules/                # Dependencies (not committed)
├── .gitignore                   # Git ignore rules
├── jest.config.js               # Jest testing configuration
├── package.json                 # Project dependencies and scripts
├── tsconfig.json                # TypeScript compiler configuration
└── README.md                    # This file
```
## 🎯 Problems & Concepts

### Problem 1: Metric Data Parser

**Scenario:** Building a mobile dashboard that displays GPU metrics from a backend API with potentially malformed JSON data.

**File:** `src/problems/problem1.ts`

**Objective:** Create a type-safe parser that validates and transforms JSON data, handling missing or invalid fields gracefully.

#### Key TypeScript Concepts Demonstrated

##### 1. **Interfaces & Type Definitions**
```typescript
interface MetricData {
  id: string;
  name: string;
  value: number;
  timestamp: string;
  unit?: string;  // Optional property
}
```
- Defines the shape of data structures
- Similar to: Kotlin `data class`, Swift `struct`, Python `TypedDict`
- `?` denotes optional properties (like Kotlin's `String?` or Swift's `String?`)

##### 2. **Type Safety with `unknown`**
```typescript
function parseMetrics(jsonData: unknown[]): ParseResult
```
- `unknown` is TypeScript's safe alternative to `any`
- Forces explicit type checking before use
- Similar to: Kotlin's checked `Any`, Swift's type-checking patterns

##### 3. **Type Guards**
```typescript
if (typeof value === 'string') {
  // TypeScript now knows value is a string
}
```
- Runtime type checking that narrows types
- Similar to: Kotlin's `is` operator, Swift's `is` keyword, Python's `isinstance()`

##### 4. **Type Assertions**
```typescript
const data = item as any;
```
- Tells TypeScript to treat a value as a specific type
- Similar to: Kotlin's `as`, Swift's `as!`, Python's type cast
- Used carefully after validation

##### 5. **Array Methods with Type Inference**
```typescript
jsonData.forEach((item, index) => { ... });
```
- TypeScript infers types through array methods
- Similar to: Kotlin's `.forEachIndexed()`, Swift's `.enumerated()`, Python's `enumerate()`

##### 6. **Discriminated Unions (Result Pattern)**
```typescript
interface ParseResult {
  valid: MetricData[];
  errors: ParseError[];
}
```
- Returns both successful and failed results
- Similar to: Kotlin's `Result`, Swift's `Result`, Python's multiple return pattern

##### 7. **Validation Patterns**
- String validation with trim checks
- Numeric value coercion (`"75"` → `75`)
- ISO 8601 date format validation
- Graceful error handling with descriptive messages

#### Sample Input/Output

**Input:**
```json
[
  { "id": "gpu-1", "name": "GPU Utilization", "value": 85.5, "timestamp": "2025-10-27T10:00:00Z" },
  { "id": "gpu-2", "name": "GPU Temperature", "value": "75", "timestamp": "invalid-date" },
  { "id": "gpu-3", "value": 90.0 },
  { "id": "gpu-4", "name": "GPU Memory", "value": 12.5, "timestamp": "2025-10-27T10:00:00Z", "unit": "GB" }
]
```

**Output:**
```

- Defines the shape of data structures
- Similar to: Kotlin `data class`, Swift `struct`, Python `TypedDict`
- `?` denotes optional properties (like Kotlin's `String?` or Swift's `String?`)

##### 2. **Type Safety with `unknown`**
```typescript
function parseMetrics(jsonData: unknown[]): ParseResult
```

- `unknown` is TypeScript's safe alternative to `any`
- Forces explicit type checking before use
- Similar to: Kotlin's checked `Any`, Swift's type-checking patterns

##### 3. **Type Guards**
```typescript
if (typeof value === 'string') {
  // TypeScript now knows value is a string
}
```

- Runtime type checking that narrows types
- Similar to: Kotlin's `is` operator, Swift's `is` keyword, Python's `isinstance()`

##### 4. **Type Assertions**
```typescript
const data = item as any;
```

- Tells TypeScript to treat a value as a specific type
- Similar to: Kotlin's `as`, Swift's `as!`, Python's type cast
- Used carefully after validation

##### 5. **Array Methods with Type Inference**
```typescript
jsonData.forEach((item, index) => { ... });
```

- TypeScript infers types through array methods
- Similar to: Kotlin's `.forEachIndexed()`, Swift's `.enumerated()`, Python's `enumerate()`

##### 6. **Discriminated Unions (Result Pattern)**
```typescript
interface ParseResult {
  valid: MetricData[];
  errors: ParseError[];
}
```

- Returns both successful and failed results
- Similar to: Kotlin's `Result`, Swift's `Result`, Python's multiple return pattern

##### 7. **Validation Patterns**
- String validation with trim checks
- Numeric value coercion (`"75"` → `75`)
- ISO 8601 date format validation
- Graceful error handling with descriptive messages

#### Sample Input/Output

**Input:**
```json
[
  { "id": "gpu-1", "name": "GPU Utilization", "value": 85.5, "timestamp": "2025-10-27T10:00:00Z" },
  { "id": "gpu-2", "name": "GPU Temperature", "value": "75", "timestamp": "invalid-date" },
  { "id": "gpu-3", "value": 90.0 },
  { "id": "gpu-4", "name": "GPU Memory", "value": 12.5, "timestamp": "2025-10-27T10:00:00Z", "unit": "GB" }
]
```


**Output:**
```json
{
  "valid": [
    {
      "id": "gpu-1",
      "name": "GPU Utilization",
      "value": 85.5,
      "timestamp": "2025-10-27T10:00:00Z"
    },
    {
      "id": "gpu-4",
      "name": "GPU Memory",
      "value": 12.5,
      "timestamp": "2025-10-27T10:00:00Z",
      "unit": "GB"
    }
  ],
  "errors": [
    {
      "index": 1,
      "reason": "Missing or invalid required field: timestamp (must be valid ISO 8601 format)"
    },
    {
      "index": 2,
      "reason": "Missing or invalid required field: name"
    }
  ]
}
```


## 🛠️ Technology Stack

- **TypeScript 5.9.3** - Primary language with strict type checking
- **Node.js** - Runtime environment
- **Jest 30.2.0** - Testing framework
- **ts-jest 29.4.5** - TypeScript preprocessor for Jest
- **ts-node 10.9.2** - TypeScript execution for Node.js
- **date-fns 4.1.0** - Date utility library (available for use)
- **zod 4.1.12** - Schema validation library (available for use)

## 📚 Key Takeaways

### For Kotlin Developers
- `interface` ≈ `data class` or `interface`
- `unknown` ≈ checked `Any`
- `typeof` checks ≈ `is` operator
- `?` optional ≈ `?` nullable types
- `as` assertion ≈ `as` cast

### For Swift Developers
- `interface` ≈ `struct` or `protocol`
- `unknown` ≈ `Any` with type checking
- `typeof` checks ≈ `is` type check
- `?` optional ≈ `?` optional types
- `as` assertion ≈ `as!` force cast

### For Python Developers
- `interface` ≈ `TypedDict` or `dataclass`
- `unknown` ≈ `object` requiring type checks
- `typeof` checks ≈ `isinstance()`
- `?` optional ≈ `Optional[T]` or `T | None`
- `as` assertion ≈ type casting with `cast()`

## 🧪 Testing

Tests are located in `tests/problems.test.ts` and use Jest framework.

```shell script
# Run all tests once
npm test

# Run tests in watch mode (auto-rerun on changes)
npm test:watch
```


### Test Coverage
- ✅ Validates correct parsing of valid metrics
- ✅ Validates error detection for invalid metrics
- ✅ Confirms type safety and error messages

## 📝 Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Runs the main application (manual test) |
| `npm test` | Runs Jest test suite |
| `npm test:watch` | Runs Jest in watch mode for development |

## 🔄 Development Workflow

1. **Make changes** to source files in `src/`
2. **Run manual test**: `npm start` (uses `src/index.ts`)
3. **Run unit tests**: `npm test` (validates with Jest)
4. **Iterate** until all tests pass

## 📖 Learning Resources

- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [TypeScript for Java/C# Programmers](https://www.typescriptlang.org/docs/handbook/typescript-in-5-minutes-oop.html)
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)

## 📄 License

ISC

## 👨‍💻 Author

Practice project for TypeScript skill development
```
This README provides:
- ✅ Clear project overview
- ✅ Setup instructions
- ✅ Detailed concept explanations
- ✅ Comparisons to Kotlin, Swift, and Python
- ✅ Sample input/output
- ✅ Testing instructions
- ✅ Development workflow guidance

Create this file in your project root, then you can commit everything!
```

