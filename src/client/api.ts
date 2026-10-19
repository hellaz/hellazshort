/**
 * API client wrapper for URLZ / OpenShort.link
 */

let cachedCsrfToken: string | null = null;

export function getAuthToken(): string | null {
  return localStorage.getItem('auth_token');
}

export function setAuthToken(token: string | null) {
  if (token) {
    localStorage.setItem('auth_token', token);
  } else {
    localStorage.removeItem('auth_token');
  }
}

export async function fetchCsrfToken(): Promise<string> {
  if (cachedCsrfToken) return cachedCsrfToken;
  try {
    const res = await fetch('/api/v1/auth/csrf');
    if (res.ok) {
      const data: any = await res.json();
      if (data?.data?.csrfToken) {
        cachedCsrfToken = data.data.csrfToken;
        return cachedCsrfToken;
      }
    }
  } catch (e) {
    // ignore
  }
  return '';
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ success: boolean; data?: T; message?: string; error?: any }> {
  // Normalize endpoint to start with /api/v1 or /dashboard/api/v1
  const url = endpoint.startsWith('/') ? endpoint : `/api/v1/${endpoint}`;

  const headers = new Headers(options.headers || {});
  
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const token = getAuthToken();
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // If POST/PUT/DELETE/PATCH, include CSRF token
  const method = (options.method || 'GET').toUpperCase();
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method) && !headers.has('X-CSRF-Token')) {
    const csrf = await fetchCsrfToken();
    if (csrf) {
      headers.set('X-CSRF-Token', csrf);
    }
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    const isJson = response.headers.get('content-type')?.includes('application/json');
    const data: any = isJson ? await response.json() : await response.text();

    if (!response.ok) {
      const errorMsg = data?.error?.message || data?.message || response.statusText || 'An error occurred';
      return {
        success: false,
        error: errorMsg,
        message: errorMsg,
      };
    }

    return {
      success: true,
      data: data?.data !== undefined ? data.data : data,
      message: data?.message,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Network request failed',
      message: err.message || 'Network request failed',
    };
  }
}
