import { createAsyncThunk, createSelector, createSlice } from "@reduxjs/toolkit";
import { favoritesApi } from "@/features/favorites/api/favoritesApi";

const initialState = {
  items: [],
  status: "idle",
  error: null,
  actionStatus: {},
};

const getErrorMessage = (error, fallbackMessage) => {
  return error?.response?.data?.message || error?.message || fallbackMessage;
};

export const fetchFavorites = createAsyncThunk("favorites/fetchAll", async (_, thunkApi) => {
  try {
    const response = await favoritesApi.getAll();
    return response.data?.data || [];
  } catch (error) {
    return thunkApi.rejectWithValue(getErrorMessage(error, "Failed to fetch favorites"));
  }
});

export const addFavoriteItem = createAsyncThunk("favorites/add", async (payload, thunkApi) => {
  try {
    const response = await favoritesApi.add(payload);
    return response.data?.data || payload;
  } catch (error) {
    return thunkApi.rejectWithValue(getErrorMessage(error, "Failed to add favorite"));
  }
});

export const removeFavoriteItem = createAsyncThunk("favorites/remove", async (contentKey, thunkApi) => {
  try {
    await favoritesApi.remove(contentKey);
    return contentKey;
  } catch (error) {
    return thunkApi.rejectWithValue({
      message: getErrorMessage(error, "Failed to remove favorite"),
      contentKey,
    });
  }
});

const favoritesSlice = createSlice({
  name: "favorites",
  initialState,
  reducers: {
    clearFavoritesError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchFavorites.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchFavorites.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload;
      })
      .addCase(fetchFavorites.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || action.error.message || "Failed to fetch favorites";
      })
      .addCase(addFavoriteItem.pending, (state, action) => {
        const contentKey = action.meta.arg?.contentKey;
        if (contentKey) {
          state.actionStatus[contentKey] = "loading";
        }
      })
      .addCase(addFavoriteItem.fulfilled, (state, action) => {
        const item = action.payload;
        if (!item?.contentKey) {
          return;
        }

        const index = state.items.findIndex((fav) => fav.contentKey === item.contentKey);
        if (index >= 0) {
          state.items[index] = item;
        } else {
          state.items.unshift(item);
        }

        state.actionStatus[item.contentKey] = "succeeded";
      })
      .addCase(addFavoriteItem.rejected, (state, action) => {
        const contentKey = action.meta.arg?.contentKey;
        if (contentKey) {
          state.actionStatus[contentKey] = "failed";
        }
        state.error = action.payload || action.error.message || "Failed to add favorite";
      })
      .addCase(removeFavoriteItem.pending, (state, action) => {
        const contentKey = action.meta.arg;
        if (contentKey) {
          state.actionStatus[contentKey] = "loading";
        }
      })
      .addCase(removeFavoriteItem.fulfilled, (state, action) => {
        const contentKey = action.payload;
        state.items = state.items.filter((item) => item.contentKey !== contentKey);
        state.actionStatus[contentKey] = "succeeded";
      })
      .addCase(removeFavoriteItem.rejected, (state, action) => {
        const contentKey = action.payload?.contentKey || action.meta.arg;
        if (contentKey) {
          state.actionStatus[contentKey] = "failed";
        }
        state.error = action.payload?.message || action.error.message || "Failed to remove favorite";
      });
  },
});

export const { clearFavoritesError } = favoritesSlice.actions;

export const selectFavorites = (state) => state.favorites;
export const selectFavoriteItems = (state) => state.favorites.items;
export const selectFavoriteStatus = (state) => state.favorites.status;
export const selectFavoriteError = (state) => state.favorites.error;
export const selectFavoriteActionStatus = (state) => state.favorites.actionStatus;
export const selectFavoriteKeySet = createSelector(selectFavoriteItems, (items) => {
  return new Set(items.map((item) => item.contentKey));
});

export default favoritesSlice.reducer;

