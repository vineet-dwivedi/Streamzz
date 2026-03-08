import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { historyApi } from "@/features/history/api/historyApi";

const initialState = {
  items: [],
  status: "idle",
  error: null,
  actionStatus: {},
};

const getErrorMessage = (error, fallbackMessage) => {
  return error?.response?.data?.message || error?.message || fallbackMessage;
};

export const fetchHistoryItems = createAsyncThunk("history/fetchAll", async (_, thunkApi) => {
  try {
    const response = await historyApi.getAll();
    return response.data?.data || [];
  } catch (error) {
    return thunkApi.rejectWithValue(getErrorMessage(error, "Failed to fetch history"));
  }
});

export const addHistoryItem = createAsyncThunk("history/add", async (payload, thunkApi) => {
  try {
    const response = await historyApi.add(payload);
    return response.data?.data || payload;
  } catch (error) {
    return thunkApi.rejectWithValue(getErrorMessage(error, "Failed to save history"));
  }
});

export const removeHistoryItem = createAsyncThunk("history/remove", async (contentKey, thunkApi) => {
  try {
    await historyApi.remove(contentKey);
    return contentKey;
  } catch (error) {
    return thunkApi.rejectWithValue({
      message: getErrorMessage(error, "Failed to remove history"),
      contentKey,
    });
  }
});

const historySlice = createSlice({
  name: "history",
  initialState,
  reducers: {
    clearHistoryError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchHistoryItems.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchHistoryItems.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload;
      })
      .addCase(fetchHistoryItems.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || action.error.message || "Failed to fetch history";
      })
      .addCase(addHistoryItem.pending, (state, action) => {
        const contentKey = action.meta.arg?.contentKey;
        if (contentKey) {
          state.actionStatus[contentKey] = "loading";
        }
      })
      .addCase(addHistoryItem.fulfilled, (state, action) => {
        const item = action.payload;
        if (!item?.contentKey) {
          return;
        }

        const index = state.items.findIndex((history) => history.contentKey === item.contentKey);
        if (index >= 0) {
          state.items[index] = item;
        } else {
          state.items.unshift(item);
        }

        state.actionStatus[item.contentKey] = "succeeded";
      })
      .addCase(addHistoryItem.rejected, (state, action) => {
        const contentKey = action.meta.arg?.contentKey;
        if (contentKey) {
          state.actionStatus[contentKey] = "failed";
        }
        state.error = action.payload || action.error.message || "Failed to save history";
      })
      .addCase(removeHistoryItem.pending, (state, action) => {
        const contentKey = action.meta.arg;
        if (contentKey) {
          state.actionStatus[contentKey] = "loading";
        }
      })
      .addCase(removeHistoryItem.fulfilled, (state, action) => {
        const contentKey = action.payload;
        state.items = state.items.filter((item) => item.contentKey !== contentKey);
        state.actionStatus[contentKey] = "succeeded";
      })
      .addCase(removeHistoryItem.rejected, (state, action) => {
        const contentKey = action.payload?.contentKey || action.meta.arg;
        if (contentKey) {
          state.actionStatus[contentKey] = "failed";
        }
        state.error = action.payload?.message || action.error.message || "Failed to remove history";
      });
  },
});

export const { clearHistoryError } = historySlice.actions;
export const selectHistory = (state) => state.history;
export const selectHistoryItems = (state) => state.history.items;
export const selectHistoryStatus = (state) => state.history.status;
export const selectHistoryError = (state) => state.history.error;
export const selectHistoryActionStatus = (state) => state.history.actionStatus;

export default historySlice.reducer;

