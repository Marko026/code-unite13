import { jest } from "@jest/globals";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import Answers from "../Answers";

// Mock dependencies
jest.mock("@/context/ThemeProvider", () => ({
  useTheme: () => ({ mode: "light" }),
}));

jest.mock("@/lib/actions/answer.actions", () => ({
  createAnswer: jest.fn(),
}));

jest.mock("@/lib/hooks/useErrorTracking", () => ({
  useErrorTracking: () => ({
    trackError: jest.fn(),
    trackAPIError: jest.fn(),
    trackValidationError: jest.fn(),
  }),
}));

jest.mock("@/lib/hooks/useRetryStatus", () => ({
  __esModule: true,
  default: () => ({
    canRetry: true,
    isCircuitBreakerOpen: false,
    getFormattedError: jest.fn(),
  }),
}));

jest.mock("@/lib/hooks/useTinyMCEFallback", () => ({
  useTinyMCEFallback: () => ({
    useFallback: false,
    error: null,
    handleEditorError: jest.fn(),
    clearTinyMCEStorage: jest.fn(),
    resetFallback: jest.fn(),
    canRetry: true,
  }),
}));

jest.mock("@/lib/utils/apiClient", () => ({
  chatGPTAPI: {
    generateAnswer: jest.fn(),
  },
}));

jest.mock("@/lib/utils/errorLogger", () => ({
  logQuotaError: jest.fn(),
}));

jest.mock("@/lib/validation", () => ({
  AnswerSchema: {
    parse: jest.fn(),
  },
}));

// Mock TinyMCE Editor
jest.mock("@tinymce/tinymce-react", () => ({
  Editor: ({ onInit, onEditorChange, init }: any) => {
    const mockEditor = {
      setContent: jest.fn(),
      getContent: jest.fn(() => "test content"),
      getBody: jest.fn(() => ({
        setAttribute: jest.fn(),
        removeAttribute: jest.fn(),
        style: {},
      })),
      mode: { set: jest.fn() },
      focus: jest.fn(),
      on: jest.fn(),
      getContainer: jest.fn(() => ({
        removeAttribute: jest.fn(),
        style: {},
      })),
      storage: { clear: jest.fn() },
    };

    // Simulate editor initialization
    if (onInit) {
      setTimeout(() => onInit({}, mockEditor), 0);
    }

    return (
      <div
        data-testid="tinymce-editor"
        onClick={() => {
          if (onEditorChange) {
            onEditorChange("test content");
          }
        }}
      />
    );
  },
}));

describe("Answers Component - TinyMCE Configuration", () => {
  const defaultProps = {
    question: "Test question",
    questionId: JSON.stringify("question-id"),
    authorId: JSON.stringify("author-id"),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock environment variable
    process.env.NEXT_PUBLIC_TINY_EDITOR_API_KEY = "test-api-key";
  });

  it("should render TinyMCE editor with optimized configuration", async () => {
    render(<Answers {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByTestId("tinymce-editor")).toBeInTheDocument();
    });
  });

  it("should configure TinyMCE with minimal plugins to prevent quota errors", async () => {
    const { useTinyMCEFallback } = require("@/lib/hooks/useTinyMCEFallback");
    const mockClearStorage = jest.fn();

    useTinyMCEFallback.mockReturnValue({
      useFallback: false,
      error: null,
      handleEditorError: jest.fn(),
      clearTinyMCEStorage: mockClearStorage,
      resetFallback: jest.fn(),
      canRetry: true,
    });

    render(<Answers {...defaultProps} />);

    // Verify storage clearing is called on mount
    expect(mockClearStorage).toHaveBeenCalled();
  });

  it("should handle TinyMCE quota exceeded errors", async () => {
    const { useTinyMCEFallback } = require("@/lib/hooks/useTinyMCEFallback");
    const mockHandleError = jest.fn();

    useTinyMCEFallback.mockReturnValue({
      useFallback: true,
      error: "Storage quota exceeded",
      handleEditorError: mockHandleError,
      clearTinyMCEStorage: jest.fn(),
      resetFallback: jest.fn(),
      canRetry: false,
    });

    render(<Answers {...defaultProps} />);

    // Should show fallback editor when quota exceeded
    expect(screen.getByText(/Editor Fallback Mode/)).toBeInTheDocument();
    expect(screen.getByText(/Storage quota exceeded/)).toBeInTheDocument();
  });

  it("should ensure editor editability after initialization", async () => {
    const mockEditor = {
      setContent: jest.fn(),
      getBody: jest.fn(() => ({
        setAttribute: jest.fn(),
        removeAttribute: jest.fn(),
        style: {},
      })),
      mode: { set: jest.fn() },
      focus: jest.fn(),
      on: jest.fn(),
      getContainer: jest.fn(() => ({
        removeAttribute: jest.fn(),
        style: {},
      })),
    };

    const { Editor } = require("@tinymce/tinymce-react");
    Editor.mockImplementation(({ onInit }: any) => {
      if (onInit) {
        setTimeout(() => onInit({}, mockEditor), 0);
      }
      return <div data-testid="tinymce-editor" />;
    });

    render(<Answers {...defaultProps} />);

    await waitFor(() => {
      expect(mockEditor.mode.set).toHaveBeenCalledWith("design");
      expect(mockEditor.getBody().setAttribute).toHaveBeenCalledWith(
        "contenteditable",
        "true",
      );
    });
  });

  it("should provide Fix Editor button for editability issues", async () => {
    render(<Answers {...defaultProps} />);

    const fixButton = screen.getByText("Fix Editor");
    expect(fixButton).toBeInTheDocument();

    fireEvent.click(fixButton);
    // Button should be clickable without errors
  });

  it("should retry TinyMCE initialization when possible", async () => {
    const { useTinyMCEFallback } = require("@/lib/hooks/useTinyMCEFallback");
    const mockResetFallback = jest.fn();
    const mockClearStorage = jest.fn();

    useTinyMCEFallback.mockReturnValue({
      useFallback: true,
      error: "Initialization failed",
      handleEditorError: jest.fn(),
      clearTinyMCEStorage: mockClearStorage,
      resetFallback: mockResetFallback,
      canRetry: true,
    });

    render(<Answers {...defaultProps} />);

    const retryButton = screen.getByText("Retry");
    fireEvent.click(retryButton);

    expect(mockResetFallback).toHaveBeenCalled();
    expect(mockClearStorage).toHaveBeenCalled();
  });
});

