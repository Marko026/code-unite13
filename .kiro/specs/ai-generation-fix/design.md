# Design Document

## Overview

The AI generation feature is failing due to a circuit breaker being in CLOSED state, which prevents API calls to OpenAI. The error message "Service Status: CLOSED" indicates that the system has detected multiple failures and has temporarily disabled the service to prevent cascading failures.

## Root Cause Analysis

### Circuit Breaker Pattern
The application uses a circuit breaker pattern implemented in the retry mechanism. When too many API calls fail (default threshold: 5 failures), the circuit breaker opens and blocks further requests for a reset timeout period (default: 60 seconds).

### Potential Causes
1. **OpenAI API Key Issues**: Invalid, expired, or quota-exceeded API key
2. **Network Connectivity**: Connection issues to OpenAI API
3. **API Rate Limiting**: Exceeding OpenAI rate limits
4. **Malformed Requests**: Invalid request format or parameters
5. **OpenAI Service Outage**: Temporary unavailability of OpenAI services

## Architecture

### Current Flow
```
User Click → generateAiAnswer() → chatGPTAPI.generateAnswer() → /api/chatgpt → OpenAI API
                                        ↓
                              Circuit Breaker Check
                                        ↓
                              fetchWithErrorTracking()
```

### Components Involved
1. **Answers.tsx**: UI component with generate button
2. **apiClient.ts**: API client with circuit breaker
3. **app/api/chatgpt/route.ts**: Next.js API route
4. **fetchWithErrorTracking.ts**: Retry mechanism with circuit breaker
5. **useRetryStatus.ts**: Hook for monitoring circuit breaker state

## Diagnostic Strategy

### Phase 1: Circuit Breaker State Investigation
- Check current circuit breaker state in localStorage
- Examine failure logs and error patterns
- Verify circuit breaker configuration

### Phase 2: API Connectivity Testing
- Test OpenAI API key validity
- Verify API endpoint accessibility
- Check request/response format

### Phase 3: Configuration Validation
- Validate environment variables
- Check API route implementation
- Verify request validation logic

## Error Handling Improvements

### Enhanced Error Messages
- Specific error codes for different failure types
- User-friendly messages for common issues
- Diagnostic information for developers

### Circuit Breaker Management
- Manual reset capability
- Configurable thresholds
- Better state visibility

### Retry Logic
- Exponential backoff with jitter
- Different retry strategies for different error types
- Graceful degradation

## Testing Strategy

### Unit Tests
- Circuit breaker state management
- Error handling scenarios
- API client functionality

### Integration Tests
- End-to-end AI generation flow
- Error recovery scenarios
- Circuit breaker behavior

### Manual Testing
- Different error conditions
- User experience validation
- Cross-browser compatibility

## Implementation Plan

### Immediate Fixes
1. Reset circuit breaker state
2. Validate OpenAI API key
3. Test API connectivity
4. Fix any configuration issues

### Long-term Improvements
1. Enhanced error reporting
2. Better circuit breaker management
3. Improved user feedback
4. Monitoring and alerting