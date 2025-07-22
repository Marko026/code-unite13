"use client";

import { useCallback, useEffect, useState } from "react";

interface TinyMCEFallbackState {
  useFallback: boolean;
  error: string | null;
  isStorageAvailable: boolean;
  retryCount: number;
}

interface TinyMCEFallbackHook extends TinyMCEFallbackState {
  checkStorageQuota: () => boolean;
  handleEditorError: (error: any) => void;
  clearTinyMCEStorage: () => void;
  resetFallback: () => void;
  canRetry: boolean;
}

const MAX_RETRY_ATTEMPTS = 2;

export const useTinyMCEFallback = (): TinyMCEFallbackHook => {
  const [state, setState] = useState<TinyMCEFallbackState>({
    useFallback: false,
    error: null,
    isStorageAvailable: true,
    retryCount: 0,
  });

  // Clear TinyMCE storage utility
  const clearTinyMCEStorage = useCallback(() => {
    try {
      // Clear localStorage entries
      const localKeysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (
          key &&
          (key.includes("tinymce") ||
            key.includes("mce") ||
            key.includes("draft"))
        ) {
          localKeysToRemove.push(key);
        }
      }
      localKeysToRemove.forEach((key) => localStorage.removeItem(key));

      // Clear sessionStorage entries
      const sessionKeysToRemove: string[] = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (
          key &&
          (key.includes("tinymce") ||
            key.includes("mce") ||
            key.includes("draft"))
        ) {
          sessionKeysToRemove.push(key);
        }
      }
      sessionKeysToRemove.forEach((key) => sessionStorage.removeItem(key));

      console.log("TinyMCE storage cleared successfully");
      return true;
    } catch (error) {
      console.warn("Failed to clear TinyMCE storage:", error);
      return false;
    }
  }, []);

  // Check storage quota availability
  const checkStorageQuota = useCallback((): boolean => {
    try {
      // Test if we can use localStorage with a reasonable amount of data
      const testKey = "tinymce-quota-test";
      const testData = "x".repeat(1024); // 1KB test
      localStorage.setItem(testKey, testData);
      localStorage.removeItem(testKey);

      // Test sessionStorage as well
      sessionStorage.setItem(testKey, testData);
      sessionStorage.removeItem(testKey);

      return true;
    } catch (error) {
      console.warn("Storage quota check failed:", error);
      return false;
    }
  }, []);

  // Handle editor errors and determine if fallback is needed
  const handleEditorError = useCallback(
    (error: any) => {
      console.error("TinyMCE error detected:", error);

      let errorMessage = "TinyMCE editor encountered an error";
      let shouldUseFallback = true;

      // Analyze error type
      if (error?.message) {
        const message = error.message.toLowerCase();

        if (message.includes("quota") || message.includes("storage")) {
          errorMessage = "Storage quota exceeded - using fallback editor";
          shouldUseFallback = true;
        } else if (message.includes("network") || message.includes("load")) {
          errorMessage = "Failed to load TinyMCE - using fallback editor";
          shouldUseFallback = true;
        } else if (
          message.includes("initialization") ||
          message.includes("init")
        ) {
          errorMessage =
            "TinyMCE initialization failed - using fallback editor";
          shouldUseFallback = true;
        }
      }

      setState((prev) => ({
        ...prev,
        useFallback: shouldUseFallback,
        error: errorMessage,
        isStorageAvailable: checkStorageQuota(),
        retryCount: prev.retryCount + 1,
      }));

      // Try to clear storage to potentially resolve the issue
      clearTinyMCEStorage();
    },
    [checkStorageQuota, clearTinyMCEStorage],
  );

  // Reset fallback state for retry attempts
  const resetFallback = useCallback(() => {
    setState((prev) => ({
      ...prev,
      useFallback: false,
      error: null,
      retryCount: 0,
    }));
  }, []);

  // Check storage availability on mount
  useEffect(() => {
    const isStorageAvailable = checkStorageQuota();

    if (!isStorageAvailable) {
      setState((prev) => ({
        ...prev,
        useFallback: true,
        error: "Storage quota exceeded - using fallback editor",
        isStorageAvailable: false,
      }));
    }

    // Clear any existing TinyMCE storage on mount
    clearTinyMCEStorage();
  }, [checkStorageQuota, clearTinyMCEStorage]);

  const canRetry =
    state.retryCount < MAX_RETRY_ATTEMPTS && state.isStorageAvailable;

  return {
    ...state,
    checkStorageQuota,
    handleEditorError,
    clearTinyMCEStorage,
    resetFallback,
    canRetry,
  };
};
