import { create } from "zustand";

export const useAuthStore = create((set) => ({
  isLoginOpen: false,
  isSignupOpen: false,
  isForgotPasswordOpen: false,
  user: null,
  token: null,
  isAuthenticated: false,

  openLogin: () => set({ isLoginOpen: true, isSignupOpen: false, isForgotPasswordOpen: false }),
  closeLogin: () => set({ isLoginOpen: false }),
  openSignup: () => set({ isSignupOpen: true, isLoginOpen: false, isForgotPasswordOpen: false }),
  closeSignup: () => set({ isSignupOpen: false }),
  openForgotPassword: () => set({ isForgotPasswordOpen: true, isLoginOpen: false, isSignupOpen: false }),
  closeForgotPassword: () => set({ isForgotPasswordOpen: false }),

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