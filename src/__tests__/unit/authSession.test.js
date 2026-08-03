/**
 * L1 unit tests for the client-side session.
 *
 * Mirrors the FE-AuthSession sheet in Report 5.1_UnitTests_L1.xlsx one row per test;
 * the case number is embedded in each title so the two can be traced either way.
 *
 * Spec source: UCS Report 3.1 — UC-02 (BR-03), UC-03 (BR-01, BR-02).
 * Modules under test: src/utils/auth.js, src/utils/apiError.js, src/store/authStore.js
 */

import {
  buildSessionFromAuthPayload,
  canAccessPath,
  clearStoredAuth,
  decodeJwtPayload,
  extractRoleFromUser,
  getPostLoginPath,
  getRoleFromToken,
  migrateLegacyAuthStorage,
  normalizeRole,
  persistAuth,
  readStoredAuth,
} from "../../utils/auth";
import {
  getApiErrorMessage,
  getFriendlyApiErrorMessage,
} from "../../utils/apiError";
import { BTMS_TOKEN_KEY, BTMS_USER_KEY } from "../../constants/auth";

// authStore calls the API while restoring a session — mocked so the tests never touch the network
jest.mock("../../api/authApi", () => ({
  getMe: jest.fn(),
}));

const authApi = require("../../api/authApi");
const { useAuthStore } = require("../../store/authStore");

