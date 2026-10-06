import { create } from 'zustand';

function getInitialUser() {
  try {
    const s = sessionStorage.getItem('cbl_user');
    if (s) return JSON.parse(s);
    const l = localStorage.getItem('cbl_user');
    if (l) return JSON.parse(l);
  } catch (e) {}
  return null;
}

function getInitialToken() {
  try {
    return sessionStorage.getItem('cbl_token') || localStorage.getItem('cbl_token') || null;
  } catch (e) {
    return null;
  }
}

export const useAuthStore = create(set => ({
  user: getInitialUser(),
  token: getInitialToken(),
  login: (user, token) => {
    try {
      sessionStorage.setItem('cbl_token', token);
      sessionStorage.setItem('cbl_user', JSON.stringify(user));
      localStorage.setItem('cbl_token', token);
      localStorage.setItem('cbl_user', JSON.stringify(user));
    } catch (e) {}
    set({ user, token });
  },
  logout: () => {
    try {
      sessionStorage.removeItem('cbl_token');
      sessionStorage.removeItem('cbl_user');
      localStorage.removeItem('cbl_token');
      localStorage.removeItem('cbl_user');
    } catch (e) {}
    set({ user: null, token: null });
  }
}));

