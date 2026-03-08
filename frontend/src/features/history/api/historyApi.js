import apiClient from "@/shared/lib/api/apiClient";

export const historyApi = {
  getAll() {
    return apiClient.get("/history");
  },
  add(payload) {
    return apiClient.post("/history", payload);
  },
  remove(contentKey) {
    return apiClient.delete(`/history/${encodeURIComponent(contentKey)}`);
  },
};