/** Builds a structurally real JWT (three segments, base64url payload) without a genuine signature. */
const makeToken = (payload) => {
  const encode = (obj) =>
    btoa(JSON.stringify(obj)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  return `${encode({ alg: "HS256", typ: "JWT" })}.${encode(payload)}.chu-ky-gia`;
};

const initialStoreState = useAuthStore.getState();

beforeEach(() => {
  localStorage.clear();
  jest.clearAllMocks();
  // Every test starts from the pristine store state, so execution order never matters
  useAuthStore.setState(initialStoreState, true);
});

// ═══════════════════════════ normalizeRole ═══════════════════════════

describe("normalizeRole — role normalisation (UC-02 / BR-03)", () => {
  test("TC-001 · Strips the ROLE_ prefix down to the canonical code", () => {
    expect(normalizeRole("ROLE_ADMIN")).toBe("ADMIN");
    expect(normalizeRole("ROLE_OWNER")).toBe("OWNER");
    expect(normalizeRole("ROLE_MANAGER")).toBe("MANAGER");
    expect(normalizeRole("ROLE_STAFF")).toBe("STAFF");
    expect(normalizeRole("ROLE_PLAYER")).toBe("PLAYER");
  });

  test("TC-002 · Recognises legacy role aliases", () => {
    expect(normalizeRole("ADMINISTRATOR")).toBe("ADMIN");
    expect(normalizeRole("ROLE_USER")).toBe("PLAYER");
  });

  test("TC-003 · Empty input yields null instead of throwing", () => {
    expect(normalizeRole(null)).toBeNull();
    expect(normalizeRole(undefined)).toBeNull();
    expect(normalizeRole("")).toBeNull();
  });

  test("TC-004 · Trims whitespace and upper-cases", () => {
    expect(normalizeRole("  owner  ")).toBe("OWNER");
  });
});

// ═══════════════════════════ extractRoleFromUser ═══════════════════════════

describe("extractRoleFromUser — reading the role from varied payload shapes (UC-02 / BR-03)", () => {
  test("TC-005 · Role carried on the role field", () => {
    expect(extractRoleFromUser({ role: "MANAGER" })).toBe("MANAGER");
  });

  test("TC-006 · A roles array resolves to the highest privilege, not the first entry", () => {
    // Taking element zero instead would route an Admin into the Player area
    expect(extractRoleFromUser({ roles: ["PLAYER", "ADMIN"] })).toBe("ADMIN");
    expect(extractRoleFromUser({ roles: ["STAFF", "OWNER"] })).toBe("OWNER");
  });

  test("TC-007 · No resolvable role", () => {
    expect(extractRoleFromUser(null)).toBeNull();
    expect(extractRoleFromUser({ email: "a@b.com" })).toBeNull();
  });
});

// ═══════════════════════════ decodeJwtPayload / getRoleFromToken ═══════════════════════════

describe("Reading claims from a token (UC-02 / BR-03)", () => {
  test("TC-008 · Decodes the payload of a well-formed token", () => {
    const token = makeToken({ sub: "1", role: "OWNER", email: "a@b.com" });

    expect(decodeJwtPayload(token)).toMatchObject({ role: "OWNER", email: "a@b.com" });
  });

  test("TC-009 · Malformed tokens never crash the app", () => {
    // localStorage can be hand-edited; throwing here would blank the screen
    expect(decodeJwtPayload("khong-phai-jwt")).toBeNull();
    expect(decodeJwtPayload(null)).toBeNull();
    expect(decodeJwtPayload(123)).toBeNull();
    expect(decodeJwtPayload("a.@@khong-base64@@.c")).toBeNull();
  });

  test("TC-010 · Reads the role claim from a token", () => {
    expect(getRoleFromToken(makeToken({ role: "STAFF" }))).toBe("STAFF");
  });

  test("TC-011 · Falls back to the authorities claim", () => {
    expect(getRoleFromToken(makeToken({ authorities: ["ROLE_OWNER"] }))).toBe("OWNER");
  });
});

// ═══════════════════════════ buildSessionFromAuthPayload ═══════════════════════════

describe("buildSessionFromAuthPayload — building the session after sign-in (UC-02)", () => {
  test("TC-012 · Builds a session from the standard login response", () => {
    const token = makeToken({ role: "PLAYER" });
    const session = buildSessionFromAuthPayload(
      { data: { data: { token, tokenType: "Bearer", expiresIn: 3600, user: { email: "a@b.com", role: "PLAYER" } } } },
      "a@b.com"
    );

    expect(session.token).toBe(token);
    expect(session.tokenType).toBe("Bearer");
    expect(session.expiresIn).toBe(3600);
    expect(session.user).toMatchObject({ email: "a@b.com", role: "PLAYER" });
  });

  test("TC-013 · Handles both the wrapped and the flat response shape", () => {
    const token = makeToken({ role: "PLAYER" });

    expect(buildSessionFromAuthPayload({ data: { data: { token } } }).token).toBe(token);
    expect(buildSessionFromAuthPayload({ token }).token).toBe(token);
  });

  test("TC-014 · A response without a token is refused", () => {
    expect(() =>
      buildSessionFromAuthPayload({ data: { data: { user: { email: "a@b.com" } } } }, "a@b.com")
    ).toThrow("Không nhận được accessToken từ máy chủ.");
  });

  test("TC-015 · Token role wins when the payload only says PLAYER", () => {
    // This is the decision that determines which area the user lands in
    const token = makeToken({ role: "ADMIN" });
    const session = buildSessionFromAuthPayload({ data: { data: { token, user: { email: "a@b.com" } } } });

    expect(session.user.role).toBe("ADMIN");
  });

  test("TC-016 · Missing email falls back to the address typed into the form", () => {
    const token = makeToken({ role: "PLAYER" });
    const session = buildSessionFromAuthPayload({ data: { data: { token, user: {} } } }, "nhap@form.com");

    expect(session.user.email).toBe("nhap@form.com");
  });
});

// ═══════════════════════════ canAccessPath / getPostLoginPath ═══════════════════════════

describe("Role-based routing (UC-02 / BR-03)", () => {
  test("TC-017 · Each role reaches only its own area", () => {
    expect(canAccessPath("ADMIN", "/admin/users")).toBe(true);
    expect(canAccessPath("PLAYER", "/admin/users")).toBe(false);
    expect(canAccessPath("MANAGER", "/owner/tournaments")).toBe(false);
    expect(canAccessPath("STAFF", "/staff/matches")).toBe(true);
  });

  test("TC-018 · Public paths are open to every role", () => {
    expect(canAccessPath("PLAYER", "/event")).toBe(true);
    expect(canAccessPath(null, "/news")).toBe(true);
  });

  test("TC-019 · Returns the user to the page they were heading for", () => {
    expect(getPostLoginPath("ADMIN", "/admin/users")).toBe("/admin/users");
  });

  test("TC-020 · Ignores a redirect the role may not follow", () => {
    // Blocks a crafted redirect parameter from coaxing the app into opening the admin area
    expect(getPostLoginPath("PLAYER", "/admin/users")).toBe("/event");
  });
});

// ═══════════════════════════ Browser-side session storage ═══════════════════════════

describe("Browser-side session storage (UC-02, UC-03 / BR-01)", () => {
  test("TC-021 · Round trip through browser storage", () => {
    persistAuth({ token: "jwt", user: { email: "a@b.com", role: "OWNER" } });

    expect(readStoredAuth()).toEqual({
      token: "jwt",
      user: expect.objectContaining({ email: "a@b.com", role: "OWNER" }),
    });
  });

  test("TC-022 · Nothing stored means nobody is signed in", () => {
    expect(readStoredAuth()).toBeNull();

    localStorage.setItem(BTMS_TOKEN_KEY, "jwt");
    expect(readStoredAuth()).toBeNull();
  });

  test("TC-023 · Corrupted stored user data is tolerated", () => {
    localStorage.setItem(BTMS_TOKEN_KEY, "jwt");
    localStorage.setItem(BTMS_USER_KEY, "{khong-phai-json");

    expect(readStoredAuth()).toBeNull();
  });

  test("TC-024 · Signing out wipes every stored key", () => {
    localStorage.setItem(BTMS_TOKEN_KEY, "jwt");
    localStorage.setItem(BTMS_USER_KEY, JSON.stringify({ email: "a@b.com" }));
    localStorage.setItem("token", "jwt-cu");
    localStorage.setItem("user", JSON.stringify({ email: "a@b.com" }));

    clearStoredAuth();

    // Leaving one key behind lets the session be restored after signing out
    expect(localStorage.getItem(BTMS_TOKEN_KEY)).toBeNull();
    expect(localStorage.getItem(BTMS_USER_KEY)).toBeNull();
    expect(localStorage.getItem("token")).toBeNull();
    expect(localStorage.getItem("user")).toBeNull();
  });

  test("TC-025 · Migrates the legacy storage keys", () => {
    localStorage.setItem("token", "jwt-cu");
    localStorage.setItem("user", JSON.stringify({ email: "a@b.com" }));

    migrateLegacyAuthStorage();

    expect(localStorage.getItem(BTMS_TOKEN_KEY)).toBe("jwt-cu");
    expect(localStorage.getItem("token")).toBeNull();
  });

  test("TC-026 · A current session is never overwritten by legacy data", () => {
    localStorage.setItem(BTMS_TOKEN_KEY, "jwt-moi");
    localStorage.setItem("token", "jwt-cu");

    migrateLegacyAuthStorage();

    // Overwriting here would drop the user back onto an expired session
    expect(localStorage.getItem(BTMS_TOKEN_KEY)).toBe("jwt-moi");
    expect(localStorage.getItem("token")).toBeNull();
  });
});

// ═══════════════════════════ authStore ═══════════════════════════

describe("authStore — storing the session and signing out (UC-02, UC-03)", () => {
  test("TC-027 · Stores the session after a successful sign-in", () => {
    useAuthStore.getState().setSession({
      token: "jwt",
      user: { email: "a@b.com", role: "OWNER" },
      tokenType: "Bearer",
      expiresIn: 3600,
    });

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.authReady).toBe(true);
    expect(state.isLoginOpen).toBe(false);
    expect(localStorage.getItem(BTMS_TOKEN_KEY)).toBe("jwt");
  });

  test("TC-028 · Missing tokenType defaults to Bearer", () => {
    useAuthStore.getState().setSession({ token: "jwt", user: { email: "a@b.com" } });

    const state = useAuthStore.getState();
    expect(state.tokenType).toBe("Bearer");
    expect(state.expiresIn).toBeNull();
  });

  test("TC-029 · Signing out clears the session state", () => {
    useAuthStore.getState().setSession({ token: "jwt", user: { email: "a@b.com", role: "OWNER" } });

    useAuthStore.getState().logout();

    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.token).toBeNull();
    expect(state.isAuthenticated).toBe(false);
    expect(state.authReady).toBe(true);
    expect(localStorage.getItem(BTMS_TOKEN_KEY)).toBeNull();
  });

  test("TC-030 · Signing out never calls the server", () => {
    useAuthStore.getState().setSession({ token: "jwt", user: { email: "a@b.com" } });

    useAuthStore.getState().logout();

    // UC-03 states plainly that there is no server-side session to invalidate
    expect(authApi.getMe).not.toHaveBeenCalled();
  });

  test("TC-031 · Signs in from an API response and returns the user", () => {
    const token = makeToken({ role: "MANAGER" });

    const user = useAuthStore
      .getState()
      .loginFromResponse({ data: { data: { token, user: { email: "a@b.com" } } } }, "a@b.com");

    expect(user.role).toBe("MANAGER");
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
  });

  test("TC-032 · Restores the session on page reload", async () => {
    const token = makeToken({ role: "OWNER" });
    persistAuth({ token, user: { email: "a@b.com", role: "OWNER" } });
    authApi.getMe.mockResolvedValue({ email: "a@b.com", role: "OWNER", id: 7 });

    await useAuthStore.getState().hydrateAuth();

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.authReady).toBe(true);
    expect(state.user).toMatchObject({ email: "a@b.com", role: "OWNER", id: 7 });
  });

  test("TC-033 · An expired token signs the user out", async () => {
    const token = makeToken({ role: "OWNER" });
    persistAuth({ token, user: { email: "a@b.com", role: "OWNER" } });
    authApi.getMe.mockRejectedValue({ response: { status: 401 } });

    await useAuthStore.getState().hydrateAuth();

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.authReady).toBe(true);
    expect(localStorage.getItem(BTMS_TOKEN_KEY)).toBeNull();
  });

  test("TC-034 · A network failure keeps the session and reads the role from the token", async () => {
    const token = makeToken({ role: "OWNER" });
    persistAuth({ token, user: { email: "a@b.com", role: "PLAYER" } });
    authApi.getMe.mockRejectedValue(new Error("Network Error"));

    await useAuthStore.getState().hydrateAuth();

    const state = useAuthStore.getState();
    // A deliberate contrast with TC-033: losing the network must not eject the user
    expect(state.isAuthenticated).toBe(true);
    expect(state.user.role).toBe("OWNER");
    expect(state.authReady).toBe(true);
    expect(localStorage.getItem(BTMS_TOKEN_KEY)).toBe(token);
  });

  test("TC-035 · No stored token ends in the guest state", async () => {
    await useAuthStore.getState().hydrateAuth();

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.authReady).toBe(true);
    expect(authApi.getMe).not.toHaveBeenCalled();
  });
});

