/**
 * PROBLEM 2: Dynamic Component Renderer
 *
 * Design a system that takes JSON configuration and renders a mobile UI.
 * This is similar to server-driven UI patterns used in modern mobile apps.
 *
 * Task:
 * 1. Define TypeScript types for component configurations
 * 2. Implement a component registry pattern
 * 3. Create a render function that processes the JSON and outputs a component tree
 * 4. Handle unknown component types gracefully
 *
 * Input example:
 * {
 *   "screen": "dashboard",
 *   "components": [
 *     { "type": "header", "text": "GPU Metrics", "style": "large" },
 *     { "type": "chart", "data": [...], "chartType": "line" },
 *     { "type": "grid", "columns": 2, "items": [...] },
 *     { "type": "unknown-component", "data": "..." } // Should handle gracefully
 *   ]
 * }
 *
 * Your renderer should:
 * - Validate component types
 * - Support extensible component registration
 * - Return a renderable tree structure
 * - Log/report unknown components
 */

// TODO: Define your component types
type ComponentType = 'header' | 'chart' | 'grid' | 'list' | 'metric';

interface BaseComponent {
  type: ComponentType;
  id?: string;
}

// TODO: Define specific component interfaces
interface HeaderComponent extends BaseComponent {
  // Your code here
}

// TODO: Define the component registry
type ComponentRegistry = {
  // Your code here
};

// TODO: Implement the renderer
export class ComponentRenderer {
  private registry: ComponentRegistry;

  constructor() {
    // Initialize registry
  }

  registerComponent(type: ComponentType, validator: any): void {
    // Your code here
  }

  render(config: unknown): any {
    // Your code here
    throw new Error("Not implemented");
  }
}

// Test data
export const testConfig = {
  "screen": "dashboard",
  "components": [
    { "type": "header", "text": "GPU Metrics", "style": "large" },
    { "type": "chart", "data": [1, 2, 3], "chartType": "line" },
    { "type": "unknown", "data": "should handle gracefully" }
  ]
};