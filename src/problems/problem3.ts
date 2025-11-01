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

// TODO: Define API response types
interface ApiResponse<T> {
  // Your code here
}

interface ApiError {
  // Your code here
}

// TODO: Define specific endpoint types
interface ExperimentData {
  id: string;
  name: string;
  status: 'running' | 'completed' | 'failed';
  metrics: Record<string, number>;
  createdAt: Date;
  updatedAt: Date;
}

interface ExperimentListResponse {
  experiments: ExperimentData[];
  total: number;
  page: number;
}

// TODO: Implement the API client
export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  // Generic GET method with type safety
  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    // Your code here
    throw new Error("Not implemented");
  }

  // Specific typed methods
  async getExperiments(page: number = 1): Promise<ApiResponse<ExperimentListResponse>> {
    // Your code here
    throw new Error("Not implemented");
  }

  async getExperiment(id: string): Promise<ApiResponse<ExperimentData>> {
    // Your code here
    throw new Error("Not implemented");
  }
}

// Mock fetch for testing (you'd use real fetch in production)
export function mockFetch(url: string): Promise<any> {
  // Simulate API response
  return Promise.resolve({
    ok: true,
    json: () => Promise.resolve({
      experiments: [
        {
          id: "exp-1",
          name: "Training Run 1",
          status: "running",
          metrics: { loss: 0.5, accuracy: 0.85 },
          createdAt: "2025-10-27T10:00:00Z",
          updatedAt: "2025-10-27T11:00:00Z"
        }
      ],
      total: 1,
      page: 1
    })
  });
}