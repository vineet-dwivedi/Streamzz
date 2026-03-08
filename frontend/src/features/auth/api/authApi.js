import apiClient from "@/shared/lib/api/apiClient";

export const authApi = {
  signup(payload) {
    return apiClient.post("/auth/signup", payload);
  },
  login(payload) {
    return apiClient.post("/auth/login", payload);
  },
  me() {
    return apiClient.get("/auth/me");
  },
  logout() {
    return apiClient.post("/auth/logout");
  },
};
