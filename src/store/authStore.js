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
import { useThemeStore } from "./themeStore";

let hydratePromise = null;

const isAuthFailure = (err) => {
  const status = err?.response?.status;
  return status === 401 || status === 403;
};

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
    // Mỗi lần đăng nhập luôn khởi tạo về light mode mặc định
    useThemeStore.getState().resetTheme();
    set({
      token,
      user,
      tokenType: tokenType || "Bearer",
      expiresIn: expiresIn ?? null,
      isAuthenticated: true,
      isLoginOpen: false,
      authReady: true,
    });
  },

  loginFromResponse: (apiResponse, fallbackEmail) => {
    const session = buildSessionFromAuthPayload(apiResponse, fallbackEmail);
    get().setSession(session);
    return session.user;
  },

  logout: () => {
    clearStoredAuth();
    // Reset giao diện về light mode mặc định sau khi đăng xuất
    useThemeStore.getState().resetTheme();
    set({
      user: null,
      token: null,
      tokenType: "Bearer",
      expiresIn: null,
      isAuthenticated: false,
      authReady: true,
    });
  },

  hydrateAuth: async () => {
    if (get().authReady) return;
    if (hydratePromise) return hydratePromise;

    hydratePromise = (async () => {
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
      } catch (err) {
        if (isAuthFailure(err)) {
          clearStoredAuth();
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            authReady: true,
          });
          return;
        }

        const roleFromToken = getRoleFromToken(stored.token);
        const user = roleFromToken
          ? { ...stored.user, role: roleFromToken }
          : stored.user;
        if (roleFromToken) persistAuth({ token: stored.token, user });
        set({ user, authReady: true });
      }
    })();

    try {
      await hydratePromise;
    } finally {
      hydratePromise = null;
    }
  },
}));
