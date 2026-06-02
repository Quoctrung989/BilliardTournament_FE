import { BTMS_TOKEN_KEY, BTMS_USER_KEY, ROLES } from "../constants/auth";

/** Chuẩn hóa role phase 1: ADMIN | STAFF | PLAYER */
export const normalizeRole = (role) => {
  if (role == null || role === "") return null;
  const value = String(role).trim().toUpperCase();
  if (value === "ROLE_ADMIN" || value === "ADMINISTRATOR") return ROLES.ADMIN;
  if (value === "ROLE_OWNER") return ROLES.OWNER;
  if (value === "ROLE_MANAGER") return ROLES.MANAGER;
  if (value === "ROLE_STAFF") return ROLES.STAFF;
  if (value === "ROLE_PLAYER" || value === "ROLE_USER") return ROLES.PLAYER;
  if ([ROLES.ADMIN, ROLES.OWNER, ROLES.MANAGER, ROLES.STAFF, ROLES.PLAYER].includes(value))
    return value;
  return value;
};

export const extractRoleFromUser = (user) => {
  if (!user) return null;
  if (user.role != null) return normalizeRole(user.role);
  if (user.roles?.code != null) return normalizeRole(user.roles.code);
  if (typeof user.roles === "string") return normalizeRole(user.roles);
  if (Array.isArray(user.roles)) {
    const codes = user.roles.map((r) =>
      normalizeRole(typeof r === "string" ? r : r?.code)
    );
    if (codes.includes(ROLES.ADMIN)) return ROLES.ADMIN;
    if (codes.includes(ROLES.OWNER)) return ROLES.OWNER;
    if (codes.includes(ROLES.MANAGER)) return ROLES.MANAGER;
    if (codes.includes(ROLES.STAFF)) return ROLES.STAFF;
    if (codes.includes(ROLES.PLAYER)) return ROLES.PLAYER;
  }
  return null;
};

export const normalizeUser = (user, fallbackEmail) => {
  const role = extractRoleFromUser(user) || ROLES.PLAYER;
  return {
    ...(user || {}),
    email: user?.email || fallbackEmail || "",
    role,
  };
};

/** Decode JWT payload (không verify chữ ký — chỉ đọc claim role khi F5) */
export const decodeJwtPayload = (token) => {
  if (!token || typeof token !== "string") return null;
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
};

export const getRoleFromToken = (token) => {
  const payload = decodeJwtPayload(token);
  if (!payload) return null;
  return (
    normalizeRole(payload.role) ||
    normalizeRole(payload.roles?.code) ||
    normalizeRole(
      Array.isArray(payload.authorities) ? payload.authorities[0] : payload.authority
    )
  );
};

export const buildSessionFromAuthPayload = (apiResponse, fallbackEmail) => {
  const envelope = apiResponse?.data ?? apiResponse;
  const payload = envelope?.data ?? envelope;
  const accessToken = payload?.accessToken || payload?.token;
  if (!accessToken) {
    throw new Error("Không nhận được accessToken từ máy chủ.");
  }
  const user = normalizeUser(payload?.user, fallbackEmail);
  let role = user.role;
  if (!role || role === ROLES.PLAYER) {
    const fromToken = getRoleFromToken(accessToken);
    if (fromToken) role = fromToken;
  }
  return {
    token: accessToken,
    tokenType: payload?.tokenType || "Bearer",
    expiresIn: payload?.expiresIn,
    user: { ...user, role: role || ROLES.PLAYER },
  };
};

export const isAdminUser = (user) => normalizeRole(user?.role) === ROLES.ADMIN;
export const isOwnerUser = (user) => normalizeRole(user?.role) === ROLES.OWNER;
export const isManagerUser = (user) => normalizeRole(user?.role) === ROLES.MANAGER;
export const isStaffUser = (user) => normalizeRole(user?.role) === ROLES.STAFF;
export const isPlayerUser = (user) => normalizeRole(user?.role) === ROLES.PLAYER;

export const getHomeRouteForRole = (role) => {
  const r = normalizeRole(role);
  if (r === ROLES.ADMIN) return "/admin/dashboard";
  if (r === ROLES.OWNER) return "/owner/tournaments";
  if (r === ROLES.MANAGER) return "/manager/tournaments";
  if (r === ROLES.STAFF) return "/staff/dashboard";
  if (r === ROLES.PLAYER) return "/event";
  return "/event";
};

export const canAccessPath = (role, path) => {
  if (!path) return true;
  const r = normalizeRole(role);
  if (path.startsWith("/admin")) return r === ROLES.ADMIN;
  if (path.startsWith("/owner")) return r === ROLES.OWNER;
  if (path.startsWith("/manager")) return r === ROLES.MANAGER;
  if (path.startsWith("/staff")) return r === ROLES.STAFF;
  if (path.startsWith("/player")) return r === ROLES.PLAYER;
  return true;
};

export const getPostLoginPath = (role, redirectPath) => {
  if (redirectPath && canAccessPath(role, redirectPath)) return redirectPath;
  return getHomeRouteForRole(role);
};

export const readStoredAuth = () => {
  try {
    const token = localStorage.getItem(BTMS_TOKEN_KEY);
    const userRaw = localStorage.getItem(BTMS_USER_KEY);
    if (!token || !userRaw) return null;
    const user = normalizeUser(JSON.parse(userRaw));
    return { token, user };
  } catch {
    return null;
  }
};

export const persistAuth = ({ token, user }) => {
  localStorage.setItem(BTMS_TOKEN_KEY, token);
  localStorage.setItem(BTMS_USER_KEY, JSON.stringify(user));
};

export const clearStoredAuth = () => {
  localStorage.removeItem(BTMS_TOKEN_KEY);
  localStorage.removeItem(BTMS_USER_KEY);
};

/** Migrate keys cũ token / user */
export const migrateLegacyAuthStorage = () => {
  const legacyToken = localStorage.getItem("token");
  const legacyUser = localStorage.getItem("user");
  if (legacyToken && !localStorage.getItem(BTMS_TOKEN_KEY)) {
    localStorage.setItem(BTMS_TOKEN_KEY, legacyToken);
  }
  if (legacyUser && !localStorage.getItem(BTMS_USER_KEY)) {
    localStorage.setItem(BTMS_USER_KEY, legacyUser);
  }
  localStorage.removeItem("token");
  localStorage.removeItem("user");
};
