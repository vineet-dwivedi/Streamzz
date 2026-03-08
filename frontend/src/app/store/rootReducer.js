import { combineReducers } from "@reduxjs/toolkit";
import authReducer from "@/features/auth/model/authSlice";
import moviesReducer from "@/features/movies/model/moviesSlice";
import favoritesReducer from "@/features/favorites/model/favoritesSlice";
import historyReducer from "@/features/history/model/historySlice";
import adminReducer from "@/features/admin/model/adminSlice";

const rootReducer = combineReducers({
  auth: authReducer,
  movies: moviesReducer,
  favorites: favoritesReducer,
  history: historyReducer,
  admin: adminReducer,
});

export default rootReducer;
