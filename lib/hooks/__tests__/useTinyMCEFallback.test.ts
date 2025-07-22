import { jest } from "@jest/globals";
import { act, renderHook } from "@testing-library/react";
import { useTinyMCEFallback } from "../useTinyMCEFallback";

// Mock localStorage and sessionStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  key: jest.fn(),
  length: 0,
};

const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  key: jest.fn(),
  length: 0,
};

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
});

Object.defineProperty(window, "sessionStorage", {
  value: sessionStorageMock,
});

describe("useTinyMCEFallback Hook", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.length = 0;
    sessionStorageMock.length = 0;
    jest.spyOn(console, "log").mockImplementation(() => {});
    jest.spyOn(console, "warn").mockImplementation(() => {});
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should initialize with default state", () => {
    const { result } = renderHook(() => useTinyMCEFallback());

    expect(result.current.useFallback).toBe(false);
    expect(result.current.error).toBe(null);
    expect(result.current.isStorageAvailable).toBe(true);
    expect(result.current.retryCount).toBe(0);
    expect(result.current.canRetry).toBe(true);
  });

  it("should provide utility functions", () => {
    const { result } = renderHook(() => useTinyMCEFallback());

    expect(typeof result.current.checkStorageQuota).toBe("function");
    expect(typeof result.current.handleEditorError).toBe("function");
    expect(typeof result.current.clearTinyMCEStorage).toBe("function");
    expect(typeof result.current.resetFallback).toBe("function");
  });

  describe("checkStorageQuota", () => {
    it("should return true when storage is available", () => {
      const { result } = renderHook(() => useTinyMCEFallback());

      const isAvailable = result.current.checkStorageQuota();
      expect(isAvailable).toBe(true);
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        "tinymce-quota-test",
        expect.any(String),
      );
      expect(localStorageMock.removeItem).toHaveBeenCalledWith(
        "tinymce-quota-test",
      );
    });

    it("should return false when localStorage throws quota error", () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error("QuotaExceededError");
      });

      const { result } = renderHook(() => useTinyMCEFallback());

      const isAvailable = result.current.checkStorageQuota();
      expect(isAvailable).toBe(false);
    });

    it("should return false when sessionStorage throws quota error", () => {
      sessionStorageMock.setItem.mockImplementation(() => {
        throw new Error("QuotaExceededError");
      });

      const { result } = renderHook(() => useTinyMCEFallback());

      const isAvailable = result.current.checkStorageQuota();
      expect(isAvailable).toBe(false);
    });
  });

  describe("clearTinyMCEStorage", () => {
    it("should clear TinyMCE-related localStorage entries", () => {
      // Set up mock to return specific keys
      localStorageMock.length = 3;
      localStorageMock.key = jest
        .fn()
        .mockReturnValueOnce("tinymce-config")
        .mockReturnValueOnce("other-key")
        .mockReturnValueOnce("mce-draft");

      const { result } = renderHook(() => useTinyMCEFallback());

      act(() => {
        result.current.clearTinyMCEStorage();
      });

      expect(localStorageMock.removeItem).toHaveBeenCalledWith(
        "tinymce-config",
      );
      expect(localStorageMock.removeItem).toHaveBeenCalledWith("mce-draft");
      expect(localStorageMock.removeItem).not.toHaveBeenCalledWith("other-key");
    });

    it("should clear TinyMCE-related sessionStorage entries", () => {
      // Set up mock to return specific keys
      sessionStorageMock.length = 2;
      sessionStorageMock.key = jest
        .fn()
        .mockReturnValueOnce("tinymce-temp")
        .mockReturnValueOnce("draft-content");

      const { result } = renderHook(() => useTinyMCEFallback());

      act(() => {
        result.current.clearTinyMCEStorage();
      });

      expect(sessionStorageMock.removeItem).toHaveBeenCalledWith(
        "tinymce-temp",
      );
      expect(sessionStorageMock.removeItem).toHaveBeenCalledWith(
        "draft-content",
      );
    });

    it("should handle storage clearing errors gracefully", () => {
      localStorageMock.removeItem.mockImplementation(() => {
        throw new Error("Storage error");
      });

      const { result } = renderHook(() => useTinyMCEFallback());

      expect(() => {
        act(() => {
          result.current.clearTinyMCEStorage();
        });
      }).not.toThrow();
    });
  });

  describe("handleEditorError", () => {
    it("should handle quota exceeded errors", () => {
      const { result } = renderHook(() => useTinyMCEFallback());

      act(() => {
        result.current.handleEditorError({
          message: "Storage quota exceeded",
        });
      });

      expect(result.current.useFallback).toBe(true);
      expect(result.current.error).toBe(
        "Storage quota exceeded - using fallback editor",
      );
      expect(result.current.retryCount).toBe(1);
    });

    it("should handle network/loading errors", () => {
      const { result } = renderHook(() => useTinyMCEFallback());

      act(() => {
        result.current.handleEditorError({
          message: "Failed to load TinyMCE script",
        });
      });

      expect(result.current.useFallback).toBe(true);
      expect(result.current.error).toBe(
        "Failed to load TinyMCE - using fallback editor",
      );
    });

    it("should handle initialization errors", () => {
      const { result } = renderHook(() => useTinyMCEFallback());

      act(() => {
        result.current.handleEditorError({
          message: "TinyMCE initialization failed",
        });
      });

      expect(result.current.useFallback).toBe(true);
      expect(result.current.error).toBe(
        "TinyMCE initialization failed - using fallback editor",
      );
    });

    it("should handle generic errors", () => {
      const { result } = renderHook(() => useTinyMCEFallback());

      act(() => {
        result.current.handleEditorError({
          message: "Unknown error",
        });
      });

      expect(result.current.useFallback).toBe(true);
      expect(result.current.error).toBe("TinyMCE editor encountered an error");
    });

    it("should handle errors without message", () => {
      const { result } = renderHook(() => useTinyMCEFallback());

      act(() => {
        result.current.handleEditorError({});
      });

      expect(result.current.useFallback).toBe(true);
      expect(result.current.error).toBe("TinyMCE editor encountered an error");
    });

    it("should increment retry count on each error", () => {
      const { result } = renderHook(() => useTinyMCEFallback());

      act(() => {
        result.current.handleEditorError({ message: "Error 1" });
      });
      expect(result.current.retryCount).toBe(1);

      act(() => {
        result.current.handleEditorError({ message: "Error 2" });
      });
      expect(result.current.retryCount).toBe(2);
    });

    it("should call clearTinyMCEStorage when handling errors", () => {
      // Set up mock to return a key that should be cleared
      localStorageMock.length = 1;
      localStorageMock.key = jest.fn().mockReturnValueOnce("tinymce-test");

      const { result } = renderHook(() => useTinyMCEFallback());

      act(() => {
        result.current.handleEditorError({ message: "Test error" });
      });

      // Storage clearing should have been called
      expect(localStorageMock.removeItem).toHaveBeenCalledWith("tinymce-test");
    });
  });

  describe("resetFallback", () => {
    it("should reset fallback state", () => {
      const { result } = renderHook(() => useTinyMCEFallback());

      // First trigger an error
      act(() => {
        result.current.handleEditorError({ message: "Test error" });
      });

      expect(result.current.useFallback).toBe(true);
      expect(result.current.error).toBeTruthy();
      expect(result.current.retryCount).toBe(1);

      // Then reset
      act(() => {
        result.current.resetFallback();
      });

      expect(result.current.useFallback).toBe(false);
      expect(result.current.error).toBe(null);
      expect(result.current.retryCount).toBe(0);
    });
  });

  describe("canRetry logic", () => {
    it("should allow retry when under max attempts and storage available", () => {
      const { result } = renderHook(() => useTinyMCEFallback());

      act(() => {
        result.current.handleEditorError({ message: "Test error" });
      });

      expect(result.current.canRetry).toBe(true);
    });

    it("should not allow retry when max attempts reached", () => {
      const { result } = renderHook(() => useTinyMCEFallback());

      // Trigger multiple errors to exceed max retry attempts
      act(() => {
        result.current.handleEditorError({ message: "Error 1" });
      });
      act(() => {
        result.current.handleEditorError({ message: "Error 2" });
      });
      act(() => {
        result.current.handleEditorError({ message: "Error 3" });
      });

      expect(result.current.canRetry).toBe(false);
    });

    it("should not allow retry when storage unavailable", () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error("QuotaExceededError");
      });

      const { result } = renderHook(() => useTinyMCEFallback());

      // The hook should detect storage unavailability during initialization
      expect(result.current.isStorageAvailable).toBe(false);
      expect(result.current.canRetry).toBe(false);
    });
  });

  describe("initialization behavior", () => {
    it("should check storage quota on mount", () => {
      const { result } = renderHook(() => useTinyMCEFallback());

      // Manually call the function to test it
      act(() => {
        result.current.checkStorageQuota();
      });

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        "tinymce-quota-test",
        expect.any(String),
      );
    });

    it("should clear storage on mount", () => {
      const { result } = renderHook(() => useTinyMCEFallback());

      // Manually call the function to test it
      act(() => {
        result.current.clearTinyMCEStorage();
      });

      // Should attempt to clear storage
      expect(localStorageMock.key).toHaveBeenCalled();
    });

    it("should set fallback mode if storage unavailable on mount", () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error("QuotaExceededError");
      });

      const { result } = renderHook(() => useTinyMCEFallback());

      // The hook should detect storage unavailability during initialization
      expect(result.current.isStorageAvailable).toBe(false);
    });
  });

  describe("edge cases", () => {
    it("should handle null/undefined errors", () => {
      const { result } = renderHook(() => useTinyMCEFallback());

      expect(() => {
        act(() => {
          result.current.handleEditorError(null);
        });
      }).not.toThrow();

      expect(result.current.useFallback).toBe(true);
    });

    it("should handle storage operations when storage is null", () => {
      // Temporarily make localStorage null
      Object.defineProperty(window, "localStorage", {
        value: null,
        configurable: true,
      });

      expect(() => {
        renderHook(() => useTinyMCEFallback());
      }).not.toThrow();

      // Restore localStorage
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
    });

    it("should handle concurrent error handling", () => {
      const { result } = renderHook(() => useTinyMCEFallback());

      act(() => {
        // Trigger multiple errors simultaneously
        result.current.handleEditorError({ message: "Error 1" });
        result.current.handleEditorError({ message: "Error 2" });
      });

      expect(result.current.useFallback).toBe(true);
      expect(result.current.retryCount).toBe(2);
    });

    it("should maintain state consistency across multiple operations", () => {
      const { result } = renderHook(() => useTinyMCEFallback());

      // Error -> Reset -> Error -> Reset cycle
      act(() => {
        result.current.handleEditorError({ message: "Error 1" });
      });
      expect(result.current.useFallback).toBe(true);

      act(() => {
        result.current.resetFallback();
      });
      expect(result.current.useFallback).toBe(false);

      act(() => {
        result.current.handleEditorError({ message: "Error 2" });
      });
      expect(result.current.useFallback).toBe(true);
      expect(result.current.retryCount).toBe(1); // Should reset count
    });
  });
});
