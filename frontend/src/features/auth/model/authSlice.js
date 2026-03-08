import { createSlice } from "@reduxjs/toolkit";
import { tokenStorage } from "@/shared/lib/storage/tokenStorage";
import { ROLES } from "@/shared/constants/appConstants";

const initialState = {
  user: null,
  token: tokenStorage.get(),
  status: "idle",
  error: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setLoading(state, action) {
      state.status = action.payload;
    },
    setCredentials(state, action) {
      const { user, token } = action.payload;
      state.user = user;
      state.token = token;
      state.error = null;
      tokenStorage.set(token);
    },
    setError(state, action) {
      state.error = action.payload;
    },
    clearError(state) {
      state.error = null;
    },
    logout(state) {
      state.user = null;
      state.token = null;
      state.status = "idle";
      state.error = null;
      tokenStorage.remove();
    },
  },
});

export const { setLoading, setCredentials, setError, clearError, logout } = authSlice.actions;

export const selectAuth = (state) => state.auth;
export const selectUser = (state) => state.auth.user;
export const selectIsLoggedIn = (state) => Boolean(state.auth.token);
export const selectIsAdmin = (state) => state.auth.user?.role === ROLES.ADMIN;

export default authSlice.reducer;
