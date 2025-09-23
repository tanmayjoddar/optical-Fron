import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

interface Shop {
  id: number;
  name: string;
  address: string;
  phone: string;
}

interface ShopAdmin {
  id: number;
  name: string;
  email: string;
  shop: Shop;
}

interface ShopAdminAuthState {
  token: string | null;
  shopAdmin: ShopAdmin | null;
  loading: boolean;
  error: string | null;
}

const initialState: ShopAdminAuthState = {
  token: localStorage.getItem('shopAdminJwt') || null,
  shopAdmin: null,
  loading: false,
  error: null,
};

export const shopAdminLogin = createAsyncThunk<
  { token: string; shopAdmin: ShopAdmin },
  { email: string; password: string },
  { rejectValue: string }
>(
  'shopAdminAuth/login',
  async (
    { email, password },
    { rejectWithValue }
  ) => {
    try {
      const response = await axios.post('/api/shop-admin/auth/login', { email, password }, {
        headers: { 'Content-Type': 'application/json' },
      });
      return response.data as { token: string; shopAdmin: ShopAdmin };
    } catch (err) {
      const message = (() => {
        if (typeof err === 'object' && err && 'response' in err) {
          const resp = (err as { response?: { data?: unknown } }).response;
          const data = resp?.data as { message?: string } | undefined;
          return data?.message;
        }
        return undefined;
      })();
      return rejectWithValue(message || 'Login failed');
    }
  }
);

const shopAdminAuthSlice = createSlice({
  name: 'shopAdminAuth',
  initialState,
  reducers: {
    shopAdminLogout(state) {
      state.token = null;
      state.shopAdmin = null;
      localStorage.removeItem('shopAdminJwt');
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(shopAdminLogin.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(shopAdminLogin.fulfilled, (state, action) => {
        state.loading = false;
        state.token = action.payload.token;
        state.shopAdmin = action.payload.shopAdmin;
        localStorage.setItem('shopAdminJwt', action.payload.token);
      })
      .addCase(shopAdminLogin.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { shopAdminLogout } = shopAdminAuthSlice.actions;
export default shopAdminAuthSlice.reducer;
