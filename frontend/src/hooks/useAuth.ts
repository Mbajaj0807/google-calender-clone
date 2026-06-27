import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authService } from '../services/auth.service';
import { useAuthStore } from '../store/authStore';
import type { LoginPayload, RegisterPayload } from '../types/auth.types';
import axios from 'axios';

export function useLogin() {
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (payload: LoginPayload) => authService.login(payload),
    onSuccess: ({ token, user }) => {
      setAuth(user, token);
      toast.success(`Welcome back, ${user.name.split(' ')[0]}!`);
      navigate('/');
    },
    onError: (error: unknown) => {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.message || 'Login failed');
      } else {
        toast.error('Something went wrong');
      }
    },
  });
}

export function useRegister() {
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (payload: RegisterPayload) => authService.register(payload),
    onSuccess: ({ token, user }) => {
      setAuth(user, token);
      toast.success(`Welcome to Calendar, ${user.name.split(' ')[0]}!`);
      navigate('/');
    },
    onError: (error: unknown) => {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.message || 'Registration failed');
      } else {
        toast.error('Something went wrong');
      }
    },
  });
}

export function useLogout() {
  const { clearAuth } = useAuthStore();
  const navigate = useNavigate();

  return () => {
    authService.logout();
    clearAuth();
    toast.success('Signed out');
    navigate('/login');
  };
}
