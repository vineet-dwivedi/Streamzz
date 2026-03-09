import axios from "axios";
import { tokenStorage } from "@/shared/lib/storage/tokenStorage";

const normalizeApiBaseUrl = (url) => {
  const cleanUrl = (url || "").trim().replace(/\/+$/, "");

  if (!cleanUrl) {
    return "http://localhost:5000/api";
  }

  return cleanUrl.endsWith("/api") ? cleanUrl : `${cleanUrl}/api`;
};

const apiClient = axios.create({
  baseURL: normalizeApiBaseUrl(import.meta.env.VITE_API_BASE_URL),
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use((config) => {
  const token = tokenStorage.get();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default apiClient;
