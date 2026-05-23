import { create } from "zustand";

export const useAuthStore = create((set) => ({
  isLoginOpen: false,
  user: null,
  token: null,
  isAuthenticated: false,

  openLogin: () => set({ isLoginOpen: true }),
  closeLogin: () => set({ isLoginOpen: false }),

  login: (userData, token) => {
    set({
      user: userData,
      token: token,
      isAuthenticated: true,
      isLoginOpen: false,
    });
  },

  logout: () => {
    set({
      user: null,
      token: null,
      isAuthenticated: false,
    });
  },
}));