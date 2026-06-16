const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const TOKEN_KEY = 'treasurequest_token';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function removeToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export async function fetchAPI<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE}${path}`;
  const token = getToken();
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    credentials: 'include',
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.error || `API Error: ${response.status}`);
  }

  return response.json();
}
