import { configureStore } from '@reduxjs/toolkit';
import interviewReducer from './interviewSlice';
import authReducer from './authSlice';

export const store = configureStore({
  reducer: {
    interview: interviewReducer,
    auth: authReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

