
/**
 * PROBLEM 3: Type-Safe API Client for Mobile
 *
 * Create a type-safe API client that mobile apps would use to fetch data.
 * This demonstrates how TypeScript types bridge backend and mobile.
 *
 * Task:
 * 1. Define API response types
 * 2. Create a generic API client with type safety
 * 3. Implement error handling and retries
 * 4. Add request/response transformers
 *
 * Requirements:
 * - Type-safe request/response
 * - Handle network errors
 * - Transform dates from ISO strings to Date objects
 * - Support generic error handling
 */

// API Error type
interface ApiError {
  code: string;
  message: string;
  statusCode?: number;
  details?: any;
}

// API Response: Success case
interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}

// API Response: Error case
interface ApiErrorResponse {
  success: false;
  error: ApiError;
}

// Union type: Response can be success or error
type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

// Experiment data (domain type with Date objects)
interface ExperimentData {
  id: string;
  name: string;
  status: 'running' | 'completed' | 'failed';
  metrics: Record<string, number>;
  createdAt: Date;
  updatedAt: Date;
}

// List of experiments response
interface ExperimentListResponse {
  experiments: ExperimentData[];
  total: number;
  page: number;
}

// Raw experiment data (before date transformation)
interface RawExperimentData {
  id: string;
  name: string;
  status: 'running' | 'completed' | 'failed';
  metrics: Record<string, number>;
  createdAt: string;  // ISO string from API
  updatedAt: string;  // ISO string from API
}

// Raw experiment list (before transformation)
interface RawExperimentListResponse {
  experiments: RawExperimentData[];
  total: number;
  page: number;
}

// API Client configuration
interface ApiClientConfig {
  baseUrl: string;
  maxRetries?: number;
  retryDelay?: number;
  timeout?: number;
}

// API Client class
export class ApiClient {
  private baseUrl: string;
  private maxRetries: number;
  private retryDelay: number;
  private timeout: number;

  constructor(config: string | ApiClientConfig) {
    // Support both simple string URL and full config object
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

  /**
   * Generic GET method with type safety and retries
   */
  async get<T>(endpoint: string, retries = this.maxRetries): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;

    try {
      // Use mockFetch for testing (replace with real fetch in production)
      const response = await mockFetch(url);

      // Check if response is OK
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
      // Retry logic for transient failures
      if (retries > 0) {
        console.log(`⚠️  Request failed, retrying... (${retries} attempts left)`);
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

  /**
   * Get list of experiments with date transformation
   */
  async getExperiments(page: number = 1): Promise<ApiResponse<ExperimentListResponse>> {
    // 1. Fetch raw data from API
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

  /**
   * Get single experiment by ID with date transformation
   */
  async getExperiment(id: string): Promise<ApiResponse<ExperimentData>> {
    // 1. Fetch raw data from API
    const response = await this.get<RawExperimentData>(`/experiments/${id}`);

    // 2. If error, return as-is
    if (!response.success) {
      return response;
    }

    // 3. Transform dates from ISO strings to Date objects
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

  /**
   * Helper method to delay execution (for retry logic)
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Mock fetch for testing (simulates real API)
 */
export function mockFetch(url: string): Promise<any> {
  console.log(`📡 Fetching: ${url}`);

  // Simulate network delay
  return new Promise((resolve) => {
    setTimeout(() => {
      // Simulate different responses based on URL
      if (url.includes('/experiments?')) {
        // List of experiments
        resolve({
          ok: true,
          status: 200,
          statusText: 'OK',
          json: () => Promise.resolve({
            experiments: [
              {
                id: "exp-1",
                name: "Training Run 1",
                status: "running",
                metrics: { loss: 0.5, accuracy: 0.85 },
                createdAt: "2025-10-27T10:00:00Z",
                updatedAt: "2025-10-27T11:00:00Z"
              },
              {
                id: "exp-2",
                name: "Training Run 2",
                status: "completed",
                metrics: { loss: 0.3, accuracy: 0.92 },
                createdAt: "2025-10-26T10:00:00Z",
                updatedAt: "2025-10-26T15:00:00Z"
              }
            ],
            total: 2,
            page: 1
          })
        });
      } else if (url.includes('/experiments/')) {
        // Single experiment
        const id = url.split('/').pop();
        resolve({
          ok: true,
          status: 200,
          statusText: 'OK',
          json: () => Promise.resolve({
            id: id,
            name: "Training Run Details",
            status: "running",
            metrics: { loss: 0.5, accuracy: 0.85, f1_score: 0.87 },
            createdAt: "2025-10-27T10:00:00Z",
            updatedAt: "2025-10-27T11:00:00Z"
          })
        });
      } else {
        // Unknown endpoint - 404
        resolve({
          ok: false,
          status: 404,
          statusText: 'Not Found',
          json: () => Promise.resolve({ error: 'Endpoint not found' })
        });
      }
    }, 500); // 500ms delay to simulate network
  });
}

/**
 * Test helper: Simulate network error
 */
export function mockFetchWithError(): Promise<any> {
  return Promise.reject(new Error('Network connection failed'));
}