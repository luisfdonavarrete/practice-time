import { useNavigate } from 'react-router-dom';
import { api } from '../../app/api';
import { useAppDispatch } from '../../app/hooks';
import { authStorage } from './auth-storage';
import { loggedOut } from './auth.slice';

export function useLogout(): () => void {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  return () => {
    authStorage.clear();
    dispatch(loggedOut());
    dispatch(api.util.resetApiState());
    navigate('/login', { replace: true });
  };
}
