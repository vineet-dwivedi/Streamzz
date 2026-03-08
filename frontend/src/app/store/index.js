import { configureStore } from "@reduxjs/toolkit";
import rootReducer from "@/app/store/rootReducer";

export const store = configureStore({
  reducer: rootReducer,
});
