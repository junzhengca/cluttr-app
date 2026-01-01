/**
 * Decode JWT token without verification
 * Returns the payload as an object
 */
export const decodeJWT = (token: string): Record<string, unknown> | null => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.warn('[JWT] Invalid token format, expected 3 parts');
      return null;
    }

    const payload = parts[1];
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decoded) as Record<string, unknown>;
  } catch (error) {
    console.error('[JWT] Error decoding JWT:', error);
    return null;
  }
};

/**
 * Check if a JWT token is expired
 * Returns true if token is invalid (tokens never expire, so only validation is performed)
 * @param token - The JWT token to check
 */
export const isTokenExpired = (token: string | null): boolean => {
  if (!token) {
    console.warn('[JWT] Token is null or empty');
    return true;
  }

  const decoded = decodeJWT(token);
  if (!decoded) {
    console.warn('[JWT] Failed to decode token');
    return true;
  }

  // Tokens never expire, so this function only validates token format
  return false;
};

