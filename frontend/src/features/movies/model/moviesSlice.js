import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { tmdbApi } from "@/features/movies/api/tmdbApi";

const listState = {
  items: [],
  status: "idle",
  error: null,
  page: 0,
  totalPages: 1,
};

const initialState = {
  trending: { ...listState },
  popular: { ...listState },
  search: {
    ...listState,
    query: "",
  },
};

const mergeUniqueItems = (oldItems, newItems) => {
  const seen = new Set(oldItems.map((item) => item.id));
  const merged = [...oldItems];

  newItems.forEach((item) => {
    if (!seen.has(item.id)) {
      seen.add(item.id);
      merged.push(item);
    }
  });

  return merged;
};

const getErrorMessage = (error, fallback) => {
  return error?.response?.data?.status_message || error?.message || fallback;
};

export const fetchTrending = createAsyncThunk("movies/fetchTrending", async (page = 1, thunkApi) => {
  try {
    return await tmdbApi.getTrending(page);
  } catch (error) {
    return thunkApi.rejectWithValue(getErrorMessage(error, "Failed to load trending titles"));
  }
});

export const fetchPopular = createAsyncThunk("movies/fetchPopular", async (page = 1, thunkApi) => {
  try {
    return await tmdbApi.getPopular(page);
  } catch (error) {
    return thunkApi.rejectWithValue(getErrorMessage(error, "Failed to load popular titles"));
  }
});

export const searchTitles = createAsyncThunk("movies/searchTitles", async ({ query, page = 1 }, thunkApi) => {
  try {
    return await tmdbApi.search(query, page);
  } catch (error) {
    return thunkApi.rejectWithValue(getErrorMessage(error, "Search failed"));
  }
});

const moviesSlice = createSlice({
  name: "movies",
  initialState,
  reducers: {
    clearSearch(state) {
      state.search = {
        ...listState,
        query: "",
      };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTrending.pending, (state) => {
        state.trending.status = "loading";
        state.trending.error = null;
      })
      .addCase(fetchTrending.fulfilled, (state, action) => {
        const page = action.payload.page || 1;
        state.trending.status = "succeeded";
        state.trending.page = page;
        state.trending.totalPages = action.payload.totalPages || 1;
        state.trending.items = page === 1 ? action.payload.items : mergeUniqueItems(state.trending.items, action.payload.items);
      })
      .addCase(fetchTrending.rejected, (state, action) => {
        state.trending.status = "failed";
        state.trending.error = action.payload || action.error.message || "Failed to load trending titles";
      })
      .addCase(fetchPopular.pending, (state) => {
        state.popular.status = "loading";
        state.popular.error = null;
      })
      .addCase(fetchPopular.fulfilled, (state, action) => {
        const page = action.payload.page || 1;
        state.popular.status = "succeeded";
        state.popular.page = page;
        state.popular.totalPages = action.payload.totalPages || 1;
        state.popular.items = page === 1 ? action.payload.items : mergeUniqueItems(state.popular.items, action.payload.items);
      })
      .addCase(fetchPopular.rejected, (state, action) => {
        state.popular.status = "failed";
        state.popular.error = action.payload || action.error.message || "Failed to load popular titles";
      })
      .addCase(searchTitles.pending, (state, action) => {
        state.search.status = "loading";
        state.search.error = null;
        state.search.query = action.meta.arg?.query || "";
      })
      .addCase(searchTitles.fulfilled, (state, action) => {
        const requestQuery = action.meta.arg?.query || "";
        if (requestQuery !== state.search.query) {
          return;
        }

        const page = action.payload.page || 1;
        state.search.status = "succeeded";
        state.search.page = page;
        state.search.totalPages = action.payload.totalPages || 1;
        state.search.items = page === 1 ? action.payload.items : mergeUniqueItems(state.search.items, action.payload.items);
      })
      .addCase(searchTitles.rejected, (state, action) => {
        const requestQuery = action.meta.arg?.query || "";
        if (requestQuery !== state.search.query) {
          return;
        }

        state.search.status = "failed";
        state.search.error = action.payload || action.error.message || "Search failed";
      });
  },
});

export const { clearSearch } = moviesSlice.actions;

export const selectMovies = (state) => state.movies;
export const selectTrending = (state) => state.movies.trending;
export const selectPopular = (state) => state.movies.popular;
export const selectSearch = (state) => state.movies.search;

export default moviesSlice.reducer;
