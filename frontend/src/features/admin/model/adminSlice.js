import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { adminApi } from "@/features/admin/api/adminApi";

const initialState = {
  movies: [],
  users: [],
  moviesStatus: "idle",
  usersStatus: "idle",
  movieActionStatus: {},
  userActionStatus: {},
  error: null,
};

const getErrorMessage = (error, fallbackMessage) => {
  return error?.response?.data?.message || error?.message || fallbackMessage;
};

export const fetchAdminMovies = createAsyncThunk("admin/fetchMovies", async (_, thunkApi) => {
  try {
    const response = await adminApi.getMovies();
    return response.data?.data || [];
  } catch (error) {
    return thunkApi.rejectWithValue(getErrorMessage(error, "Failed to fetch admin movies"));
  }
});

export const createAdminMovie = createAsyncThunk("admin/createMovie", async (payload, thunkApi) => {
  try {
    const response = await adminApi.createMovie(payload);
    return response.data?.data;
  } catch (error) {
    return thunkApi.rejectWithValue(getErrorMessage(error, "Failed to create movie"));
  }
});

export const updateAdminMovie = createAsyncThunk("admin/updateMovie", async ({ id, payload }, thunkApi) => {
  try {
    const response = await adminApi.updateMovie(id, payload);
    return response.data?.data;
  } catch (error) {
    return thunkApi.rejectWithValue({
      message: getErrorMessage(error, "Failed to update movie"),
      id,
    });
  }
});

export const deleteAdminMovie = createAsyncThunk("admin/deleteMovie", async (id, thunkApi) => {
  try {
    await adminApi.deleteMovie(id);
    return id;
  } catch (error) {
    return thunkApi.rejectWithValue({
      message: getErrorMessage(error, "Failed to delete movie"),
      id,
    });
  }
});

export const fetchAdminUsers = createAsyncThunk("admin/fetchUsers", async (_, thunkApi) => {
  try {
    const response = await adminApi.getUsers();
    return response.data?.data || [];
  } catch (error) {
    return thunkApi.rejectWithValue(getErrorMessage(error, "Failed to fetch users"));
  }
});

export const toggleAdminUserBan = createAsyncThunk("admin/toggleUserBan", async ({ id, isBanned }, thunkApi) => {
  try {
    const response = await adminApi.toggleBanUser(id, { isBanned });
    return response.data?.data;
  } catch (error) {
    return thunkApi.rejectWithValue({
      message: getErrorMessage(error, "Failed to update user ban"),
      id,
    });
  }
});

export const deleteAdminUser = createAsyncThunk("admin/deleteUser", async (id, thunkApi) => {
  try {
    await adminApi.deleteUser(id);
    return id;
  } catch (error) {
    return thunkApi.rejectWithValue({
      message: getErrorMessage(error, "Failed to delete user"),
      id,
    });
  }
});

