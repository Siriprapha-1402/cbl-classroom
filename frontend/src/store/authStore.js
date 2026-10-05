import { create } from 'zustand';

export const useAuthStore = create(set => ({
  user: JSON.parse(localStorage.getItem('cbl_user') || 'null'),
  token: localStorage.getItem('cbl_token'),
  login: (user, token) => {
    localStorage.setItem('cbl_token', token);
    localStorage.setItem('cbl_user', JSON.stringify(user));
    set({ user, token });
  },
  logout: () => {
    localStorage.clear();
    set({ user: null, token: null });
  }
}));
