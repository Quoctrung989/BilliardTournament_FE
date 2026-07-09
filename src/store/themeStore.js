import { create } from "zustand";

const STORAGE_KEY = "theme";

const getInitialTheme = () => {
  if (typeof window === "undefined") return "light";
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "dark" || stored === "light") return stored;
    // Mặc định luôn là light mode, không phụ thuộc chế độ sáng/tối của hệ thống
    return "light";
  } catch (e) {
    return "light";
  }
};

const applyTheme = (theme) => {
  const root = document.documentElement;
  if (theme === "dark") root.classList.add("dark");
  else root.classList.remove("dark");
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch (e) {}
};

export const useThemeStore = create((set, get) => ({
  theme: getInitialTheme(),

  setTheme: (theme) => {
    applyTheme(theme);
    set({ theme });
  },

  toggleTheme: () => {
    const next = get().theme === "dark" ? "light" : "dark";
    applyTheme(next);
    set({ theme: next });
  },

  // Đưa theme về mặc định light (dùng khi đăng xuất/đăng nhập lại)
  resetTheme: () => {
    applyTheme("light");
    set({ theme: "light" });
  },
}));
