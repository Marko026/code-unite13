import { jest } from "@jest/globals";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import FallbackTextEditor from "../FallbackTextEditor";

// Mock window.prompt for link insertion tests
Object.defineProperty(window, "prompt", {
  writable: true,
  value: jest.fn(),
});

describe("FallbackTextEditor Component", () => {
  const defaultProps = {
    value: "",
    onChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render textarea with default props", () => {
    render(<FallbackTextEditor {...defaultProps} />);

    const textarea = screen.getByPlaceholderText("Write your answer here...");
    expect(textarea).toBeInTheDocument();
    expect(textarea).toHaveClass("min-h-[500px]", "resize-none");
  });

  it("should render toolbar by default", () => {
    render(<FallbackTextEditor {...defaultProps} />);

    expect(screen.getByTitle("Bold (Ctrl+B)")).toBeInTheDocument();
    expect(screen.getByTitle("Italic (Ctrl+I)")).toBeInTheDocument();
    expect(screen.getByTitle("Bullet List")).toBeInTheDocument();
    expect(screen.getByTitle("Numbered List")).toBeInTheDocument();
    expect(screen.getByTitle("Insert Link")).toBeInTheDocument();
  });

  it("should hide toolbar when showToolbar is false", () => {
    render(<FallbackTextEditor {...defaultProps} showToolbar={false} />);

    expect(screen.queryByTitle("Bold (Ctrl+B)")).not.toBeInTheDocument();
    expect(screen.queryByTitle("Italic (Ctrl+I)")).not.toBeInTheDocument();
  });

  it("should use custom placeholder", () => {
    const customPlaceholder = "Enter your text here...";
    render(
      <FallbackTextEditor {...defaultProps} placeholder={customPlaceholder} />,
    );

    expect(screen.getByPlaceholderText(customPlaceholder)).toBeInTheDocument();
  });

  it("should display current value", () => {
    const value = "Test content";
    render(<FallbackTextEditor {...defaultProps} value={value} />);

    const textarea = screen.getByDisplayValue(value);
    expect(textarea).toBeInTheDocument();
  });

  it("should call onChange when text changes", async () => {
    const onChange = jest.fn();
    render(<FallbackTextEditor {...defaultProps} onChange={onChange} />);

    const textarea = screen.getByPlaceholderText("Write your answer here...");
    await userEvent.type(textarea, "New text");

    expect(onChange).toHaveBeenCalledWith("New text");
  });

  it("should call onBlur when textarea loses focus", async () => {
    const onBlur = jest.fn();
    render(<FallbackTextEditor {...defaultProps} onBlur={onBlur} />);

    const textarea = screen.getByPlaceholderText("Write your answer here...");
    await userEvent.click(textarea);
    await userEvent.tab(); // Move focus away

    expect(onBlur).toHaveBeenCalled();
  });
});

