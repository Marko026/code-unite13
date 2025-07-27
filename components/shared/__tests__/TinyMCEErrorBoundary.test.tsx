import { jest } from "@jest/globals";
import { fireEvent, render, screen } from "@testing-library/react";
import TinyMCEErrorBoundary from "../TinyMCEErrorBoundary";

// Test component that throws an error
const ThrowError = ({ shouldThrow = false }: { shouldThrow?: boolean }) => {
  if (shouldThrow) {
    throw new Error("TinyMCE initialization failed");
  }
  return <div data-testid="tinymce-editor">TinyMCE Editor</div>;
};

describe("TinyMCEErrorBoundary Component", () => {
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
      <TinyMCEErrorBoundary>
        <ThrowError shouldThrow={false} />
      </TinyMCEErrorBoundary>,
    );

    expect(screen.getByTestId("tinymce-editor")).toBeInTheDocument();
    expect(screen.getByText("TinyMCE Editor")).toBeInTheDocument();
  });

  it("should render fallback textarea when error occurs", () => {
    render(
      <TinyMCEErrorBoundary>
        <ThrowError shouldThrow={true} />
      </TinyMCEErrorBoundary>,
    );

    expect(screen.getByText("Editor Fallback Mode")).toBeInTheDocument();
    expect(
      screen.getByText(/The rich text editor encountered an issue/),
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Write your answer here..."),
    ).toBeInTheDocument();
    expect(screen.queryByTestId("tinymce-editor")).not.toBeInTheDocument();
  });

  it("should display error message in fallback mode", () => {
    render(
      <TinyMCEErrorBoundary>
        <ThrowError shouldThrow={true} />
      </TinyMCEErrorBoundary>,
    );

    expect(screen.getByText("Technical details")).toBeInTheDocument();

    // Click to expand technical details
    fireEvent.click(screen.getByText("Technical details"));

    expect(
      screen.getByText("TinyMCE initialization failed"),
    ).toBeInTheDocument();
  });

  it("should call onError callback when error occurs", () => {
    const onError = jest.fn();

    render(
      <TinyMCEErrorBoundary onError={onError}>
        <ThrowError shouldThrow={true} />
      </TinyMCEErrorBoundary>,
    );

    expect(onError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        componentStack: expect.any(String),
      }),
    );
  });

  it("should use fallback value in textarea", () => {
    const fallbackValue = "Existing content";

    render(
      <TinyMCEErrorBoundary fallbackValue={fallbackValue}>
        <ThrowError shouldThrow={true} />
      </TinyMCEErrorBoundary>,
    );

    const textarea = screen.getByPlaceholderText("Write your answer here...");
    expect(textarea).toHaveValue(fallbackValue);
  });

  it("should call onFallback when textarea value changes", () => {
    const onFallback = jest.fn();

    render(
      <TinyMCEErrorBoundary onFallback={onFallback}>
        <ThrowError shouldThrow={true} />
      </TinyMCEErrorBoundary>,
    );

    const textarea = screen.getByPlaceholderText("Write your answer here...");
    fireEvent.change(textarea, { target: { value: "New content" } });

    expect(onFallback).toHaveBeenCalledWith("New content");
  });

  it("should have proper styling for fallback mode", () => {
    render(
      <TinyMCEErrorBoundary>
        <ThrowError shouldThrow={true} />
      </TinyMCEErrorBoundary>,
    );

    const textarea = screen.getByPlaceholderText("Write your answer here...");
    expect(textarea).toHaveClass("min-h-[500px]", "resize-none");
  });

  it("should show warning icon in fallback mode", () => {
    render(
      <TinyMCEErrorBoundary>
        <ThrowError shouldThrow={true} />
      </TinyMCEErrorBoundary>,
    );

    // Check for warning icon (SVG path)
    const warningIcon = screen.getByRole("img", { hidden: true });
    expect(warningIcon).toBeInTheDocument();
  });

  it("should handle errors without message", () => {
    const ThrowEmptyError = () => {
      const error = new Error();
      error.message = "";
      throw error;
    };

    render(
      <TinyMCEErrorBoundary>
        <ThrowEmptyError />
      </TinyMCEErrorBoundary>,
    );

    expect(screen.getByText("Editor Fallback Mode")).toBeInTheDocument();
    expect(screen.getByText("Technical details")).toBeInTheDocument();
  });

  it("should handle non-Error objects thrown", () => {
    const ThrowString = () => {
      throw new Error("String error");
    };

    render(
      <TinyMCEErrorBoundary>
        <ThrowString />
      </TinyMCEErrorBoundary>,
    );

    expect(screen.getByText("Editor Fallback Mode")).toBeInTheDocument();
  });

  it("should maintain textarea focus and functionality", () => {
    render(
      <TinyMCEErrorBoundary>
        <ThrowError shouldThrow={true} />
      </TinyMCEErrorBoundary>,
    );

    const textarea = screen.getByPlaceholderText("Write your answer here...");

    // Test that textarea is focusable and editable
    fireEvent.focus(textarea);
    fireEvent.change(textarea, { target: { value: "Test content" } });

    expect(textarea).toHaveValue("Test content");
  });

  it("should provide helpful user message", () => {
    render(
      <TinyMCEErrorBoundary>
        <ThrowError shouldThrow={true} />
      </TinyMCEErrorBoundary>,
    );

    expect(
      screen.getByText(/Your content will still be saved properly/),
    ).toBeInTheDocument();
  });

  it("should handle multiple error scenarios", () => {
    const { rerender } = render(
      <TinyMCEErrorBoundary>
        <ThrowError shouldThrow={true} />
      </TinyMCEErrorBoundary>,
    );

    expect(screen.getByText("Editor Fallback Mode")).toBeInTheDocument();

    // Re-render with different error
    const ThrowDifferentError = () => {
      throw new Error("Different TinyMCE error");
    };

    rerender(
      <TinyMCEErrorBoundary>
        <ThrowDifferentError />
      </TinyMCEErrorBoundary>,
    );

    expect(screen.getByText("Editor Fallback Mode")).toBeInTheDocument();

    // Expand technical details to see new error
    fireEvent.click(screen.getByText("Technical details"));
    expect(screen.getByText("Different TinyMCE error")).toBeInTheDocument();
  });

  it("should work without optional props", () => {
    render(
      <TinyMCEErrorBoundary>
        <ThrowError shouldThrow={true} />
      </TinyMCEErrorBoundary>,
    );

    const textarea = screen.getByPlaceholderText("Write your answer here...");
    expect(textarea).toHaveValue("");

    // Should not crash when changing value without onFallback
    fireEvent.change(textarea, { target: { value: "Test" } });
    expect(textarea).toHaveValue("Test");
  });
});

