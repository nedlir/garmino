import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { getTokens, clearTokens, saveTokens, saveUser } from '../utils/storage';

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_GATEWAY_URL || 'http://localhost:3001',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Flag to prevent multiple simultaneous refresh attempts
let isRefreshing = false;
let failedRequestsQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: Error) => void;
}> = [];

// Request interceptor to add auth token
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const tokens = getTokens();
    if (tokens?.accessToken && config.headers) {
      config.headers.Authorization = `Bearer ${tokens.accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle 401 and token refresh
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // If error is 401 and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedRequestsQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return axiosInstance(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const tokens = getTokens();

        if (!tokens?.refreshToken) {
          clearTokens();
          window.location.href = '/login';
          return Promise.reject(error);
        }

        // Attempt token refresh using a separate axios instance to avoid interceptor loop
        const response = await axios.post(
          `${axiosInstance.defaults.baseURL}/auth/refresh`,
          { refreshToken: tokens.refreshToken },
          { headers: { 'Content-Type': 'application/json' } }
        );

        const { accessToken, refreshToken, userId, email, role } = response.data;

        // Update tokens in storage
        saveTokens(accessToken, refreshToken);
        saveUser({ userId, email, role });

        // Update auth store
        const { useAuthStore } = await import('../store/authStore');
        const setAuth = useAuthStore.getState().setAuth;
        setAuth({ userId, email, role }, accessToken, refreshToken);

        // Process queued requests
        failedRequestsQueue.forEach((request) => request.resolve(accessToken));
        failedRequestsQueue = [];

        // Retry original request with new token
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        }
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        // Refresh failed - clear tokens and redirect to login
        failedRequestsQueue.forEach((request) =>
          request.reject(new Error('Token refresh failed'))
        );
        failedRequestsQueue = [];
        clearTokens();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
