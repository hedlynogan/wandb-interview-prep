# CoreWeave TypeScript Practice

A TypeScript practice project focused on JSON parsing, data validation, and type safety for mobile/backend API integration scenarios.

## 📋 Project Overview

This project contains 5 programming exercises that demonstrate real-world TypeScript patterns commonly used in mobile and web development, particularly when dealing with API responses that may contain malformed or inconsistent data.

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher recommended)
- npm (comes with Node.js)

### Installation

```bash
# Install dependencies
npm install

# Run the main application
npm start

# Run tests
npm test

# Run tests in watch mode (re-runs on file changes)
npm test:watch
```
```


## 📁 Project Structure

```
Coreweave/
├── src/
│   ├── problems/
│   │   ├── problem1.ts          # Metric Data Parser
│   │   ├── problem2.ts          # Dynamic Component Renderer
│   │   ├── problem3.ts          # Type-Safe API Client
│   │   ├── problem4.ts          # Zod Schema Validator
│   │   └── problem5.ts          # Data Transformer Pipeline
│   └── index.ts                 # Main entry point for testing
├── docs/
│   ├── PIPELINE.md              # Transformer Pipeline Pattern Guide
│   ├── APICLIENT.md             # Type-Safe API Client Guide
│   └── ZOD.md                   # Zod Schema Validation Guide
├── tests/
│   └── problems.test.ts         # Jest unit tests
├── .gitignore                   # Git ignore rules
├── jest.config.js               # Jest testing configuration
├── package.json                 # Project dependencies and scripts
├── tsconfig.json                # TypeScript compiler configuration
└── README.md                    # This file
```


## 🎯 Problems & Concepts

### Problem 1: Metric Data Parser
**File:** `src/problems/problem1.ts`

Parse and validate GPU metrics from a backend API with potentially malformed JSON data.

**Key Concepts:**
- Interfaces & type definitions
- Type guards and type narrowing
- `unknown` vs `any`
- Manual validation patterns
- Error handling with discriminated unions

**Demonstrates:** Basic TypeScript type safety, runtime validation, and error handling patterns.

---

### Problem 2: Dynamic Component Renderer
**File:** `src/problems/problem2.ts`

Build a server-driven UI system that validates and renders mobile components from JSON configuration.

**Key Concepts:**
- Component registry pattern
- Discriminated unions with type predicates
- Recursive type definitions
- Type-safe validation with generics
- Extensible architecture

**Demonstrates:** Advanced pattern matching, plugin architecture, and type-safe component systems.

📖 **Detailed Guide:** See [docs/PIPELINE.md](docs/PIPELINE.md) for the transformer pipeline pattern (used in Problem 5).

---

### Problem 3: Type-Safe API Client
**File:** `src/problems/problem3.ts`

Create a fully type-safe HTTP client with error handling, retries, and automatic data transformation.

**Key Concepts:**
- Generic types with `<T>`
- Discriminated unions for success/error responses
- Async/await patterns
- Retry logic with recursion
- Type transformation (ISO strings → Date objects)

**Demonstrates:** Production-ready API client patterns for mobile applications.

📖 **Detailed Guide:** See [docs/APICLIENT.md](docs/APICLIENT.md) for comprehensive API client patterns.

---

### Problem 4: JSON Schema Validator with Zod
**File:** `src/problems/problem4.ts`

Use Zod for runtime type validation of complex nested data structures with schema migrations.

**Key Concepts:**
- Zod schema definitions
- Type inference with `z.infer<>`
- Runtime validation
- Schema migration/versioning
- Nested object validation

**Demonstrates:** Modern schema validation, type inference, and handling API version changes.

📖 **Detailed Guide:** See [docs/ZOD.md](docs/ZOD.md) for Zod patterns and version migration issues.

---

### Problem 5: Data Transformer Pipeline
**File:** `src/problems/problem5.ts`

Build a composable pipeline for transforming API data through multiple stages with full type safety.

**Key Concepts:**
- Pipeline pattern
- Generic type transformations
- Method chaining with generics
- Async transformation support
- Functional composition

**Demonstrates:** Advanced functional patterns for data transformation workflows.

📖 **Detailed Guide:** See [docs/PIPELINE.md](docs/PIPELINE.md) for complete pipeline pattern documentation.

---

## 🛠️ Technology Stack

- **TypeScript 5.9.3** - Primary language with strict type checking
- **Node.js** - Runtime environment
- **Jest 30.2.0** - Testing framework
- **ts-jest 29.4.5** - TypeScript preprocessor for Jest
- **ts-node 10.9.2** - TypeScript execution for Node.js
- **date-fns 4.1.0** - Date utility library
- **zod 4.1.12** - Schema validation library

## 📚 Key TypeScript Concepts

This project covers essential TypeScript patterns:

✅ **Type Safety**: `unknown`, type guards, type assertions  
✅ **Generics**: `<T>`, type parameters, generic constraints  
✅ **Advanced Types**: Discriminated unions, literal types, mapped types  
✅ **Patterns**: Result pattern, registry pattern, pipeline pattern  
✅ **Async**: Promises, async/await, error handling  
✅ **Validation**: Runtime checks, schema validation, type inference  

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

## 📖 Documentation

Comprehensive guides are available in the `docs/` directory:

- **[PIPELINE.md](docs/PIPELINE.md)** - Transformer Pipeline Pattern
  - Pipeline design principles
  - Composable transformations
  - Type-safe data flows
  - Real-world examples

- **[APICLIENT.md](docs/APICLIENT.md)** - Type-Safe API Client Guide
  - Generic API client implementation
  - Error handling strategies
  - Retry logic patterns
  - Type transformation techniques

- **[ZOD.md](docs/ZOD.md)** - Zod Schema Validation Guide
  - Zod 4.x API reference
  - Schema definition patterns
  - Type inference
  - Version migration issues and solutions

## 🧪 Testing

Tests are located in `tests/problems.test.ts` and use Jest framework.

```shell script
# Run all tests once
npm test