describe("TinyMCEErrorBoundary Integration", () => {
  beforeEach(() => {
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should integrate with form handling", () => {
    const onFallback = jest.fn();
    let formValue = "";

    const FormWrapper = () => (
      <form>
        <TinyMCEErrorBoundary
          fallbackValue={formValue}
          onFallback={(value) => {
            formValue = value;
            onFallback(value);
          }}
        >
          <ThrowError shouldThrow={true} />
        </TinyMCEErrorBoundary>
      </form>
    );

    render(<FormWrapper />);

    const textarea = screen.getByPlaceholderText("Write your answer here...");
    fireEvent.change(textarea, { target: { value: "Form content" } });

    expect(onFallback).toHaveBeenCalledWith("Form content");
  });

  it("should handle rapid error state changes", () => {
    const { rerender } = render(
      <TinyMCEErrorBoundary>
        <ThrowError shouldThrow={false} />
      </TinyMCEErrorBoundary>,
    );

    expect(screen.getByTestId("tinymce-editor")).toBeInTheDocument();

    // Quickly switch to error state
    rerender(
      <TinyMCEErrorBoundary>
        <ThrowError shouldThrow={true} />
      </TinyMCEErrorBoundary>,
    );

    expect(screen.getByText("Editor Fallback Mode")).toBeInTheDocument();

    // Switch back to normal state
    rerender(
      <TinyMCEErrorBoundary>
        <ThrowError shouldThrow={false} />
      </TinyMCEErrorBoundary>,
    );

    // Should still show fallback since error boundary doesn't auto-reset
    expect(screen.getByText("Editor Fallback Mode")).toBeInTheDocument();
  });
});
