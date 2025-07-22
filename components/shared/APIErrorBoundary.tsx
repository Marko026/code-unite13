"use client";

import { logAPIError, logReactError } from "@/lib/utils/errorLogger";
import { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  apiEndpoint?: string;
  retryAction?: () => void;
  componentName?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  isRetrying: boolean;
}

export class APIErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      isRetrying: false,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      isRetrying: false,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Check if this is an API-related error
    const isAPIError = this.isAPIRelatedError(error);

    if (isAPIError && this.props.apiEndpoint) {
      logAPIError(
        `API Error in ${this.props.componentName || "component"}`,
        error,
        {
          endpoint: this.props.apiEndpoint,
          method: "UNKNOWN",
        },
      );
    } else {
      logReactError(error, errorInfo, this.props.componentName);
    }

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    this.setState({
      error,
      errorInfo,
    });
  }

  private isAPIRelatedError(error: Error): boolean {
    const apiErrorIndicators = [
      "fetch",
      "network",
      "cors",
      "api",
      "http",
      "request",
      "response",
      "timeout",
    ];

    const errorMessage = error.message.toLowerCase();
    const errorStack = error.stack?.toLowerCase() || "";

    return apiErrorIndicators.some(
      (indicator) =>
        errorMessage.includes(indicator) || errorStack.includes(indicator),
    );
  }

  handleRetry = async () => {
    if (this.props.retryAction) {
      this.setState({ isRetrying: true });

      try {
        await this.props.retryAction();
        // If retry succeeds, reset the error boundary
        this.setState({
          hasError: false,
          error: undefined,
          errorInfo: undefined,
          isRetrying: false,
        });
      } catch (error) {
        // If retry fails, log it but keep the error boundary active
        console.error("Retry failed:", error);
        this.setState({ isRetrying: false });
      }
    } else {
      // Simple reset without retry action
      this.setState({
        hasError: false,
        error: undefined,
        errorInfo: undefined,
        isRetrying: false,
      });
    }
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default API error fallback UI
      return (
        <div className="flex min-h-[200px] flex-col items-center justify-center rounded-lg border border-orange-200 bg-orange-50 p-6 text-center">
          <div className="mb-4">
            <svg
              className="mx-auto h-10 w-10 text-orange-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>

          <h3 className="mb-2 text-base font-semibold text-orange-800">
            Connection Error
          </h3>

          <p className="mb-4 text-sm text-orange-600">
            {this.isAPIRelatedError(this.state.error!)
              ? "We're having trouble connecting to our servers. Please check your internet connection and try again."
              : "Something went wrong while loading this content."}
          </p>

          {this.props.apiEndpoint && (
            <p className="mb-4 text-xs text-orange-500">
              Endpoint: {this.props.apiEndpoint}
            </p>
          )}

          <div className="flex gap-2">
            <button
              onClick={this.handleRetry}
              disabled={this.state.isRetrying}
              className="rounded-md bg-orange-600 px-3 py-2 text-sm font-medium text-white hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {this.state.isRetrying ? (
                <span className="flex items-center gap-2">
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Retrying...
                </span>
              ) : (
                "Try Again"
              )}
            </button>
          </div>

          {process.env.NODE_ENV === "development" && this.state.error && (
            <details className="mt-4 w-full max-w-lg">
              <summary className="cursor-pointer text-xs font-medium text-orange-700 hover:text-orange-800">
                Error Details (Development Only)
              </summary>
              <div className="mt-2 rounded bg-orange-100 p-2 text-left">
                <p className="font-mono text-xs text-orange-800">
                  {this.state.error.message}
                </p>
                {this.state.error.stack && (
                  <pre className="mt-1 whitespace-pre-wrap text-xs text-orange-700">
                    {this.state.error.stack.split("\n").slice(0, 5).join("\n")}
                  </pre>
                )}
              </div>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
