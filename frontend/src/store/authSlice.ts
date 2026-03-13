import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface AuthState {
  isAuthenticated: boolean;
  user: { name: string; email: string } | null;
}

const stored = typeof window !== 'undefined' ? localStorage.getItem('auth_user') : null;
const parsed = stored ? JSON.parse(stored) : null;

const initialState: AuthState = {
  isAuthenticated: !!parsed,
  user: parsed,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    login(state, action: PayloadAction<{ name: string; email: string }>) {
      state.isAuthenticated = true;
      state.user = action.payload;
      localStorage.setItem('auth_user', JSON.stringify(action.payload));
    },
    logout(state) {
      state.isAuthenticated = false;
      state.user = null;
      localStorage.removeItem('auth_user');
    },
  },
});

export const { login, logout } = authSlice.actions;
export default authSlice.reducer;
