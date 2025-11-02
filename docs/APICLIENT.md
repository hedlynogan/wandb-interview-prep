# Type-Safe API Client Pattern

A comprehensive guide to building type-safe API clients for mobile applications using TypeScript.

## Table of Contents

- [Overview](#overview)
- [Problem Statement](#problem-statement)
- [Core Concepts](#core-concepts)
- [Architecture](#architecture)
- [Implementation Steps](#implementation-steps)
- [TypeScript Features](#typescript-features)
- [Best Practices](#best-practices)
- [Examples](#examples)

## Overview

The **Type-Safe API Client** pattern ensures that HTTP requests and responses are fully type-checked at compile time, reducing runtime errors and improving developer experience when working with backend APIs.

### Key Characteristics

- **Generic Types**: Work with any response type
- **Error Handling**: Structured approach to network and HTTP errors
- **Retry Logic**: Automatic retry on failure
- **Type Transformation**: Convert raw API types to domain types (e.g., ISO strings → Date objects)
- **Compile-Time Safety**: Catch type errors before runtime

## Problem Statement

Mobile applications need to:
1. Fetch data from backend APIs
2. Handle network errors gracefully
3. Transform API data formats (especially dates)
4. Provide type safety across the entire request/response cycle
5. Retry failed requests automatically
6. Maintain clean separation between raw API types and domain types

### Common Challenges

- **API data is untyped at runtime** - JSON can be anything
- **Date handling** - APIs return ISO strings, but apps need Date objects
- **Error scenarios** - Network errors, HTTP errors, parsing errors
- **Type mismatches** - Backend changes breaking frontend
- **Retry logic** - Handling transient failures

## Core Concepts

### 1. Generic Types

Generic types allow functions and classes to work with any type while maintaining type safety:
```
typescript
ApiResponse<T>  // T is a placeholder for any type
```
**Examples:**
- `ApiResponse<User>` - API response containing User data
- `ApiResponse<Post[]>` - API response containing array of Posts
- `ApiResponse<{ total: number }>` - API response with inline type

**Similar to:**
- Kotlin: `Response<T>`
- Swift: Generic types with `<T>`
- Python: `Generic[T]`

### 2. Discriminated Unions

Use a discriminating field to differentiate between types:
```
typescript
type ApiResponse<T> = 
  | { success: true, data: T }
  | { success: false, error: ApiError }
```
**Benefits:**
- Type-safe branching
- Exhaustive checking
- Clear success/failure handling

### 3. Type Narrowing

TypeScript automatically narrows types based on checks:
```
typescript
if (response.success) {
  // TypeScript knows response has 'data' property
  console.log(response.data);
} else {
  // TypeScript knows response has 'error' property
  console.log(response.error);
}
```
### 4. Type Transformation

Convert raw API types to domain types:
```
typescript
// Raw from API
interface RawUser {
  created_at: string;  // ISO string
}

// Domain type
interface User {
  createdAt: Date;     // Date object
}
```
## Architecture

### High-Level Structure
```

┌─────────────────────────────────────────────────────┐
│                    ApiClient                        │
├─────────────────────────────────────────────────────┤
│  Properties:                                        │
│    - baseUrl: string                                │
│    - maxRetries: number                             │
│    - retryDelay: number                             │
│    - timeout: number                                │
├─────────────────────────────────────────────────────┤
│  Methods:                                           │
│    - get<T>(endpoint): Promise<ApiResponse<T>>      │
│    - getExperiments(): Promise<ApiResponse<...>>    │
│    - getExperiment(id): Promise<ApiResponse<...>>   │
│    - delay(ms): Promise<void>                       │
└─────────────────────────────────────────────────────┘
```
### Data Flow
```

1. Call API method
   ↓
2. Make HTTP request (with retry logic)
   ↓
3. Receive raw response
   ↓
4. Check HTTP status
   ↓
5. Parse JSON
   ↓
6. Transform data types (ISO strings → Dates)
   ↓
7. Return typed ApiResponse<T>
```
## Implementation Steps

### Step 1: Define Error Type
```
typescript
interface ApiError {
  code: string;           // Error code (e.g., 'NETWORK_ERROR')
  message: string;        // Human-readable message
  statusCode?: number;    // HTTP status code (if applicable)
  details?: any;          // Additional error details
}
```
**Error codes:**
- `NETWORK_ERROR` - Network connection failed
- `HTTP_ERROR` - HTTP status code error (4xx, 5xx)
- `PARSE_ERROR` - JSON parsing failed
- `TIMEOUT_ERROR` - Request timed out

### Step 2: Define Response Types
```
typescript
// Success response
interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}

// Error response
interface ApiErrorResponse {
  success: false;
  error: ApiError;
}

// Union type
type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;
```
**Why discriminated union?**
- Type-safe: TypeScript knows which properties exist
- Explicit: Clear success vs. failure
- No nulls: No need for `data?: T` and `error?: Error`

### Step 3: Define Domain Types
```
typescript
// Domain type (what your app uses)
interface ExperimentData {
  id: string;
  name: string;
  status: 'running' | 'completed' | 'failed';
  metrics: Record<string, number>;
  createdAt: Date;    // Date object
  updatedAt: Date;    // Date object
}

// Raw type (what API returns)
interface RawExperimentData {
  id: string;
  name: string;
  status: 'running' | 'completed' | 'failed';
  metrics: Record<string, number>;
  createdAt: string;  // ISO string
  updatedAt: string;  // ISO string
}
```
**Best practice:** Keep raw and domain types separate for clarity.

### Step 4: Create ApiClient Class
```
typescript
export class ApiClient {
  private baseUrl: string;
  private maxRetries: number;
  private retryDelay: number;
  private timeout: number;

  constructor(config: string | ApiClientConfig) {
    // Support both simple string URL and full config
    if (typeof config === 'string') {
      this.baseUrl = config;
      this.maxRetries = 3;
      this.retryDelay = 1000;
      this.timeout = 10000;
    } else {
      this.baseUrl = config.baseUrl;
      this.maxRetries = config.maxRetries ?? 3;
      this.retryDelay = config.retryDelay ?? 1000;
      this.timeout = config.timeout ?? 10000;
    }
  }
}
```
**Configuration options:**
- `baseUrl` - API base URL (required)
- `maxRetries` - Number of retry attempts (default: 3)
- `retryDelay` - Delay between retries in ms (default: 1000)
- `timeout` - Request timeout in ms (default: 10000)

### Step 5: Implement Generic GET with Retry Logic
```
typescript
async get<T>(endpoint: string, retries = this.maxRetries): Promise<ApiResponse<T>> {
  const url = `${this.baseUrl}${endpoint}`;
  
  try {
    // Make HTTP request
    const response = await fetch(url);
    
    // Check HTTP status
    if (!response.ok) {
      return {
        success: false,
        error: {
          code: 'HTTP_ERROR',
          message: `HTTP ${response.status}: ${response.statusText}`,
          statusCode: response.status
        }
      };
    }

    // Parse JSON
    const data = await response.json();
    
    return {
      success: true,
      data: data as T
    };
    
  } catch (error) {
    // Retry logic
    if (retries > 0) {
      console.log(`Retrying... (${retries} attempts left)`);
      await this.delay(this.retryDelay);
      return this.get<T>(endpoint, retries - 1);
    }
    
    // No more retries, return error
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        details: error
      }
    };
  }
}

// Helper method to delay execution
private delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
```
**Key points:**
- Recursive retry with decremented counter
- Exponential backoff possible (multiply delay each retry)
- Catches both HTTP errors and network errors

### Step 6: Implement Type Transformation
```
typescript
async getExperiments(page: number = 1): Promise<ApiResponse<ExperimentListResponse>> {
  // 1. Get raw data
  const response = await this.get<RawExperimentListResponse>(`/experiments?page=${page}`);
  
  // 2. If error, return as-is (short-circuit)
  if (!response.success) {
    return response;
  }
  
  // 3. Transform dates from ISO strings to Date objects
  const transformedExperiments = response.data.experiments.map(exp => ({
    ...exp,
    createdAt: new Date(exp.createdAt),
    updatedAt: new Date(exp.updatedAt)
  }));
  
  // 4. Return transformed data
  return {
    success: true,
    data: {
      experiments: transformedExperiments,
      total: response.data.total,
      page: response.data.page
    }
  };
}

async getExperiment(id: string): Promise<ApiResponse<ExperimentData>> {
  const response = await this.get<RawExperimentData>(`/experiments/${id}`);
  
  if (!response.success) {
    return response;
  }
  
  // Transform dates
  const transformed: ExperimentData = {
    ...response.data,
    createdAt: new Date(response.data.createdAt),
    updatedAt: new Date(response.data.updatedAt)
  };
  
  return {
    success: true,
    data: transformed
  };
}
```
**Transformation strategy:**
- Fetch raw data with generic `get<RawType>()`
- Check for errors (early return)
- Transform data types (ISO strings → Dates)
- Return properly typed response

## TypeScript Features

### 1. Generic Type Parameters
```
typescript
async get<T>(endpoint: string): Promise<ApiResponse<T>>
```
**What it means:**
- `<T>` is a type parameter (placeholder)
- Replaced with actual type when called
- Provides type safety throughout the function

**Example:**
```
typescript
const response = await client.get<User>('/user/123');
// response type: ApiResponse<User>
// response.data type: User (if success)
```
### 2. Type Aliases
```
typescript
type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;
```
**Benefits:**
- Create reusable type names
- Combine multiple types with unions
- Self-documenting code

### 3. Optional Parameters with Defaults
```
typescript
async getExperiments(page: number = 1)
```
**Features:**
- `= 1` provides default value
- Parameter is optional when calling
- Similar to: Kotlin default parameters, Swift default arguments

### 4. Record Type
```
typescript
metrics: Record<string, number>
```
**Meaning:**
- Object with string keys and number values
- Equivalent to: `{ [key: string]: number }`
- Similar to: Kotlin `Map<String, Double>`, Swift `[String: Double]`, Python `Dict[str, float]`

### 5. Async/Await
```
typescript
async get<T>(): Promise<ApiResponse<T>> {
  const response = await fetch(url);
  const data = await response.json();
  return data;
}
```
**How it works:**
- `async` function returns Promise automatically
- `await` pauses execution until Promise resolves
- Cleaner than `.then()` chains
- Similar to: Kotlin coroutines, Swift async/await

### 6. Type Narrowing with Discriminated Unions
```
typescript
if (response.success) {
  // TypeScript knows: response is ApiSuccessResponse<T>
  console.log(response.data);  // ✓ Type-safe
} else {
  // TypeScript knows: response is ApiErrorResponse
  console.log(response.error);  // ✓ Type-safe
}
```
**Compiler behavior:**
- Checks `success` field
- Narrows type automatically
- Provides correct autocomplete

### 7. Spread Operator
```
typescript
const transformed = {
  ...rawData,
  createdAt: new Date(rawData.createdAt)
};
```
**What it does:**
- Copy all properties from `rawData`
- Override specific properties (like `createdAt`)
- Maintains immutability

### 8. Nullish Coalescing (`??`)
```
typescript
this.maxRetries = config.maxRetries ?? 3;
```
**Behavior:**
- Use `config.maxRetries` if not null/undefined
- Otherwise use `3`
- Different from `||` (which treats `0` and `''` as falsy)
- Similar to: Kotlin's `?:`, Swift's `??`

### 9. Type Assertion with `as`
```
typescript
const data = response.json() as T;
```
**When to use:**
- After runtime validation
- When you know more than TypeScript
- With caution (bypasses type checking)

### 10. Literal Types
```
typescript
status: 'running' | 'completed' | 'failed'
```
**Benefits:**
- Only these exact strings allowed
- Autocomplete in IDE
- Catch typos at compile time

## Best Practices

### 1. Separate Raw and Domain Types
```
typescript
// ✓ Good: Separate types
interface RawUser {
  created_at: string;
  updated_at: string;
}

interface User {
  createdAt: Date;
  updatedAt: Date;
}

// ✗ Avoid: Mixed types
interface User {
  createdAt: string | Date;  // Confusing!
}
```
**Why:** Clear separation of concerns, easier to maintain.

### 2. Use Discriminated Unions for Errors
```
typescript
// ✓ Good: Clear success/failure
type Result<T> = 
  | { success: true, data: T }
  | { success: false, error: Error }

// ✗ Avoid: Nullable data and error
interface Result<T> {
  data?: T;
  error?: Error;  // Both could be undefined!
}
```
**Why:** Type-safe, no null checks needed.

### 3. Transform at the Boundary
```
typescript
// ✓ Good: Transform in API client
async getUser(id: string): Promise<ApiResponse<User>> {
  const raw = await this.get<RawUser>(`/user/${id}`);
  if (!raw.success) return raw;
  return { success: true, data: transformUser(raw.data) };
}

// ✗ Avoid: Transform in components
const rawUser = await api.getUser('123');
if (rawUser.success) {
  const user = { 
    ...rawUser.data, 
    createdAt: new Date(rawUser.data.created_at) 
  };
}
```
**Why:** Centralized transformation, reusable, less duplication.

### 4. Handle All Error Types
```
typescript
try {
  const response = await fetch(url);
  
  // HTTP errors (4xx, 5xx)
  if (!response.ok) {
    return { 
      success: false, 
      error: { 
        code: 'HTTP_ERROR',
        message: `HTTP ${response.status}`,
        statusCode: response.status
      } 
    };
  }
  
  const data = await response.json();
  return { success: true, data };
  
} catch (error) {
  // Network errors, parsing errors, timeouts
  return { 
    success: false, 
    error: { 
      code: 'NETWORK_ERROR',
      message: error.message 
    } 
  };
}
```
**Error categories:**
- Network errors (no connection)
- HTTP errors (status codes)
- Parse errors (invalid JSON)
- Timeout errors

### 5. Use Type Guards
```
typescript
// ✓ Good: Type guard function
function isSuccessResponse<T>(
  response: ApiResponse<T>
): response is ApiSuccessResponse<T> {
  return response.success;
}

if (isSuccessResponse(response)) {
  console.log(response.data);  // Type-safe!
}

// Also good: Inline check
if (response.success) {
  console.log(response.data);  // Works due to discriminated union
}
```
### 6. Document Generic Parameters
```
typescript
/**
 * Fetch data from an API endpoint
 * @template T The expected response data type
 * @param endpoint API endpoint path (e.g., '/users/123')
 * @returns Promise resolving to ApiResponse<T>
 * 
 * @example
 * const result = await client.get<User>('/users/123');
 * if (result.success) {
 *   console.log(result.data.name);
 * }
 */
async get<T>(endpoint: string): Promise<ApiResponse<T>>
```
### 7. Provide Sensible Defaults
```
typescript
constructor(config: string | ApiClientConfig) {
  if (typeof config === 'string') {
    this.baseUrl = config;
    this.maxRetries = 3;        // Default
    this.retryDelay = 1000;     // Default
    this.timeout = 10000;       // Default
  } else {
    this.baseUrl = config.baseUrl;
    this.maxRetries = config.maxRetries ?? 3;
    this.retryDelay = config.retryDelay ?? 1000;
    this.timeout = config.timeout ?? 10000;
  }
}
```
### 8. Implement Exponential Backoff (Optional)
```
typescript
private getRetryDelay(attempt: number): number {
  // Exponential backoff: 1s, 2s, 4s, 8s, ...
  return this.retryDelay * Math.pow(2, this.maxRetries - attempt);
}

async get<T>(endpoint: string, retries = this.maxRetries): Promise<ApiResponse<T>> {
  try {
    // ... fetch logic
  } catch (error) {
    if (retries > 0) {
      const delay = this.getRetryDelay(retries);
      await this.delay(delay);
      return this.get<T>(endpoint, retries - 1);
    }
    // ... return error
  }
}
```
## Examples

### Example 1: Simple GET Request
```
typescript
const client = new ApiClient('https://api.example.com');

const response = await client.get<User>('/user/123');

if (response.success) {
  console.log('User:', response.data.name);
  console.log('Email:', response.data.email);
  console.log('Created:', response.data.createdAt.toLocaleDateString());
} else {
  console.error('Error:', response.error.message);
  console.error('Code:', response.error.code);
}
```
### Example 2: With Full Configuration
```
typescript
const client = new ApiClient({
  baseUrl: 'https://api.example.com',
  maxRetries: 5,
  retryDelay: 2000,
  timeout: 15000
});

const response = await client.getExperiments(1);

if (response.success) {
  console.log(`Total: ${response.data.total}`);
  console.log(`Page: ${response.data.page}`);
  
  response.data.experiments.forEach(exp => {
    console.log(`${exp.name}: ${exp.status}`);
    console.log(`Metrics:`, exp.metrics);
    console.log(`Created:`, exp.createdAt.toISOString());
  });
} else {
  // Handle specific error codes
  switch (response.error.code) {
    case 'NETWORK_ERROR':
      console.error('No internet connection');
      break;
    case 'HTTP_ERROR':
      if (response.error.statusCode === 404) {
        console.error('Experiments not found');
      } else if (response.error.statusCode === 401) {
        console.error('Unauthorized - please log in');
      }
      break;
    default:
      console.error('Unknown error:', response.error.message);
  }
}
```
### Example 3: Type Transformation in Action
```
typescript
// Raw API response (before transformation)
const rawResponse = {
  id: "exp-1",
  name: "Training Run",
  status: "running",
  metrics: { loss: 0.5, accuracy: 0.85 },
  createdAt: "2025-10-27T10:00:00Z",  // ISO string
  updatedAt: "2025-10-27T11:00:00Z"   // ISO string
};

// After transformation in API client
const experiment: ExperimentData = {
  id: "exp-1",
  name: "Training Run",
  status: "running",
  metrics: { loss: 0.5, accuracy: 0.85 },
  createdAt: new Date("2025-10-27T10:00:00Z"),  // Date object
  updatedAt: new Date("2025-10-27T11:00:00Z")   // Date object
};

// Now can use Date methods
console.log(experiment.createdAt.toLocaleDateString());  // "10/27/2025"
console.log(experiment.createdAt.getTime());             // 1730026800000
console.log(experiment.updatedAt.getHours());            // 11

// Calculate time difference
const duration = experiment.updatedAt.getTime() - experiment.createdAt.getTime();
console.log(`Duration: ${duration / 1000 / 60} minutes`);  // 60 minutes
```
### Example 4: Mobile Integration (React Native)
```
typescript
// Service layer
class ExperimentService {
  private api: ApiClient;
  
  constructor() {
    this.api = new ApiClient('https://api.coreweave.com');
  }
  
  async loadExperiments(page: number): Promise<ExperimentData[]> {
    const response = await this.api.getExperiments(page);
    
    if (!response.success) {
      // Show error to user
      Alert.alert('Error', response.error.message);
      return [];
    }
    
    return response.data.experiments;
  }
  
  async getExperimentDetails(id: string): Promise<ExperimentData | null> {
    const response = await this.api.getExperiment(id);
    
    if (!response.success) {
      // Log error
      console.error('Failed to load experiment:', response.error);
      return null;
    }
    
    return response.data;
  }
  
  async refreshExperiments(): Promise<void> {
    const response = await this.api.getExperiments(1);
    
    if (response.success) {
      // Update state/store
      store.dispatch(setExperiments(response.data.experiments));
    }
  }
}

// Component usage
function ExperimentsList() {
  const [experiments, setExperiments] = useState<ExperimentData[]>([]);
  const [loading, setLoading] = useState(true);
  const service = new ExperimentService();
  
  useEffect(() => {
    loadData();
  }, []);
  
  async function loadData() {
    setLoading(true);
    const data = await service.loadExperiments(1);
    setExperiments(data);
    setLoading(false);
  }
  
  return (
    <FlatList
      data={experiments}
      renderItem={({ item }) => (
        <ExperimentCard experiment={item} />
      )}
    />
  );
}
```
### Example 5: Error Handling Patterns
```
typescript
// Pattern 1: Simple error display
const response = await client.getExperiments(1);
if (!response.success) {
  showToast(response.error.message);
  return;
}
processExperiments(response.data);

// Pattern 2: Retry with user confirmation
async function loadWithRetry(id: string, attempt = 1): Promise<ExperimentData | null> {
  const response = await client.getExperiment(id);
  
  if (response.success) {
    return response.data;
  }
  
  if (response.error.code === 'NETWORK_ERROR' && attempt < 3) {
    const retry = await confirm('Network error. Retry?');
    if (retry) {
      return loadWithRetry(id, attempt + 1);
    }
  }
  
  return null;
}

// Pattern 3: Fallback to cached data
async function getExperimentsWithCache(page: number): Promise<ExperimentData[]> {
  const response = await client.getExperiments(page);
  
  if (response.success) {
    // Save to cache
    await cache.set(`experiments-${page}`, response.data.experiments);
    return response.data.experiments;
  }
  
  // Try to load from cache
  const cached = await cache.get(`experiments-${page}`);
  if (cached) {
    showToast('Showing cached data');
    return cached;
  }
  
  return [];
}
```
## Pattern Variations

### 1. With Authentication
```
typescript
class ApiClient {
  private token?: string;
  
  setAuthToken(token: string) {
    this.token = token;
  }
  
  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json'
    };
    
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    
    return headers;
  }
  
  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    const response = await fetch(url, {
      headers: this.getHeaders()
    });
    // ... rest of logic
  }
}
```
### 2. With Response Caching
```
typescript
class ApiClient {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes
  
  async get<T>(endpoint: string, useCache = true): Promise<ApiResponse<T>> {
    // Check cache
    if (useCache) {
      const cached = this.cache.get(endpoint);
      if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
        return { success: true, data: cached.data };
      }
    }
    
    // Fetch fresh data
    const response = await fetch(url);
    const data = await response.json();
    
    // Update cache
    this.cache.set(endpoint, { data, timestamp: Date.now() });
    
    return { success: true, data };
  }
  
  clearCache() {
    this.cache.clear();
  }
}
```
### 3. With Request/Response Interceptors
```
typescript
type Interceptor = (data: any) => any;

class ApiClient {
  private requestInterceptors: Interceptor[] = [];
  private responseInterceptors: Interceptor[] = [];
  
  addRequestInterceptor(fn: Interceptor) {
    this.requestInterceptors.push(fn);
  }
  
  addResponseInterceptor(fn: Interceptor) {
    this.responseInterceptors.push(fn);
  }
  
  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    // Apply request interceptors
    let url = `${this.baseUrl}${endpoint}`;
    for (const interceptor of this.requestInterceptors) {
      url = interceptor(url);
    }
    
    const response = await fetch(url);
    let data = await response.json();
    
    // Apply response interceptors
    for (const interceptor of this.responseInterceptors) {
      data = interceptor(data);
    }
    
    return { success: true, data };
  }
}

// Usage
client.addRequestInterceptor(url => {
  console.log('Fetching:', url);
  return url;
});

client.addResponseInterceptor(data => {
  console.log('Received:', data);
  return data;
});
```
### 4. With TypeScript Branded Types
```
typescript
// Branded types prevent mixing up IDs
type UserId = string & { __brand: 'UserId' };
type ExperimentId = string & { __brand: 'ExperimentId' };

function createUserId(id: string): UserId {
  return id as UserId;
}

function createExperimentId(id: string): ExperimentId {
  return id as ExperimentId;
}

class ApiClient {
  async getUser(id: UserId): Promise<ApiResponse<User>> { /* ... */ }
  async getExperiment(id: ExperimentId): Promise<ApiResponse<Experiment>> { /* ... */ }
}

// Usage
const userId = createUserId("123");
const expId = createExperimentId("456");

client.getUser(userId);       // ✓ OK
client.getExperiment(expId);  // ✓ OK
client.getUser(expId);        // ✗ Type error! Can't use ExperimentId as UserId
```
## Conclusion

The Type-Safe API Client pattern provides:

- **Type Safety**: Catch errors at compile time, not runtime
- **Error Handling**: Structured approach to all error types
- **Retry Logic**: Automatic recovery from transient failures
- **Type Transformation**: Clean separation between API and domain types
- **Developer Experience**: Autocomplete, type checking, refactoring support
- **Maintainability**: Changes caught by compiler, easier to evolve

### Key Takeaways

1. **Use generic types** for reusability across different data types
2. **Separate raw and domain types** for clarity and maintainability
3. **Handle errors with discriminated unions** for type-safe branching
4. **Transform data at the API boundary** to keep components clean
5. **Implement retry logic** for resilience against transient failures
6. **Document generic parameters** to help other developers
7. **Provide sensible defaults** for ease of use
8. **Type-check everything** to catch bugs before runtime

### When to Use

✓ Mobile apps consuming REST APIs  
✓ Type-safe backend integration  
✓ Complex data transformations needed  
✓ Robust error handling required  
✓ Multiple API endpoints to manage  
✓ Date/time transformations needed  

### When Not to Use

✗ Simple single-request scenarios  
✗ GraphQL APIs (use typed clients like Apollo/urql)  
✗ WebSocket/real-time connections (different patterns)  
✗ No type safety requirements  
✗ Prototyping (add types later)  

### Next Steps

1. Implement Problem 3 using this pattern
2. Add unit tests for ApiClient
3. Extend with POST/PUT/DELETE methods
4. Add authentication support
5. Implement caching strategy
6. Add request cancellation

---

**Further Reading:**
- [TypeScript Handbook - Generics](https://www.typescriptlang.org/docs/handbook/2/generics.html)
- [TypeScript Handbook - Discriminated Unions](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#discriminated-unions)
- [MDN - Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)
- [REST API Best Practices](https://restfulapi.net/)
- [Mobile API Integration Patterns](https://www.reactnative.dev/docs/network)
