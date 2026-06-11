import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { User } from '../../types/user';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  showNicknameSetup: boolean;
  activeHomeId: string | null;
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
  showNicknameSetup: false,
  activeHomeId: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<User | null>) => {
      state.user = action.payload;
    },
    setAuthenticated: (state, action: PayloadAction<boolean>) => {
      state.isAuthenticated = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    setShowNicknameSetup: (state, action: PayloadAction<boolean>) => {
      state.showNicknameSetup = action.payload;
    },
    setActiveHomeId: (state, action: PayloadAction<string | null>) => {
      state.activeHomeId = action.payload;
    },
  },
});

export const {
  setUser,
  setAuthenticated,
  setLoading,
  setError,
  setShowNicknameSetup,
  setActiveHomeId,
} = authSlice.actions;
export default authSlice.reducer;
