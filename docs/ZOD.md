# Zod Schema Validation Guide

A comprehensive guide to using Zod for runtime type validation in TypeScript applications, with lessons learned from API version differences.

## Table of Contents

- [Overview](#overview)
- [What is Zod?](#what-is-zod)
- [Why Use Zod?](#why-use-zod)
- [Core Concepts](#core-concepts)
- [Implementation Guide](#implementation-guide)
- [Zod 4.x API Reference](#zod-4x-api-reference)
- [Common Patterns](#common-patterns)
- [Version Migration Issues](#version-migration-issues)
- [Best Practices](#best-practices)
- [Examples](#examples)

## Overview

**Zod** is a TypeScript-first schema validation library that provides:
- Runtime type validation
- Type inference from schemas
- Detailed error messages
- Zero dependencies
- Full TypeScript support

### Project Context

This guide documents the implementation of Problem 4: JSON Schema Validator, which validates dashboard configurations for mobile applications.

**Version Used:** Zod 4.1.12

## What is Zod?

Zod is a schema declaration and validation library that allows you to:

1. **Define schemas** that describe your data structure
2. **Validate data** at runtime against those schemas
3. **Infer TypeScript types** automatically from schemas
4. **Parse and transform** data with type safety

### The Problem Zod Solves

Mobile apps receive data from APIs that may be:
- Malformed or incomplete
- Changed unexpectedly by backend updates
- Missing required fields
- Have wrong data types

Zod provides a safety net by validating all incoming data before your app uses it.

## Why Use Zod?

### 1. Type Safety + Runtime Validation
```
typescript
// Define schema
const UserSchema = z.object({
  name: z.string(),
  age: z.number()
});

// Infer TypeScript type
type User = z.infer<typeof UserSchema>;  // { name: string; age: number }

// Validate at runtime
const result = UserSchema.safeParse(data);
if (result.success) {
  const user: User = result.data;  // Type-safe!
}
```
### 2. Better Than Manual Validation
```
typescript
// ❌ Manual validation (error-prone, verbose)
function validateUser(data: any): User | null {
  if (typeof data !== 'object') return null;
  if (typeof data.name !== 'string') return null;
  if (typeof data.age !== 'number') return null;
  return { name: data.name, age: data.age };
}

// ✅ Zod validation (concise, maintainable)
const UserSchema = z.object({
  name: z.string(),
  age: z.number()
});
const result = UserSchema.safeParse(data);
```
### 3. Detailed Error Messages
```
typescript
const result = UserSchema.safeParse({ name: 123, age: "invalid" });
if (!result.success) {
  console.log(result.error.issues);
  // [
  //   { path: ['name'], message: 'Expected string, received number' },
  //   { path: ['age'], message: 'Expected number, received string' }
  // ]
}
```
## Core Concepts

### 1. Schema Definition

A schema describes the expected structure and types of your data:
```
typescript
const MetricSchema = z.object({
  id: z.string(),
  value: z.number(),
  timestamp: z.string().datetime()
});
```
### 2. Type Inference

Automatically generate TypeScript types from schemas:
```
typescript
type Metric = z.infer<typeof MetricSchema>;
// Result: { id: string; value: number; timestamp: string }
```
### 3. Validation

Check if data matches the schema:
```
typescript
const result = MetricSchema.safeParse(data);

if (result.success) {
  // data is valid
  const metric: Metric = result.data;
} else {
  // data is invalid
  const errors = result.error.issues;
}
```
### 4. Transformations

Parse and transform data during validation:
```
typescript
const DateSchema = z.string().transform(str => new Date(str));
```
## Implementation Guide

### Step 1: Install Zod
```
bash
npm install zod
```
### Step 2: Import Zod
```
typescript
import { z } from 'zod';
```
### Step 3: Define Schemas
```
typescript
// Simple schema
export const MetricSchema = z.object({
  id: z.string().min(1, 'Metric ID is required'),
  name: z.string().min(1, 'Metric name is required'),
  value: z.number().min(0, 'Metric value must be non-negative'),
  timestamp: z.string().datetime('Must be a valid ISO 8601 datetime'),
  unit: z.string().optional(),
  tags: z.array(z.string()).optional()
});

// Nested schema
export const WidgetSchema = z.object({
  id: z.string().min(1, 'Widget ID is required'),
  type: z.enum(['chart', 'table', 'metric', 'gauge']),
  title: z.string().min(1, 'Widget title is required'),
  position: z.object({
    x: z.number().int().min(0),
    y: z.number().int().min(0),
    width: z.number().int().min(1).max(12),
    height: z.number().int().min(1).max(12)
  }),
  data: z.array(z.number()).optional(),
  config: z.record(z.string(), z.any()).optional()
});
```
### Step 4: Infer Types
```
typescript
export type Metric = z.infer<typeof MetricSchema>;
export type Widget = z.infer<typeof WidgetSchema>;
```
### Step 5: Create Validation Functions
```
typescript
interface ValidationSuccess<T> {
  success: true;
  data: T;
}

interface ValidationFailure {
  success: false;
  errors: string[];
}

type ValidationResult<T> = ValidationSuccess<T> | ValidationFailure;

export function validateMetric(data: unknown): ValidationResult<Metric> {
  const result = MetricSchema.safeParse(data);
  
  if (result.success) {
    return {
      success: true,
      data: result.data
    };
  }
  
  const errors = result.error.issues.map((err: z.ZodIssue) => {
    const path = err.path.join('.');
    return path ? `${path}: ${err.message}` : err.message;
  });
  
  return {
    success: false,
    errors
  };
}
```
### Step 6: Use in Application
```
typescript
const apiData = await fetchFromAPI();
const result = validateMetric(apiData);

if (result.success) {
  // Type-safe usage
  console.log(result.data.name);
  console.log(result.data.value);
} else {
  // Handle errors
  result.errors.forEach(err => console.error(err));
}
```
## Zod 4.x API Reference

### Basic Types
```
typescript
z.string()           // string
z.number()           // number
z.boolean()          // boolean
z.null()             // null
z.undefined()        // undefined
z.any()              // any type
z.unknown()          // unknown type
```
### String Validations
```
typescript
z.string().min(5)                    // Minimum length
z.string().max(100)                  // Maximum length
z.string().email()                   // Valid email
z.string().url()                     // Valid URL
z.string().uuid()                    // Valid UUID
z.string().datetime()                // ISO 8601 datetime
z.string().regex(/^[A-Z]+$/)        // Match regex
```
### Number Validations
```
typescript
z.number().min(0)                    // Minimum value
z.number().max(100)                  // Maximum value
z.number().int()                     // Must be integer
z.number().positive()                // Must be positive
z.number().negative()                // Must be negative
z.number().multipleOf(5)             // Must be multiple of
```
### Object Schemas
```
typescript
z.object({
  name: z.string(),
  age: z.number()
})

// With optional fields
z.object({
  required: z.string(),
  optional: z.string().optional()
})

// With defaults
z.object({
  theme: z.string().default('light')
})
```
### Array Schemas
```
typescript
z.array(z.string())                  // Array of strings
z.array(z.number()).min(1)           // At least one element
z.array(z.number()).max(10)          // At most 10 elements
z.array(z.number()).nonempty()       // Must not be empty
```
### Enum Schemas
```
typescript
z.enum(['admin', 'user', 'guest'])   // String literal union
```
### Record Schemas (Zod 4.x)
```
typescript
// ✅ Correct in Zod 4.x (requires key and value type)
z.record(z.string(), z.any())
z.record(z.string(), z.number())

// ❌ Wrong in Zod 4.x (missing key type)
z.record(z.any())  // This causes TS2554 error
```
### Union Types
```
typescript
z.union([z.string(), z.number()])    // string | number
z.string().or(z.number())            // Alternative syntax
```
### Optional and Nullable
```
typescript
z.string().optional()                // string | undefined
z.string().nullable()                // string | null
z.string().nullish()                 // string | null | undefined
```
### Validation Methods
```
typescript
// Parse (throws on error)
const data = schema.parse(input);

// Safe parse (returns result object)
const result = schema.safeParse(input);
if (result.success) {
  console.log(result.data);
} else {
  console.log(result.error);
}
```
## Common Patterns

### Pattern 1: Nested Object Validation
```
typescript
const AddressSchema = z.object({
  street: z.string(),
  city: z.string(),
  zipCode: z.string()
});

const UserSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  address: AddressSchema  // Nested schema
});
```
### Pattern 2: Array of Objects
```
typescript
const DashboardSchema = z.object({
  widgets: z.array(WidgetSchema).min(1, 'Must have at least one widget')
});
```
### Pattern 3: Discriminated Unions
```
typescript
const SuccessSchema = z.object({
  success: z.literal(true),
  data: z.any()
});

const ErrorSchema = z.object({
  success: z.literal(false),
  error: z.string()
});

const ResponseSchema = z.union([SuccessSchema, ErrorSchema]);
```
### Pattern 4: Schema with Defaults
```
typescript
const ConfigSchema = z.object({
  theme: z.enum(['light', 'dark', 'auto']).default('light'),
  timeout: z.number().default(5000)
});
```
### Pattern 5: Custom Error Messages
```
typescript
const PasswordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain uppercase letter')
  .regex(/[0-9]/, 'Password must contain a number');
```
### Pattern 6: Schema Migration
```
typescript
function migrateAndValidate(data: unknown) {
  const config = data as any;
  
  // Migrate old version
  if (config.version === '0.9') {
    config.layout = config.type;  // Rename field
    delete config.type;
    config.version = '1.0';
  }
  
  // Validate with current schema
  return CurrentSchema.safeParse(config);
}
```
## Version Migration Issues

### Issues Encountered with Zod 4.1.12

During implementation, we encountered several API changes from earlier Zod versions:

#### Issue 1: `errorMap` Parameter Not Supported

**Problem:**
```
typescript
// ❌ This syntax doesn't work in Zod 4.x
z.enum(['chart', 'table', 'metric', 'gauge'], {
  errorMap: () => ({ message: 'Custom error message' })
})
```
**Error:**
```

TS2769: Object literal may only specify known properties, 
and 'errorMap' does not exist in type '{ error?: string | ... }'
```
**Solution:**
```
typescript
// ✅ Use plain enum without errorMap
z.enum(['chart', 'table', 'metric', 'gauge'])

// ✅ Or use .refine() for custom validation
z.enum(['chart', 'table', 'metric', 'gauge'])
  .refine(val => ['chart', 'table', 'metric', 'gauge'].includes(val), {
    message: 'Custom error message'
  })
```
#### Issue 2: `result.error.errors` Changed to `result.error.issues`

**Problem:**
```
typescript
// ❌ This property doesn't exist in Zod 4.x
const errors = result.error.errors.map(err => err.message);
```
**Error:**
```

TS2339: Property 'errors' does not exist on type 'ZodError<...>'
```
**Solution:**
```
typescript
// ✅ Use .issues instead of .errors
const errors = result.error.issues.map((err: z.ZodIssue) => {
  const path = err.path.join('.');
  return path ? `${path}: ${err.message}` : err.message;
});
```
#### Issue 3: `z.record()` Requires Two Arguments

**Problem:**
```
typescript
// ❌ Missing key type argument in Zod 4.x
z.record(z.any())
```
**Error:**
```

TS2554: Expected 2-3 arguments, but got 1
```
**Solution:**
```
typescript
// ✅ Provide both key and value types
z.record(z.string(), z.any())
```
### Migration Checklist

When upgrading Zod or fixing version-specific issues:

- [ ] Replace `result.error.errors` with `result.error.issues`
- [ ] Remove `errorMap` from enum definitions
- [ ] Update `z.record()` calls to include key type: `z.record(z.string(), valueType)`
- [ ] Add explicit type annotations for error mapping: `(err: z.ZodIssue)`
- [ ] Test all validation functions
- [ ] Check TypeScript compilation with `npx tsc --noEmit`

### Zod Version Compatibility

| Feature | Zod 3.x | Zod 4.x |
|---------|---------|---------|
| `z.record(valueType)` | ✅ Works | ❌ Requires key type |
| `result.error.errors` | ✅ Available | ❌ Use `.issues` |
| `errorMap` in enum | ✅ Supported | ❌ Not supported |
| `z.ZodIssue` type | ✅ Available | ✅ Available |

## Best Practices

### 1. Use `safeParse()` Over `parse()`
```
typescript
// ✅ Good: Returns result object
const result = schema.safeParse(data);
if (result.success) {
  // Handle success
} else {
  // Handle errors
}

// ❌ Avoid: Throws exception
try {
  const data = schema.parse(input);
} catch (error) {
  // Error handling
}
```
**Why:** `safeParse()` is safer and more predictable in production code.

### 2. Define Schemas Outside Functions
```
typescript
// ✅ Good: Schema defined once
const UserSchema = z.object({ name: z.string() });

function validateUser(data: unknown) {
  return UserSchema.safeParse(data);
}

// ❌ Avoid: Schema recreated on each call
function validateUser(data: unknown) {
  const schema = z.object({ name: z.string() });
  return schema.safeParse(data);
}
```
### 3. Use Type Inference
```
typescript
// ✅ Good: Infer types from schema
const UserSchema = z.object({ name: z.string(), age: z.number() });
type User = z.infer<typeof UserSchema>;

// ❌ Avoid: Duplicate type definitions
interface User { name: string; age: number; }
const UserSchema = z.object({ name: z.string(), age: z.number() });
```
### 4. Provide Custom Error Messages
```
typescript
// ✅ Good: Clear error messages
z.string().min(1, 'Name is required')
z.number().min(0, 'Value must be non-negative')

// ❌ Avoid: Default messages only
z.string().min(1)
z.number().min(0)
```
### 5. Validate at Boundaries
```
typescript
// ✅ Good: Validate at API boundary
async function fetchUser(id: string): Promise<User> {
  const response = await fetch(`/api/users/${id}`);
  const data = await response.json();
  
  const result = UserSchema.safeParse(data);
  if (!result.success) {
    throw new Error('Invalid user data from API');
  }
  
  return result.data;  // Type-safe!
}
```
### 6. Compose Schemas
```
typescript
// ✅ Good: Reusable schemas
const TimestampSchema = z.object({
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});

const UserSchema = z.object({
  name: z.string()
}).merge(TimestampSchema);

const PostSchema = z.object({
  title: z.string()
}).merge(TimestampSchema);
```
### 7. Handle Errors Gracefully
```
typescript
// ✅ Good: User-friendly error messages
function formatValidationErrors(errors: z.ZodIssue[]): string[] {
  return errors.map(err => {
    const field = err.path.join('.');
    return field ? `${field}: ${err.message}` : err.message;
  });
}

const result = schema.safeParse(data);
if (!result.success) {
  const errors = formatValidationErrors(result.error.issues);
  showToUser(errors);
}
```
## Examples

### Example 1: Dashboard Configuration Validator
```
typescript
// Schema definition
const DashboardConfigSchema = z.object({
  version: z.string().regex(/^\d+\.\d+$/),
  layout: z.enum(['grid', 'flex', 'fixed']),
  theme: z.enum(['light', 'dark', 'auto']).optional().default('light'),
  widgets: z.array(WidgetSchema).min(1),
  metadata: z.object({
    createdAt: z.string().datetime().optional(),
    updatedAt: z.string().datetime().optional(),
    author: z.string().optional()
  }).optional()
});

// Type inference
type DashboardConfig = z.infer<typeof DashboardConfigSchema>;

// Validation
const result = DashboardConfigSchema.safeParse(apiData);
if (result.success) {
  console.log('Valid dashboard:', result.data);
} else {
  console.error('Validation errors:', result.error.issues);
}
```
### Example 2: Form Validation
```
typescript
const SignupSchema = z.object({
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be at most 20 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  
  email: z.string()
    .email('Invalid email address'),
  
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});

type SignupForm = z.infer<typeof SignupSchema>;
```
### Example 3: API Response Validation
```
typescript
const ApiResponseSchema = z.object({
  success: z.boolean(),
  data: z.any().optional(),
  error: z.object({
    code: z.string(),
    message: z.string()
  }).optional()
});

async function apiRequest<T>(url: string, dataSchema: z.ZodSchema<T>) {
  const response = await fetch(url);
  const json = await response.json();
  
  // Validate response structure
  const responseResult = ApiResponseSchema.safeParse(json);
  if (!responseResult.success) {
    throw new Error('Invalid API response structure');
  }
  
  // Validate data payload
  if (responseResult.data.success && responseResult.data.data) {
    const dataResult = dataSchema.safeParse(responseResult.data.data);
    if (dataResult.success) {
      return dataResult.data;
    }
    throw new Error('Invalid data format');
  }
  
  throw new Error(responseResult.data.error?.message || 'API error');
}
```
### Example 4: Environment Variable Validation
```
typescript
const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']),
  API_URL: z.string().url(),
  API_KEY: z.string().min(1),
  PORT: z.string().transform(val => parseInt(val, 10))
});

type Env = z.infer<typeof EnvSchema>;

function loadEnv(): Env {
  const result = EnvSchema.safeParse(process.env);
  
  if (!result.success) {
    console.error('Invalid environment variables:');
    result.error.issues.forEach(err => {
      console.error(`  ${err.path.join('.')}: ${err.message}`);
    });
    process.exit(1);
  }
  
  return result.data;
}

const env = loadEnv();
```
## Conclusion

Zod provides powerful runtime validation with excellent TypeScript integration. Key benefits include:

- **Type Safety**: Automatic type inference from schemas
- **Runtime Validation**: Catch errors before they cause problems
- **Developer Experience**: Clear error messages and excellent IDE support
- **Maintainability**: Single source of truth for types and validation
- **Performance**: Zero dependencies, fast validation

### When to Use Zod

✅ Validating API responses  
✅ Form validation  
✅ Configuration file parsing  
✅ Environment variable validation  
✅ User input validation  
✅ Data migration/transformation  

### When Not to Use Zod

❌ Simple TypeScript types without runtime validation  
❌ Performance-critical hot paths  
❌ When bundle size is extremely constrained  

### Version-Specific Notes

When using **Zod 4.x**:
- Use `result.error.issues` instead of `result.error.errors`
- Provide both key and value types to `z.record()`
- Avoid `errorMap` in enum definitions
- Always add explicit types when mapping errors: `(err: z.ZodIssue)`

---

**Resources:**
- [Zod Official Documentation](https://zod.dev/)
- [Zod GitHub Repository](https://github.com/colinhacks/zod)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)