const adminSlice = createSlice({
  name: "admin",
  initialState,
  reducers: {
    clearAdminError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAdminMovies.pending, (state) => {
        state.moviesStatus = "loading";
        state.error = null;
      })
      .addCase(fetchAdminMovies.fulfilled, (state, action) => {
        state.moviesStatus = "succeeded";
        state.movies = action.payload;
      })
      .addCase(fetchAdminMovies.rejected, (state, action) => {
        state.moviesStatus = "failed";
        state.error = action.payload || action.error.message || "Failed to fetch admin movies";
      })
      .addCase(createAdminMovie.pending, (state) => {
        state.movieActionStatus.create = "loading";
        state.error = null;
      })
      .addCase(createAdminMovie.fulfilled, (state, action) => {
        state.movieActionStatus.create = "succeeded";
        if (action.payload) {
          state.movies.unshift(action.payload);
        }
      })
      .addCase(createAdminMovie.rejected, (state, action) => {
        state.movieActionStatus.create = "failed";
        state.error = action.payload || action.error.message || "Failed to create movie";
      })
      .addCase(updateAdminMovie.pending, (state, action) => {
        const id = action.meta.arg?.id;
        if (id) {
          state.movieActionStatus[id] = "loading";
        }
        state.error = null;
      })
      .addCase(updateAdminMovie.fulfilled, (state, action) => {
        const movie = action.payload;
        if (!movie?._id) {
          return;
        }
        const index = state.movies.findIndex((item) => item._id === movie._id);
        if (index >= 0) {
          state.movies[index] = movie;
        } else {
          state.movies.unshift(movie);
        }
        state.movieActionStatus[movie._id] = "succeeded";
      })
      .addCase(updateAdminMovie.rejected, (state, action) => {
        const id = action.payload?.id || action.meta.arg?.id;
        if (id) {
          state.movieActionStatus[id] = "failed";
        }
        state.error = action.payload?.message || action.error.message || "Failed to update movie";
      })
      .addCase(deleteAdminMovie.pending, (state, action) => {
        const id = action.meta.arg;
        if (id) {
          state.movieActionStatus[id] = "loading";
        }
        state.error = null;
      })
      .addCase(deleteAdminMovie.fulfilled, (state, action) => {
        const id = action.payload;
        state.movies = state.movies.filter((movie) => movie._id !== id);
        state.movieActionStatus[id] = "succeeded";
      })
      .addCase(deleteAdminMovie.rejected, (state, action) => {
        const id = action.payload?.id || action.meta.arg;
        if (id) {
          state.movieActionStatus[id] = "failed";
        }
        state.error = action.payload?.message || action.error.message || "Failed to delete movie";
      })
      .addCase(fetchAdminUsers.pending, (state) => {
        state.usersStatus = "loading";
        state.error = null;
      })
      .addCase(fetchAdminUsers.fulfilled, (state, action) => {
        state.usersStatus = "succeeded";
        state.users = action.payload;
      })
      .addCase(fetchAdminUsers.rejected, (state, action) => {
        state.usersStatus = "failed";
        state.error = action.payload || action.error.message || "Failed to fetch users";
      })
      .addCase(toggleAdminUserBan.pending, (state, action) => {
        const id = action.meta.arg?.id;
        if (id) {
          state.userActionStatus[id] = "loading";
        }
        state.error = null;
      })
      .addCase(toggleAdminUserBan.fulfilled, (state, action) => {
        const user = action.payload;
        if (!user?.id) {
          return;
        }
        const index = state.users.findIndex((item) => item.id === user.id);
        if (index >= 0) {
          state.users[index] = user;
        } else {
          state.users.unshift(user);
        }
        state.userActionStatus[user.id] = "succeeded";
      })
      .addCase(toggleAdminUserBan.rejected, (state, action) => {
        const id = action.payload?.id || action.meta.arg?.id;
        if (id) {
          state.userActionStatus[id] = "failed";
        }
        state.error = action.payload?.message || action.error.message || "Failed to update user ban";
      })
      .addCase(deleteAdminUser.pending, (state, action) => {
        const id = action.meta.arg;
        if (id) {
          state.userActionStatus[id] = "loading";
        }
        state.error = null;
      })
      .addCase(deleteAdminUser.fulfilled, (state, action) => {
        const id = action.payload;
        state.users = state.users.filter((user) => user.id !== id);
        state.userActionStatus[id] = "succeeded";
      })
      .addCase(deleteAdminUser.rejected, (state, action) => {
        const id = action.payload?.id || action.meta.arg;
        if (id) {
          state.userActionStatus[id] = "failed";
        }
        state.error = action.payload?.message || action.error.message || "Failed to delete user";
      });
  },
});

export const { clearAdminError } = adminSlice.actions;

export const selectAdminState = (state) => state.admin;
export const selectAdminMovies = (state) => state.admin.movies;
export const selectAdminUsers = (state) => state.admin.users;
export const selectAdminMoviesStatus = (state) => state.admin.moviesStatus;
export const selectAdminUsersStatus = (state) => state.admin.usersStatus;
export const selectAdminMovieActionStatus = (state) => state.admin.movieActionStatus;
export const selectAdminUserActionStatus = (state) => state.admin.userActionStatus;
export const selectAdminError = (state) => state.admin.error;

export default adminSlice.reducer;

