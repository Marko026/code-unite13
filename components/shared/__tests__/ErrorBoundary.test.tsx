import { jest } from "@jest/globals";
import { fireEvent, render, screen } from "@testing-library/react";
import {
  ErrorBoundary,
  useErrorHandler,
  withErrorBoundary,
} from "../ErrorBoundary";

// Mock the error logger
jest.mock("@/lib/utils/errorLogger", () => ({
  logReactError: jest.fn(),
}));

// Test component that throws an error
const ThrowError = ({ shouldThrow = false }: { shouldThrow?: boolean }) => {
  if (shouldThrow) {
    throw new Error("Test error");
  }
  return <div>No error</div>;
};

// Test component for testing error handler hook
const TestErrorHandler = () => {
  const handleError = useErrorHandler();

  return (
    <button
      onClick={() => {
        try {
          throw new Error("Hook error");
        } catch (error) {
          handleError(error as Error);
        }
      }}
    >
      Trigger Error
    </button>
  );
};

describe("ErrorBoundary Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Suppress console.error for cleaner test output
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should render children when no error occurs", () => {
    render(
      <ErrorBoundary>
        <div>Test content</div>
      </ErrorBoundary>,
    );

    expect(screen.getByText("Test content")).toBeInTheDocument();
  });

  it("should render default error UI when error occurs", () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>,
    );

    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    expect(
      screen.getByText(/We encountered an unexpected error/),
    ).toBeInTheDocument();
    expect(screen.getByText("Try Again")).toBeInTheDocument();
    expect(screen.getByText("Reload Page")).toBeInTheDocument();
  });

  it("should render custom fallback UI when provided", () => {
    const customFallback = <div>Custom error message</div>;

    render(
      <ErrorBoundary fallback={customFallback}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>,
    );

    expect(screen.getByText("Custom error message")).toBeInTheDocument();
    expect(screen.queryByText("Something went wrong")).not.toBeInTheDocument();
  });

  it("should call onError callback when error occurs", () => {
    const onError = jest.fn();

    render(
      <ErrorBoundary onError={onError}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>,
    );

    expect(onError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        componentStack: expect.any(String),
      }),
    );
  });

  it("should log error using error logger", () => {
    const { logReactError } = require("@/lib/utils/errorLogger");

    render(
      <ErrorBoundary componentName="TestComponent">
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>,
    );

    expect(logReactError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        componentStack: expect.any(String),
      }),
      "TestComponent",
    );
  });

  it("should reset error state when Try Again is clicked", () => {
    const { rerender } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>,
    );

    expect(screen.getByText("Something went wrong")).toBeInTheDocument();

    const tryAgainButton = screen.getByText("Try Again");
    fireEvent.click(tryAgainButton);

    // Re-render with no error
    rerender(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>,
    );

    expect(screen.getByText("No error")).toBeInTheDocument();
    expect(screen.queryByText("Something went wrong")).not.toBeInTheDocument();
  });

  it("should reload page when Reload Page is clicked", () => {
    // Mock window.location.reload
    const mockReload = jest.fn();
    Object.defineProperty(window, "location", {
      value: { reload: mockReload },
      writable: true,
    });

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>,
    );

    const reloadButton = screen.getByText("Reload Page");
    fireEvent.click(reloadButton);

    expect(mockReload).toHaveBeenCalled();
  });

  it("should show error details in development mode", () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>,
    );

    expect(
      screen.getByText("Error Details (Development Only)"),
    ).toBeInTheDocument();

    // Restore environment
    process.env.NODE_ENV = originalEnv;
  });

  it("should hide error details in production mode", () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>,
    );

    expect(
      screen.queryByText("Error Details (Development Only)"),
    ).not.toBeInTheDocument();

    // Restore environment
    process.env.NODE_ENV = originalEnv;
  });

  it("should reset on props change when resetOnPropsChange is true", () => {
    let resetKey = "key1";

    const { rerender } = render(
      <ErrorBoundary resetOnPropsChange={true} resetKeys={[resetKey]}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>,
    );

    expect(screen.getByText("Something went wrong")).toBeInTheDocument();

    // Change reset key
    resetKey = "key2";
    rerender(
      <ErrorBoundary resetOnPropsChange={true} resetKeys={[resetKey]}>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>,
    );

    expect(screen.getByText("No error")).toBeInTheDocument();
  });
});

describe("withErrorBoundary HOC", () => {
  beforeEach(() => {
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should wrap component with error boundary", () => {
    const WrappedComponent = withErrorBoundary(ThrowError);

    render(<WrappedComponent shouldThrow={true} />);

    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
  });

  it("should pass error boundary props", () => {
    const onError = jest.fn();
    const WrappedComponent = withErrorBoundary(ThrowError, { onError });

    render(<WrappedComponent shouldThrow={true} />);

    expect(onError).toHaveBeenCalled();
  });

  it("should set correct display name", () => {
    const TestComponent = () => <div>Test</div>;
    TestComponent.displayName = "TestComponent";

    const WrappedComponent = withErrorBoundary(TestComponent);

    expect(WrappedComponent.displayName).toBe(
      "withErrorBoundary(TestComponent)",
    );
  });
});

describe("useErrorHandler Hook", () => {
  beforeEach(() => {
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should log error and re-throw", () => {
    const { logReactError } = require("@/lib/utils/errorLogger");

    expect(() => {
      render(
        <ErrorBoundary>
          <TestErrorHandler />
        </ErrorBoundary>,
      );

      const button = screen.getByText("Trigger Error");
      fireEvent.click(button);
    }).not.toThrow(); // Error should be caught by boundary

    expect(logReactError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        componentStack: "",
      }),
    );

    // Should show error boundary UI
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
  });
});

describe("ErrorBoundary Edge Cases", () => {
  beforeEach(() => {
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should handle errors in componentDidCatch", () => {
    const onError = jest.fn(() => {
      throw new Error("Error in error handler");
    });

    render(
      <ErrorBoundary onError={onError}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>,
    );

    // Should still render error UI despite error in callback
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
  });

  it("should handle multiple consecutive errors", () => {
    const { rerender } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>,
    );

    expect(screen.getByText("Something went wrong")).toBeInTheDocument();

    // Reset and throw another error
    const tryAgainButton = screen.getByText("Try Again");
    fireEvent.click(tryAgainButton);

    rerender(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>,
    );

    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
  });

  it("should handle errors with no message", () => {
    const ThrowEmptyError = () => {
      throw new Error("");
    };

    render(
      <ErrorBoundary>
        <ThrowEmptyError />
      </ErrorBoundary>,
    );

    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
  });

  it("should handle non-Error objects thrown", () => {
    const ThrowString = () => {
      throw "String error";
    };

    render(
      <ErrorBoundary>
        <ThrowString />
      </ErrorBoundary>,
    );

    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
  });
});
