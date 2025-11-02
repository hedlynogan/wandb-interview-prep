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

// Define all possible component types
type ComponentType = 'header' | 'chart' | 'grid' | 'list' | 'metric';

// Base interface that all components extend
interface BaseComponent {
  type: ComponentType;
  id?: string; // Optional unique identifier
}

// Header component: Displays text with styling
interface HeaderComponent extends BaseComponent {
  type: 'header';
  text: string;
  style?: 'small' | 'medium' | 'large'; // Optional size
}

// Chart component: Displays data visualization
interface ChartComponent extends BaseComponent {
  type: 'chart';
  data: number[]; // Chart data points
  chartType: 'line' | 'bar' | 'pie'; // Type of chart
  title?: string; // Optional chart title
}

// Grid component: Layout component with columns
interface GridComponent extends BaseComponent {
  type: 'grid';
  columns: number; // Number of columns (e.g., 2, 3)
  items: RenderedComponent[]; // Nested components
}

// List component: Vertical list of items
interface ListComponent extends BaseComponent {
  type: 'list';
  items: RenderedComponent[]; // Nested components
  orientation?: 'vertical' | 'horizontal'; // Optional layout
}

// Metric component: Displays a single metric value
interface MetricComponent extends BaseComponent {
  type: 'metric';
  label: string; // Metric name
  value: number | string; // Metric value
  unit?: string; // Optional unit (e.g., "GB", "%")
}

// Union type: Any valid component
type ValidComponent =
  | HeaderComponent
  | ChartComponent
  | GridComponent
  | ListComponent
  | MetricComponent;

// Rendered component: Result after processing
interface RenderedComponent {
  component: ValidComponent;
  isValid: true;
}

// Unknown component: When type is not recognized
interface UnknownComponent {
  type: string; // The unknown type name
  rawData: any; // Original data
  isValid: false;
  error: string;
}

// Result type: Can be valid or unknown
type RenderResult = RenderedComponent | UnknownComponent;

// Screen configuration from the server
interface ScreenConfig {
  screen: string; // Screen name/ID
  components: unknown[]; // Array of component configs (unknown until validated)
}

// Final render output
interface RenderOutput {
  screen: string;
  components: RenderResult[]; // Mix of valid and unknown components
  errors: string[]; // List of all errors encountered
}

// Component validator function type
type ComponentValidator = (data: any) => ValidComponent | null;

// Component registry: Maps component types to validators
type ComponentRegistry = Map<ComponentType, ComponentValidator>;

// Component renderer: Main class
export class ComponentRenderer {
  private registry: ComponentRegistry;

  constructor() {
    // Initialize the registry with a Map
    this.registry = new Map<ComponentType, ComponentValidator>();

    // Register default validators
    this.registerDefaultValidators();
  }

  /**
   * Register a component type with its validator
   */
  registerComponent(type: ComponentType, validator: ComponentValidator): void {
    this.registry.set(type, validator);
  }

  /**
   * Register all default component validators
   */
  private registerDefaultValidators(): void {
    // Header validator
    this.registerComponent('header', (data: any): ValidComponent | null => {
      if (typeof data.text !== 'string' || data.text.trim() === '') {
        return null;
      }

      return {
        type: 'header',
        text: data.text,
        style: data.style || 'medium', // Default to medium
        id: data.id
      };
    });

    // Chart validator
    this.registerComponent('chart', (data: any): ValidComponent | null => {
      if (!Array.isArray(data.data) || data.data.length === 0) {
        return null;
      }

      const validChartTypes = ['line', 'bar', 'pie'];
      if (!validChartTypes.includes(data.chartType)) {
        return null;
      }

      return {
        type: 'chart',
        data: data.data,
        chartType: data.chartType,
        title: data.title,
        id: data.id
      };
    });

    // Metric validator
    this.registerComponent('metric', (data: any): ValidComponent | null => {
      if (typeof data.label !== 'string' || data.label.trim() === '') {
        return null;
      }

      if (data.value === undefined || data.value === null) {
        return null;
      }

      return {
        type: 'metric',
        label: data.label,
        value: data.value,
        unit: data.unit,
        id: data.id
      };
    });

    // Grid validator (handles nested components)
    this.registerComponent('grid', (data: any): ValidComponent | null => {
      if (typeof data.columns !== 'number' || data.columns < 1) {
        return null;
      }

      if (!Array.isArray(data.items)) {
        return null;
      }

      // Recursively render nested components
      const renderedItems = data.items
        .map((item: any) => this.renderComponent(item))
        .filter((result: RenderResult): result is RenderedComponent => result.isValid);

      return {
        type: 'grid',
        columns: data.columns,
        items: renderedItems,
        id: data.id
      };
    });

    // List validator (handles nested components)
    this.registerComponent('list', (data: any): ValidComponent | null => {
      if (!Array.isArray(data.items)) {
        return null;
      }

      // Recursively render nested components
      const renderedItems = data.items
        .map((item: any) => this.renderComponent(item))
        .filter((result: RenderResult): result is RenderedComponent => result.isValid);

      return {
        type: 'list',
        items: renderedItems,
        orientation: data.orientation || 'vertical',
        id: data.id
      };
    });
  }