# Run tests in watch mode (auto-rerun on changes)
npm test:watch
```


### Test Coverage
- ✅ Problem 1: Metric parsing and error handling
- ✅ Problem 2: Component rendering and validation
- ⚠️  Problem 3-5: TODO - Add comprehensive tests

## 📝 Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Runs all problems with test data |
| `npm test` | Runs Jest test suite |
| `npm test:watch` | Runs Jest in watch mode for development |

## 🔄 Development Workflow

1. **Explore problems** in `src/problems/`
2. **Read documentation** in `docs/` for detailed patterns
3. **Run manual test**: `npm start`
4. **Run unit tests**: `npm test`
5. **Iterate** until all tests pass

## 🎓 Learning Path

**Recommended order:**

1. **Problem 1** - Start here for TypeScript fundamentals
2. **Problem 2** - Learn advanced patterns and registries
3. **Problem 3** - Master async patterns and API clients
4. **Problem 4** - Explore schema validation with Zod
5. **Problem 5** - Apply functional patterns with pipelines

Each problem builds on concepts from previous ones.

## 📖 Additional Resources

- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [TypeScript for Java/C# Programmers](https://www.typescriptlang.org/docs/handbook/typescript-in-5-minutes-oop.html)
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Zod Documentation](https://zod.dev/)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)

## 📄 License

ISC

## 👨‍💻 Author

Practice project for TypeScript skill development with real-world mobile/backend integration patterns.

---

**Note:** This project emphasizes type safety, error handling, and patterns commonly used in production mobile applications. Each problem demonstrates industry best practices for building robust, maintainable TypeScript applications.
```
Now commit with:

```bash
git add README.md
git commit -m "docs: refactor README to summarize all 5 problems

- Add concise descriptions for all 5 problems
- Include key concepts for each problem
- Link to detailed documentation in docs/ directory
- Reorganize structure for better navigation
- Add learning path recommendations
- Update project structure to show all files
- Improve readability with clear sections"
```
