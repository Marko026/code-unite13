# Error Logging and Monitoring System

This comprehensive error logging system provides robust error tracking, monitoring, and handling capabilities for the application.

## Components Overview

### 1. Error Logger (`errorLogger.ts`)

Central logging utility that captures, categorizes, and stores errors with detailed context.

### 2. Error Tracking Hook (`useErrorTracking.ts`)

React hook that provides global error handlers and utility functions for manual error tracking.

### 3. Error Boundaries

- `ErrorBoundary.tsx` - General React error boundary
- `APIErrorBoundary.tsx` - Specialized for API-related errors
- `GlobalErrorProvider.tsx` - App-level error provider

### 4. Enhanced Fetch (`fetchWithErrorTracking.ts`)

Fetch wrapper with automatic error tracking, retries, and timeout handling.

### 5. Error Dashboard (`ErrorDashboard.tsx`)

Development-only dashboard for monitoring errors (Ctrl/Cmd + Shift + E).

## Usage Examples

### Basic Error Logging

```typescript
import {
  logError,
  logAPIError,
  logTinyMCEError,
} from "@/lib/utils/errorLogger";

// Log a general error
logError("VALIDATION_ERROR", "Invalid email format", error, { field: "email" });

// Log API errors
logAPIError("Login failed", error, {
  endpoint: "/api/auth/login",
  method: "POST",
  statusCode: 401,
});

// Log TinyMCE errors
logTinyMCEError("Editor initialization failed", error, {
  config: editorConfig,
});
```

### Using Error Tracking Hook

```typescript
import { useErrorTracking } from '@/lib/hooks/useErrorTracking';

function MyComponent() {
  const { trackError, trackAPIError, trackValidationError } = useErrorTracking();

  const handleSubmit = async (data) => {
    try {
      // Validate data
      if (!data.email) {
        trackValidationError('email', data.email, 'Email is required');
        return;
      }

      // Make API call
      const response = await fetch('/api/submit', { ... });
      if (!response.ok) {
        trackAPIError('/api/submit', 'POST', new Error('Submit failed'), response.status);
      }
    } catch (error) {
      trackError('UNKNOWN_ERROR', 'Submit failed', error);
    }
  };
}
```

### Using Error Boundaries

```typescript
import { ErrorBoundary, APIErrorBoundary } from '@/components/shared';

// General error boundary
<ErrorBoundary componentName="UserProfile">
  <UserProfile />
</ErrorBoundary>

// API-specific error boundary
<APIErrorBoundary
  apiEndpoint="/api/users"
  retryAction={fetchUsers}
  componentName="UsersList"
>
  <UsersList />
</APIErrorBoundary>
```

### Enhanced Fetch with Error Tracking

```typescript
import {
  fetchWithErrorTracking,
  post,
} from "@/lib/utils/fetchWithErrorTracking";

// Using the enhanced fetch
const result = await fetchWithErrorTracking("/api/data", {
  method: "POST",
  body: JSON.stringify(data),
  timeout: 10000,
  retries: 3,
  retryDelay: 1000,
});

if (result.success) {
  console.log(result.data);
} else {
  console.error(result.error);
}

// Using convenience methods
const userData = await post("/api/users", { name: "John" });
```

### Global Error Provider Setup

```typescript
// In your app layout or root component
import { GlobalErrorProvider } from '@/components/shared/GlobalErrorProvider';

export default function RootLayout({ children }) {
  return (
    <GlobalErrorProvider enableGlobalHandlers={true}>
      {children}
    </GlobalErrorProvider>
  );
}
```

## Error Types

The system categorizes errors into the following types:

- `QUOTA_EXCEEDED` - Storage quota exceeded errors
- `CORS_ERROR` - Cross-origin request errors
- `API_ERROR` - General API errors
- `TINYMCE_ERROR` - TinyMCE editor errors
- `REACT_ERROR` - React component errors
- `NETWORK_ERROR` - Network connectivity errors
- `VALIDATION_ERROR` - Data validation errors
- `UNKNOWN_ERROR` - Uncategorized errors

## Development Tools

### Error Dashboard

Press `Ctrl/Cmd + Shift + E` in development mode to open the error dashboard:

- View recent errors by type
- See error statistics
- Clear error logs
- Inspect error details and stack traces

### Console Logging

All errors are automatically logged to the console with appropriate log levels:

- `console.error()` for critical errors
- `console.warn()` for warnings
- `console.log()` for informational errors

## Production Considerations

### External Service Integration

The error logger is designed to integrate with external monitoring services:

```typescript
// In errorLogger.ts, update sendToExternalService method
private async sendToExternalService(errorLog: ErrorLog): Promise<void> {
  // Send to Sentry
  Sentry.captureException(new Error(errorLog.message), {
    tags: { errorType: errorLog.errorType },
    extra: errorLog.additionalData
  });

  // Send to custom endpoint
  await fetch('/api/errors', {
    method: 'POST',
    body: JSON.stringify(errorLog)
  });
}
```

### Storage Management

- Errors are stored in memory (max 100 entries)
- localStorage backup (max 50 entries)
- Automatic cleanup prevents memory leaks

### Performance Impact

- Minimal overhead in production
- Async error reporting doesn't block UI
- Efficient error deduplication

## Best Practices

1. **Use Specific Error Types**: Choose the most appropriate error type for better categorization
2. **Include Context**: Always provide additional data relevant to the error
3. **Wrap Critical Components**: Use error boundaries around important UI sections
4. **Monitor Regularly**: Check error logs regularly in development
5. **Handle Gracefully**: Provide fallback UI and recovery options
6. **Test Error Scenarios**: Simulate errors to ensure proper handling

## Integration Checklist

- [ ] Add GlobalErrorProvider to app root
- [ ] Wrap API calls with error tracking
- [ ] Add error boundaries to critical components
- [ ] Replace fetch calls with fetchWithErrorTracking
- [ ] Test error scenarios in development
- [ ] Configure external monitoring service
- [ ] Set up error alerting for production

## Troubleshooting

### Common Issues

1. **Errors not being logged**: Ensure GlobalErrorProvider is properly set up
2. **Dashboard not opening**: Check if you're in development mode
3. **Storage errors**: Clear browser storage if quota issues persist
4. **Missing stack traces**: Ensure source maps are available in development

### Debug Mode

Enable additional logging by setting:

```typescript
localStorage.setItem("debug-errors", "true");
```

This system provides comprehensive error monitoring while maintaining good performance and user experience.
