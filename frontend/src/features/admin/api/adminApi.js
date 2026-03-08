import apiClient from "@/shared/lib/api/apiClient";

export const adminApi = {
  getMovies() {
    return apiClient.get("/admin/movies");
  },
  createMovie(payload) {
    return apiClient.post("/admin/movies", payload);
  },
  updateMovie(id, payload) {
    return apiClient.patch(`/admin/movies/${id}`, payload);
  },
  deleteMovie(id) {
    return apiClient.delete(`/admin/movies/${id}`);
  },
  getUsers() {
    return apiClient.get("/admin/users");
  },
  toggleBanUser(id, payload) {
    return apiClient.patch(`/admin/users/${id}/ban`, payload);
  },
  deleteUser(id) {
    return apiClient.delete(`/admin/users/${id}`);
  },
};