describe("FallbackTextEditor Toolbar Functionality", () => {
  const defaultProps = {
    value: "Test content",
    onChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should make text bold", async () => {
    const onChange = jest.fn();
    render(<FallbackTextEditor {...defaultProps} onChange={onChange} />);

    const boldButton = screen.getByTitle("Bold (Ctrl+B)");
    await userEvent.click(boldButton);

    expect(onChange).toHaveBeenCalledWith("**Test content**");
  });

  it("should make text italic", async () => {
    const onChange = jest.fn();
    render(<FallbackTextEditor {...defaultProps} onChange={onChange} />);

    const italicButton = screen.getByTitle("Italic (Ctrl+I)");
    await userEvent.click(italicButton);

    expect(onChange).toHaveBeenCalledWith("*Test content*");
  });

  it("should create bullet list", async () => {
    const onChange = jest.fn();
    render(
      <FallbackTextEditor
        {...defaultProps}
        value="Item 1"
        onChange={onChange}
      />,
    );

    const listButton = screen.getByTitle("Bullet List");
    await userEvent.click(listButton);

    expect(onChange).toHaveBeenCalledWith("- Item 1");
  });

  it("should not duplicate bullet list marker", async () => {
    const onChange = jest.fn();
    render(
      <FallbackTextEditor
        {...defaultProps}
        value="- Already a list"
        onChange={onChange}
      />,
    );

    const listButton = screen.getByTitle("Bullet List");
    await userEvent.click(listButton);

    // Should not call onChange since it's already a list
    expect(onChange).not.toHaveBeenCalled();
  });

  it("should create numbered list", async () => {
    const onChange = jest.fn();
    render(
      <FallbackTextEditor
        {...defaultProps}
        value="Item 1"
        onChange={onChange}
      />,
    );

    const numberedListButton = screen.getByTitle("Numbered List");
    await userEvent.click(numberedListButton);

    expect(onChange).toHaveBeenCalledWith("1. Item 1");
  });

  it("should not duplicate numbered list marker", async () => {
    const onChange = jest.fn();
    render(
      <FallbackTextEditor
        {...defaultProps}
        value="1. Already numbered"
        onChange={onChange}
      />,
    );

    const numberedListButton = screen.getByTitle("Numbered List");
    await userEvent.click(numberedListButton);

    // Should not call onChange since it's already numbered
    expect(onChange).not.toHaveBeenCalled();
  });

  it("should insert link with URL prompt", async () => {
    const onChange = jest.fn();
    const mockPrompt = window.prompt as jest.MockedFunction<
      typeof window.prompt
    >;
    mockPrompt.mockReturnValue("https://example.com");

    render(
      <FallbackTextEditor
        {...defaultProps}
        value="link text"
        onChange={onChange}
      />,
    );

    const linkButton = screen.getByTitle("Insert Link");
    await userEvent.click(linkButton);

    expect(mockPrompt).toHaveBeenCalledWith("Enter URL:");
    expect(onChange).toHaveBeenCalledWith("[link text](https://example.com)");
  });

  it("should handle cancelled link insertion", async () => {
    const onChange = jest.fn();
    const mockPrompt = window.prompt as jest.MockedFunction<
      typeof window.prompt
    >;
    mockPrompt.mockReturnValue(null); // User cancelled

    render(<FallbackTextEditor {...defaultProps} onChange={onChange} />);

    const linkButton = screen.getByTitle("Insert Link");
    await userEvent.click(linkButton);

    expect(onChange).not.toHaveBeenCalled();
  });

  it("should use default link text when no text selected", async () => {
    const onChange = jest.fn();
    const mockPrompt = window.prompt as jest.MockedFunction<
      typeof window.prompt
    >;
    mockPrompt.mockReturnValue("https://example.com");

    render(
      <FallbackTextEditor {...defaultProps} value="" onChange={onChange} />,
    );

    const linkButton = screen.getByTitle("Insert Link");
    await userEvent.click(linkButton);

    expect(onChange).toHaveBeenCalledWith("[link text](https://example.com)");
  });
});

describe("FallbackTextEditor Text Selection", () => {
  const defaultProps = {
    value: "Hello world test content",
    onChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should handle text selection for formatting", async () => {
    const onChange = jest.fn();
    render(<FallbackTextEditor {...defaultProps} onChange={onChange} />);

    const textarea = screen.getByDisplayValue("Hello world test content");

    // Simulate text selection
    textarea.setSelectionRange(6, 11); // Select "world"
    fireEvent.select(textarea);

    const boldButton = screen.getByTitle("Bold (Ctrl+B)");
    await userEvent.click(boldButton);

    expect(onChange).toHaveBeenCalledWith("Hello **world** test content");
  });

  it("should maintain cursor position after formatting", async () => {
    const onChange = jest.fn();
    render(<FallbackTextEditor {...defaultProps} onChange={onChange} />);

    const textarea = screen.getByDisplayValue("Hello world test content");

    // Set cursor position
    textarea.setSelectionRange(5, 5); // After "Hello"

    const boldButton = screen.getByTitle("Bold (Ctrl+B)");
    await userEvent.click(boldButton);

    // Should insert bold markers at cursor position
    expect(onChange).toHaveBeenCalledWith("Hello**** world test content");
  });
});