  /**
   * Render a single component
   */
  private renderComponent(data: any): RenderResult {
    // Type guard: ensure data is an object
    if (typeof data !== 'object' || data === null) {
      return {
        type: 'invalid',
        rawData: data,
        isValid: false,
        error: 'Component data must be an object'
      };
    }

    // Check if type field exists
    if (typeof data.type !== 'string') {
      return {
        type: 'unknown',
        rawData: data,
        isValid: false,
        error: 'Component must have a "type" field'
      };
    }

    // Check if we have a validator for this type
    const validator = this.registry.get(data.type as ComponentType);

    if (!validator) {
      return {
        type: data.type,
        rawData: data,
        isValid: false,
        error: `Unknown component type: "${data.type}"`
      };
    }

    // Run the validator
    try {
      const validComponent = validator(data);

      if (validComponent === null) {
        return {
          type: data.type,
          rawData: data,
          isValid: false,
          error: `Invalid data for component type "${data.type}"`
        };
      }

      return {
        component: validComponent,
        isValid: true
      };
    } catch (error) {
      return {
        type: data.type,
        rawData: data,
        isValid: false,
        error: `Validation error: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * Render a complete screen configuration
   */
  render(config: unknown): RenderOutput {
    // Validate config structure
    if (typeof config !== 'object' || config === null) {
      return {
        screen: 'unknown',
        components: [],
        errors: ['Invalid configuration: must be an object']
      };
    }

    const data = config as any;

    // Validate screen name
    if (typeof data.screen !== 'string') {
      return {
        screen: 'unknown',
        components: [],
        errors: ['Invalid configuration: missing "screen" field']
      };
    }

    // Validate components array
    if (!Array.isArray(data.components)) {
      return {
        screen: data.screen,
        components: [],
        errors: ['Invalid configuration: "components" must be an array']
      };
    }

    // Render all components
    const results = data.components.map((comp: any) => this.renderComponent(comp));

    // Collect errors
    const errors = results
      .filter((result: RenderResult): result is UnknownComponent => !result.isValid)
      .map((result: UnknownComponent) => result.error);

    return {
      screen: data.screen,
      components: results,
      errors
    };
  }
}

// Test data
export const testConfig = {
  "screen": "dashboard",
  "components": [
    { "type": "header", "text": "GPU Metrics", "style": "large" },
    { "type": "metric", "label": "GPU Utilization", "value": 85.5, "unit": "%" },
    { "type": "chart", "data": [1, 2, 3, 4, 5], "chartType": "line", "title": "Performance" },
    { "type": "grid", "columns": 2, "items": [
      { "type": "metric", "label": "Temperature", "value": 75, "unit": "°C" },
      { "type": "metric", "label": "Memory", "value": 12.5, "unit": "GB" }
    ]},
    { "type": "unknown", "data": "should handle gracefully" },
    { "type": "header", "text": "" }, // Invalid: empty text
    { "type": "chart", "data": [], "chartType": "line" } // Invalid: empty data
  ]
};