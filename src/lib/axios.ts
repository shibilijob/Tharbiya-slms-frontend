import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse, AxiosError } from "axios";

const BASE_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/+$/, "");
const API_BASE_URL = `${BASE_URL}/api`;

/**
 * Standard API Response Structure
 */
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data: T;
  count?: number;
  [key: string]: any;
}

/**
 * Central Axios Instance configured with credentials and default base URL
 */
export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

/**
 * Request Interceptor
 * Injects any stored authorization tokens if applicable
 */
apiClient.interceptors.request.use(
  (config) => {
    // If bearer token is stored separately in localStorage/sessionStorage
    const token =
      localStorage.getItem("tharbiyah_auth_token") ||
      localStorage.getItem("token");

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Response Interceptor
 * Formats error messages and handles global HTTP error states
 */
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error: AxiosError<{ success?: boolean; message?: string; error?: string }>) => {
    let errorMessage = "An unexpected error occurred. Please try again.";

    if (error.response?.data?.message) {
      errorMessage = error.response.data.message;
    } else if (error.response?.data?.error) {
      errorMessage = error.response.data.error;
    } else if (error.message) {
      errorMessage = error.message;
    }

    // Handle 401 Unauthorized globally if needed
    if (error.response?.status === 401) {
      console.warn("Session expired or unauthorized request to:", error.config?.url);
    }

    // Attach human-readable message for easy consumption in UI components
    const customError = new Error(errorMessage);
    (customError as any).status = error.response?.status;
    (customError as any).data = error.response?.data;
    (customError as any).originalError = error;

    return Promise.reject(customError);
  }
);

/**
 * Type-safe HTTP convenience wrappers
 */
export const api = {
  get: <T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> =>
    apiClient.get(url, config).then((res) => res.data),

  post: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> =>
    apiClient.post(url, data, config).then((res) => res.data),

  put: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> =>
    apiClient.put(url, data, config).then((res) => res.data),

  patch: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> =>
    apiClient.patch(url, data, config).then((res) => res.data),

  delete: <T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> =>
    apiClient.delete(url, config).then((res) => res.data),
};

export default apiClient;