// ═══════════════════════════ apiError ═══════════════════════════

describe("Error message normalisation (UC-02 / AF-01, AF-02)", () => {
  test("TC-036 · Surfaces the message the server sent", () => {
    const error = { response: { data: { message: "Email hoặc mật khẩu không đúng" } } };

    expect(getApiErrorMessage(error)).toBe("Email hoặc mật khẩu không đúng");
  });

  test("TC-037 · Hides technical messages from end users", () => {
    expect(getFriendlyApiErrorMessage({ message: "Network Error" }))
      .toBe("Không thể kết nối máy chủ. Vui lòng thử lại.");
    expect(getFriendlyApiErrorMessage({ message: "Request failed with status code 500" }))
      .toBe("Không thể kết nối máy chủ. Vui lòng thử lại.");
  });

  test("TC-038 · Business messages are passed through untouched", () => {
    const error = { response: { data: { message: "Tài khoản đã bị khóa" } } };

    // The UC-02 AF-02 wording has to reach the user
    expect(getFriendlyApiErrorMessage(error, "Default error")).toBe("Tài khoản đã bị khóa");
  });

  test("TC-039 · An error carrying no information at all", () => {
    expect(getApiErrorMessage(null)).toBe("Có lỗi xảy ra. Vui lòng thử lại.");
    expect(getApiErrorMessage({})).toBe("Có lỗi xảy ra. Vui lòng thử lại.");
  });
});