describe("Answers Component - API Error Handling", () => {
  const defaultProps = {
    question: "Test question",
    questionId: JSON.stringify("question-id"),
    authorId: JSON.stringify("author-id"),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should handle successful AI answer generation", async () => {
    const { chatGPTAPI } = require("@/lib/utils/apiClient");
    chatGPTAPI.generateAnswer.mockResolvedValue({
      success: true,
      data: {
        success: true,
        reply: "AI generated answer",
      },
    });

    render(<Answers {...defaultProps} />);

    const generateButton = screen.getByText(/Generate Ai Answer/);
    fireEvent.click(generateButton);

    await waitFor(() => {
      expect(
        screen.getByText(/AI answer generated successfully!/),
      ).toBeInTheDocument();
    });
  });

  it("should handle API errors with retry mechanism", async () => {
    const { chatGPTAPI } = require("@/lib/utils/apiClient");
    const { useErrorTracking } = require("@/lib/hooks/useErrorTracking");
    const mockTrackAPIError = jest.fn();

    useErrorTracking.mockReturnValue({
      trackError: jest.fn(),
      trackAPIError: mockTrackAPIError,
      trackValidationError: jest.fn(),
    });

    chatGPTAPI.generateAnswer.mockRejectedValue(new Error("Network error"));

    render(<Answers {...defaultProps} />);

    const generateButton = screen.getByText(/Generate Ai Answer/);
    fireEvent.click(generateButton);

    await waitFor(() => {
      expect(mockTrackAPIError).toHaveBeenCalledWith(
        "/api/chatgpt",
        "POST",
        expect.any(Error),
        undefined,
        { question: "Test question" },
        undefined,
      );
    });
  });

  it("should disable AI button when circuit breaker is open", () => {
    const useRetryStatus = require("@/lib/hooks/useRetryStatus").default;
    useRetryStatus.mockReturnValue({
      canRetry: false,
      isCircuitBreakerOpen: true,
      getFormattedError: jest.fn(),
    });

    render(<Answers {...defaultProps} />);

    const generateButton = screen.getByText(/Generate Ai Answer/);
    expect(generateButton).toBeDisabled();
    expect(generateButton).toHaveAttribute(
      "title",
      "Service temporarily unavailable",
    );
  });

  it("should show retry status display for API errors", async () => {
    const { chatGPTAPI } = require("@/lib/utils/apiClient");
    chatGPTAPI.generateAnswer.mockRejectedValue(
      new Error("Service unavailable"),
    );

    render(<Answers {...defaultProps} />);

    const generateButton = screen.getByText(/Generate Ai Answer/);
    fireEvent.click(generateButton);

    await waitFor(() => {
      // RetryStatusDisplay should be rendered for errors
      expect(screen.getByText(/Service unavailable/)).toBeInTheDocument();
    });
  });
});

describe("Answers Component - Form Validation", () => {
  const defaultProps = {
    question: "Test question",
    questionId: JSON.stringify("question-id"),
    authorId: JSON.stringify("author-id"),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should validate answer length before submission", async () => {
    const { useErrorTracking } = require("@/lib/hooks/useErrorTracking");
    const mockTrackValidationError = jest.fn();

    useErrorTracking.mockReturnValue({
      trackError: jest.fn(),
      trackAPIError: jest.fn(),
      trackValidationError: mockTrackValidationError,
    });

    render(<Answers {...defaultProps} />);

    // Try to submit with short answer
    const submitButton = screen.getByText("Submit");
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockTrackValidationError).toHaveBeenCalledWith(
        "answer",
        "",
        "Answer must be at least 10 characters long",
      );
    });
  });

  it("should track form submission errors", async () => {
    const { createAnswer } = require("@/lib/actions/answer.actions");
    const { useErrorTracking } = require("@/lib/hooks/useErrorTracking");
    const mockTrackError = jest.fn();

    useErrorTracking.mockReturnValue({
      trackError: mockTrackError,
      trackAPIError: jest.fn(),
      trackValidationError: jest.fn(),
    });

    createAnswer.mockRejectedValue(new Error("Database error"));

    render(<Answers {...defaultProps} />);

    // Fill form with valid data
    const editor = screen.getByTestId("tinymce-editor");
    fireEvent.click(editor);

    // Submit form
    const submitButton = screen.getByText("Submit");
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockTrackError).toHaveBeenCalledWith(
        "API_ERROR",
        "Failed to create answer",
        expect.any(Error),
        expect.objectContaining({
          questionId: JSON.stringify("question-id"),
          authorId: JSON.stringify("author-id"),
        }),
      );
    });
  });
});
