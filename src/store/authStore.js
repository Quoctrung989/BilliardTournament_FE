import { create } from "zustand";
import * as authApi from "../api/authApi";
import {
  buildSessionFromAuthPayload,
  clearStoredAuth,
  getRoleFromToken,
  migrateLegacyAuthStorage,
  normalizeUser,
  persistAuth,
  readStoredAuth,
} from "../utils/auth";

export const useAuthStore = create((set, get) => ({
  isLoginOpen: false,
  isSignupOpen: false,
  isForgotPasswordOpen: false,
  user: null,
  token: null,
  tokenType: "Bearer",
  expiresIn: null,
  isAuthenticated: false,
  authReady: false,

  openLogin: () =>
    set({ isLoginOpen: true, isSignupOpen: false, isForgotPasswordOpen: false }),
  closeLogin: () => set({ isLoginOpen: false }),
  openSignup: () =>
    set({ isSignupOpen: true, isLoginOpen: false, isForgotPasswordOpen: false }),
  closeSignup: () => set({ isSignupOpen: false }),
  openForgotPassword: () =>
    set({
      isForgotPasswordOpen: true,
      isLoginOpen: false,
      isSignupOpen: false,
    }),
  closeForgotPassword: () => set({ isForgotPasswordOpen: false }),

  setSession: ({ token, user, tokenType, expiresIn }) => {
    persistAuth({ token, user });
    set({
      token,
      user,
      tokenType: tokenType || "Bearer",
      expiresIn: expiresIn ?? null,
      isAuthenticated: true,
      isLoginOpen: false,
    });
  },

  loginFromResponse: (apiResponse, fallbackEmail) => {
    const session = buildSessionFromAuthPayload(apiResponse, fallbackEmail);
    get().setSession(session);
    return session.user;
  },

  logout: () => {
    clearStoredAuth();
    set({
      user: null,
      token: null,
      tokenType: "Bearer",
      expiresIn: null,
      isAuthenticated: false,
    });
  },

  hydrateAuth: async () => {
    migrateLegacyAuthStorage();
    const stored = readStoredAuth();

    if (!stored?.token) {
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        authReady: true,
      });
      return;
    }

    set({
      token: stored.token,
      user: stored.user,
      isAuthenticated: true,
      authReady: false,
    });

    try {
      const me = await authApi.getMe();
      const user = normalizeUser(me, stored.user.email);
      persistAuth({ token: stored.token, user });
      set({ user, authReady: true });
    } catch {
      const roleFromToken = getRoleFromToken(stored.token);
      const user = roleFromToken
        ? { ...stored.user, role: roleFromToken }
        : stored.user;
      if (roleFromToken) persistAuth({ token: stored.token, user });
      set({ user, authReady: true });
    }
  },
}));
