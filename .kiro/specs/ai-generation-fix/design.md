# Design Document

## Overview

The AI generation feature needs to be migrated from OpenAI to Groq API exclusively. The current implementation has both Groq and OpenAI support with fallback logic, but we want to remove all OpenAI dependencies and ensure the application works properly when deployed to production using only Groq.

## Migration Strategy

### Current State Analysis
The existing API route already supports Groq as the primary AI service, but includes OpenAI as a fallback. We need to:
1. Remove OpenAI fallback logic completely
2. Fix a small bug in the CORS headers
3. Ensure proper error handling for Groq-only implementation
4. Verify deployment compatibility

### Key Changes Required
1. **Remove OpenAI Dependencies**: Eliminate all OpenAI-related code and environment variable checks
2. **Simplify API Logic**: Use only Groq API without fallback mechanisms
3. **Fix CORS Bug**: Resolve the undefined `corsHeaders` variable in the GET method
4. **Update Error Messages**: Remove OpenAI-specific error references
5. **Environment Cleanup**: Remove OPENAI_API_KEY dependency

## Architecture

### Updated Flow
```
User Click → generateAiAnswer() → chatGPTAPI.generateAnswer() → /api/chatgpt → Groq API
                                        ↓
                              Circuit Breaker Check
                                        ↓
                              fetchWithErrorTracking()
```

### Components Involved
1. **Answers.tsx**: UI component with generate button
2. **apiClient.ts**: API client with circuit breaker
3. **app/api/chatgpt/route.ts**: Next.js API route (to be simplified)
4. **fetchWithErrorTracking.ts**: Retry mechanism with circuit breaker
5. **useRetryStatus.ts**: Hook for monitoring circuit breaker state

### API Route Simplification
The current API route will be simplified to:
- Remove OpenAI fallback logic
- Use only Groq API configuration
- Simplify environment variable checks
- Fix CORS headers bug
- Update error messages to be Groq-specific

## Implementation Strategy

### Phase 1: Code Cleanup
- Remove all OpenAI-related code from API route
- Fix CORS headers bug in GET method
- Simplify environment variable validation
- Update error messages and logging

### Phase 2: Groq-Only Implementation
- Ensure Groq API integration is robust
- Test Groq API connectivity and error handling
- Verify proper model configuration (llama-3.1-8b-instant)
- Update system prompts if needed

### Phase 3: Deployment Verification
- Test in production environment
- Verify environment variables are properly set
- Confirm CORS configuration works with deployed domain
- Validate end-to-end functionality

## Error Handling Strategy

### Groq-Specific Error Handling
- Handle Groq API rate limits and quotas
- Provide clear error messages for Groq service issues
- Map Groq error codes to user-friendly messages
- Maintain existing circuit breaker functionality

### Production Considerations
- Ensure proper error logging for debugging
- Handle network connectivity issues gracefully
- Provide fallback behavior when Groq is unavailable
- Maintain user experience during temporary failures

### CORS and Deployment
- Fix CORS headers for all HTTP methods
- Ensure proper domain configuration for Vercel deployment
- Handle preflight requests correctly
- Support both development and production environments

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

## Technical Specifications

### API Route Changes
- Remove `openaiKey` variable and related logic
- Simplify environment variable validation to only check `GROQ_API_KEY`
- Fix `corsHeaders` undefined error in GET method
- Update error messages to remove OpenAI references
- Simplify API configuration to use only Groq endpoints

### Environment Variables
- Required: `GROQ_API_KEY`
- Remove dependency on: `OPENAI_API_KEY`
- Maintain existing Clerk, MongoDB, and other service configurations

### Model Configuration
- Use `llama-3.1-8b-instant` model from Groq
- Maintain existing system prompt and parameters
- Keep current token limits and temperature settings