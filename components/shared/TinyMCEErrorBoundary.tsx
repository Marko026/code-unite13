"use client";

import { Component, ErrorInfo, ReactNode } from "react";
import { Textarea } from "../ui/textarea";

interface Props {
  children: ReactNode;
  fallbackValue?: string;
  onFallback?: (value: string) => void;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class TinyMCEErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log the error for debugging
    console.error("TinyMCE Error Boundary caught an error:", error, errorInfo);

    this.setState({
      error,
      errorInfo,
    });

    // Call the onError callback if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      // Render fallback UI
      return (
        <div className="w-full">
          <div className="mb-3 rounded-md bg-yellow-50 p-3 text-sm text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200">
            <div className="flex items-start">
              <svg
                className="mr-2 mt-0.5 size-4 shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              <div>
                <p className="font-medium">Editor Fallback Mode</p>
                <p className="mt-1">
                  The rich text editor encountered an issue and switched to
                  basic text mode. Your content will still be saved properly.
                </p>
                {this.state.error && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-xs opacity-75 hover:opacity-100">
                      Technical details
                    </summary>
                    <pre className="mt-1 text-xs opacity-75">
                      {this.state.error.message}
                    </pre>
                  </details>
                )}
              </div>
            </div>
          </div>

          <Textarea
            placeholder="Write your answer here..."
            className="min-h-[500px] resize-none"
            defaultValue={this.props.fallbackValue || ""}
            onChange={(e) => {
              if (this.props.onFallback) {
                this.props.onFallback(e.target.value);
              }
            }}
          />
        </div>
      );
    }

    return this.props.children;
  }
}

export default TinyMCEErrorBoundary;
