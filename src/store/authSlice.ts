import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';


export type AuthType = 'staff' | 'shopAdmin' | 'retailer' | 'admin' | null;

interface AuthState {
  token: string | null;
  type: AuthType;
  user: unknown;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  token: localStorage.getItem('jwt') || null,
  type: (() => {
    const stored = localStorage.getItem('userData');
    if (stored) {
      try {
        return JSON.parse(stored).type || null;
      } catch {
        return null;
      }
    }
    return null;
  })(),
  user: (() => {
    const stored = localStorage.getItem('userData');
    if (stored) {
      try {
        return JSON.parse(stored).user || null;
      } catch {
        return null;
      }
    }
    return null;
  })(),
  loading: false,
  error: null,
};


export const login = createAsyncThunk(
  'auth/login',
  async (
    { type, email, password }: { type: AuthType; email: string; password: string },
    { rejectWithValue }
  ) => {
    let url = '';
  if (type === 'staff') url = 'https://staff-production-c6d9.up.railway.app/api/auth/login/';
  if (type === 'shopAdmin') url = 'https://staff-production-c6d9.up.railway.app/shop-admin/auth/login';
  if (type === 'retailer') url = 'https://staff-production-c6d9.up.railway.app/retailer/auth/login';
    
    try {
      const response = await axios.post(url, { email, password }, {
        headers: { 'Content-Type': 'application/json' },
      });
      console.log(response.data);
      
      // Handle different response structures based on user type
      let user;
      if (type === 'staff') user = response.data.staff;
      else if (type === 'shopAdmin') user = response.data.shopAdmin;
      else if (type === 'retailer') user = response.data.retailer;
      
      return { token: response.data.token, type, user };
    } catch (err) {
      const msg = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Login failed';
      return rejectWithValue(msg);
    }
  }
);


const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout(state) {
      state.token = null;
      state.type = null;
      state.user = null;
      localStorage.removeItem('jwt');
      localStorage.removeItem('userData');
    },
    tokenExp(state) {
      state.token = null;
      state.type = null;
      state.user = null;
      localStorage.removeItem('jwt');
      localStorage.removeItem('userData');
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.token = action.payload.token;
        state.type = action.payload.type;
        state.user = action.payload.user;
        localStorage.setItem('jwt', action.payload.token);
          // Store user data (excluding token) in localStorage
          localStorage.setItem('userData', JSON.stringify({
            type: action.payload.type,
            user: action.payload.user
          }));
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;
