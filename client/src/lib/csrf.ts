// CSRF token management for secure API requests

let cachedToken: string | null = null;

/**
 * Fetches a fresh CSRF token from the server
 */
export async function fetchCsrfToken(): Promise<string> {
  try {
    const response = await fetch("/api/csrf-token", {
      credentials: "include", // Include cookies
    });
    const data = await response.json();
    cachedToken = data.token;
    return data.token;
  } catch (error) {
    console.error("Failed to fetch CSRF token:", error);
    throw error;
  }
}

/**
 * Gets the cached CSRF token or fetches a new one if not available
 */
export async function getCsrfToken(): Promise<string> {
  if (!cachedToken) {
    return await fetchCsrfToken();
  }
  return cachedToken;
}

/**
 * Makes a secure fetch request with CSRF token
 * Use this instead of fetch() for all POST/PUT/DELETE requests
 */
export async function secureFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = await getCsrfToken();

  const headers = new Headers(options.headers);
  headers.set("x-csrf-token", token);

  return fetch(url, {
    ...options,
    credentials: "include", // Include cookies
    headers,
  });
}

/**
 * Clears the cached token (useful after logout or token expiry)
 */
export function clearCsrfToken(): void {
  cachedToken = null;
}
