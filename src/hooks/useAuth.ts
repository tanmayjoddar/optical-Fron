import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../store';
import { logout } from '../store/authSlice';

export const useAuth = () => {
  const auth = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch();
  
  const handleLogout = () => {
    dispatch(logout());
  };
  
  return {
    user: auth.user,
    token: auth.token,
    type: auth.type,
    loading: auth.loading,
    error: auth.error,
    isAuthenticated: !!auth.token,
    isStaff: auth.type === 'staff',
    shopId: auth.user?.shopId || auth.user?.shop?.id,
    logout: handleLogout,
  };
};