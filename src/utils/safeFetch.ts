/**
 * Robust JSON fetch utility to prevent "Unexpected token '<', '<html>...'" parse errors.
 * Always verifies response status and the "content-type" header.
 */
export async function safeFetchJson<T = any>(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<T | null> {
  try {
    const sessionToken = typeof window !== 'undefined' ? localStorage.getItem('nano_session_token') : null;
    const modifiedInit: RequestInit = { ...(init || {}) };
    
    if (sessionToken) {
      const headers = new Headers(modifiedInit.headers || {});
      if (!headers.has('Authorization')) {
        headers.set('Authorization', `Bearer ${sessionToken}`);
      }
      if (!headers.has('x-session-token')) {
        headers.set('x-session-token', sessionToken);
      }
      modifiedInit.headers = headers;
    }

    const response = await fetch(input, modifiedInit);
    const contentType = response.headers.get("content-type");
    const isJson = contentType && contentType.includes("application/json");

    if (!response.ok) {
      console.warn(`Fetch to ${input} failed with status: ${response.status}`);
      if (isJson) {
        try {
          return await response.json();
        } catch (e) {
          console.warn("Failed to parse error JSON", e);
        }
      }
      return null;
    }
    if (!isJson) {
      console.warn(`Fetch to ${input} did not return JSON. Content-type was: ${contentType}`);
      return null;
    }
    return await response.json();
  } catch (error) {
    console.warn(`Warning in safeFetchJson for ${input}:`, error);
    return null;
  }
}
