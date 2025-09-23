import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../store';
import { logout } from '../store/authSlice';

export const useAuth = () => {
  const auth = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch();
  type BasicUser = { name?: string; email?: string; shopId?: number; shop?: { id?: number } } | null;
  const user = (auth.user as BasicUser) ?? null;
  
  const handleLogout = () => {
    dispatch(logout());
  };
  
  return {
    user,
    token: auth.token,
    type: auth.type,
    loading: auth.loading,
    error: auth.error,
    isAuthenticated: !!auth.token,
    isStaff: auth.type === 'staff',
    shopId: user?.shopId ?? user?.shop?.id,
    logout: handleLogout,
  };
};