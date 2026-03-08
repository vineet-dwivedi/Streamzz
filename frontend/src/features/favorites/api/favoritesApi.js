import apiClient from "@/shared/lib/api/apiClient";

export const favoritesApi = {
  getAll() {
    return apiClient.get("/favorites");
  },
  add(payload) {
    return apiClient.post("/favorites", payload);
  },
  remove(contentKey) {
    return apiClient.delete(`/favorites/${encodeURIComponent(contentKey)}`);
  },
};

