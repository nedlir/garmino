const API_BASE_URL = import.meta.env.VITE_API_GATEWAY_URL || 'http://localhost:3000';

const defaultHeaders = {
  'Content-Type': 'application/json',
};

const authHeaders = (token: string) => ({
  ...defaultHeaders,
  'Authorization': `Bearer ${token}`,
});

export interface RegisterPayload {
  email: string;
  password: string;
  role: 'user' | 'admin';
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  userId: string;
  email: string;
  role: 'user' | 'admin';
}

export interface UserListItem {
  userId: string;
  email: string;
  username?: string;
}

export const register = async (payload: RegisterPayload): Promise<AuthResponse> => {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: defaultHeaders,
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Registration failed' }));
    throw new Error(error.message || 'Registration failed');
  }

  return response.json();
};

export const login = async (payload: LoginPayload): Promise<AuthResponse> => {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: defaultHeaders,
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Login failed' }));
    throw new Error(error.message || 'Login failed');
  }

  return response.json();
};

export const getAllUsers = async (accessToken: string): Promise<UserListItem[]> => {
  const response = await fetch(`${API_BASE_URL}/users`, {
    method: 'GET',
    headers: authHeaders(accessToken),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to fetch users' }));
    throw new Error(error.message || 'Failed to fetch users');
  }

  return response.json();
};

export const refreshAccessToken = async (refreshToken: string): Promise<AuthResponse> => {
  const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: 'POST',
    headers: defaultHeaders,
    body: JSON.stringify({ refreshToken }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Token refresh failed' }));
    throw new Error(error.message || 'Token refresh failed');
  }

  return response.json();
};
