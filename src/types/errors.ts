export interface RetryAttempt {
    attempt: number;
    delay: number;
    timestamp: string;
    error?: string;
}

/**
 * Verbose error details surfaced in the ErrorBottomSheet.
 */
export interface ErrorDetails {
    endpoint: string;
    method: string;
    requestBody?: unknown;
    requestHeaders?: Record<string, string>;
    status?: number;
    statusText?: string;
    responseBody?: unknown;
    errorType: 'network' | 'server';
    errorMessage: string;
    retryAttempts: RetryAttempt[];
    totalDuration: number;
    timestamp: string;
}
