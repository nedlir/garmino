export const API_CONFIG = {
  baseURL: import.meta.env.VITE_API_GATEWAY_URL || 'http://localhost:3000',
} as const;