describe("FallbackTextEditor Styling and Layout", () => {
  const defaultProps = {
    value: "",
    onChange: jest.fn(),
  };

  it("should apply custom className", () => {
    const customClass = "custom-editor-class";
    render(<FallbackTextEditor {...defaultProps} className={customClass} />);

    const container = screen
      .getByPlaceholderText("Write your answer here...")
      .closest("div");
    expect(container).toHaveClass(customClass);
  });

  it("should show formatting tips", () => {
    render(<FallbackTextEditor {...defaultProps} />);

    expect(screen.getByText("Formatting tips:")).toBeInTheDocument();
    expect(screen.getByText(/Use \*\*bold\*\*/)).toBeInTheDocument();
    expect(screen.getByText(/\*italic\*/)).toBeInTheDocument();
  });

  it("should have proper toolbar styling", () => {
    render(<FallbackTextEditor {...defaultProps} />);

    const toolbar = screen.getByTitle("Bold (Ctrl+B)").closest("div");
    expect(toolbar).toHaveClass("bg-gray-50", "dark:bg-gray-800");
  });

  it("should adjust textarea styling based on toolbar visibility", () => {
    const { rerender } = render(
      <FallbackTextEditor {...defaultProps} showToolbar={true} />,
    );

    let textarea = screen.getByPlaceholderText("Write your answer here...");
    expect(textarea).toHaveClass("rounded-t-none");

    rerender(<FallbackTextEditor {...defaultProps} showToolbar={false} />);

    textarea = screen.getByPlaceholderText("Write your answer here...");
    expect(textarea).not.toHaveClass("rounded-t-none");
  });
});

describe("FallbackTextEditor Edge Cases", () => {
  const defaultProps = {
    value: "",
    onChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should handle empty value", () => {
    render(<FallbackTextEditor {...defaultProps} value="" />);

    const textarea = screen.getByPlaceholderText("Write your answer here...");
    expect(textarea).toHaveValue("");
  });

  it("should handle very long text", () => {
    const longText = "x".repeat(10000);
    render(<FallbackTextEditor {...defaultProps} value={longText} />);

    const textarea = screen.getByDisplayValue(longText);
    expect(textarea).toBeInTheDocument();
  });

  it("should handle special characters in text", async () => {
    const specialText = "Special chars: <>&\"'";
    const onChange = jest.fn();
    render(<FallbackTextEditor {...defaultProps} onChange={onChange} />);

    const textarea = screen.getByPlaceholderText("Write your answer here...");
    await userEvent.type(textarea, specialText);

    expect(onChange).toHaveBeenCalledWith(specialText);
  });

  it("should handle multiline text for list formatting", async () => {
    const multilineText = "Line 1\nLine 2\nLine 3";
    const onChange = jest.fn();
    render(
      <FallbackTextEditor
        {...defaultProps}
        value={multilineText}
        onChange={onChange}
      />,
    );

    const textarea = screen.getByDisplayValue(multilineText);

    // Position cursor on second line
    textarea.setSelectionRange(7, 7); // Start of "Line 2"

    const listButton = screen.getByTitle("Bullet List");
    await userEvent.click(listButton);

    expect(onChange).toHaveBeenCalledWith("Line 1\n- Line 2\nLine 3");
  });

  it("should handle missing optional props gracefully", () => {
    const minimalProps = {
      value: "test",
      onChange: jest.fn(),
    };

    expect(() => {
      render(<FallbackTextEditor {...minimalProps} />);
    }).not.toThrow();

    expect(screen.getByDisplayValue("test")).toBeInTheDocument();
  });
});
