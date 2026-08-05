/**
 * L1 unit tests for the shared HTTP client.
 *
 * Mirrors the FE-HttpClient sheet in Report 5.1_UnitTests_L1.xlsx one row per test;
 * the case number is embedded in each title so the two can be traced either way.
 *
 * Spec source: UCS Report 3.1 — UC-02 (BR-03, the bearer token on every call),
 *              UC-03 (BR-01, the session is discarded when the token is refused).
 * Module under test: src/api/axiosClient.js
 *
 * Every request in the product goes through these two interceptors. The request half decides
 * whether a call is authenticated at all; the response half decides whether a 401 throws the user
 * back to the sign-in page or is swallowed — and getting that wrong produces either a redirect
 * loop or a screen that silently shows nothing.
 */

const mockLogout = jest.fn();
let mockToken = null;

jest.mock("../../store/authStore", () => ({
  useAuthStore: {
    getState: () => ({ token: mockToken, logout: mockLogout }),
  },
}));

// eslint-disable-next-line import/first
import axiosClient from "../../api/axiosClient";

const requestInterceptor = axiosClient.interceptors.request.handlers[0];
const responseInterceptor = axiosClient.interceptors.response.handlers[0];

/** Replaces window.location so the redirect can be observed without jsdom navigating. */
const setLocation = (pathname) => {
  const location = { pathname, href: "" };
  Object.defineProperty(window, "location", {
    configurable: true,
    writable: true,
    value: location,
  });
  return location;
};

/** An axios error as the response interceptor receives it. */
const axiosError = ({ status, data, url = "/tournaments", message = "Request failed" } = {}) => ({
  message,
  config: { url },
  response: status === undefined ? undefined : { status, data },
});

beforeEach(() => {
  mockLogout.mockClear();
  mockToken = null;
  setLocation("/owner/tournaments");
});

describe("The request interceptor — the bearer token (UC-02 / BR-03)", () => {
  test("TC-001 · A stored token is sent as a bearer header", () => {
    mockToken = "jwt-abc";
    const config = requestInterceptor.fulfilled({ headers: {} });
    expect(config.headers.Authorization).toBe("Bearer jwt-abc");
  });

  test("TC-002 · With no session the request goes out unauthenticated", () => {
    const config = requestInterceptor.fulfilled({ headers: {} });
    // The public tournament and branch endpoints are reachable signed out
    expect(config.headers.Authorization).toBeUndefined();
  });

  test("TC-003 · An empty token is not sent as an empty bearer header", () => {
    mockToken = "";
    const config = requestInterceptor.fulfilled({ headers: {} });
    // "Bearer " with nothing after it reads as a malformed credential, not as no credential
    expect(config.headers.Authorization).toBeUndefined();
  });

  test("TC-004 · Headers already on the request are left alone", () => {
    mockToken = "jwt-abc";
    const config = requestInterceptor.fulfilled({
      headers: { "Content-Type": "multipart/form-data" },
    });
    expect(config.headers["Content-Type"]).toBe("multipart/form-data");
    expect(config.headers.Authorization).toBe("Bearer jwt-abc");
  });

  test("TC-005 · A request that failed before it was sent is passed on untouched", async () => {
    const failure = new Error("offline");
    await expect(requestInterceptor.rejected(failure)).rejects.toBe(failure);
  });
});

describe("The response interceptor — a refused token (UC-03 / BR-01)", () => {
  test("TC-006 · A successful response is returned as it stands", () => {
    const response = { status: 200, data: { ok: true } };
    expect(responseInterceptor.fulfilled(response)).toBe(response);
  });

  test("TC-007 · A 401 discards the session and sends the user to sign in", async () => {
    const location = setLocation("/owner/tournaments");
    await expect(responseInterceptor.rejected(axiosError({ status: 401 }))).rejects.toThrow();
    expect(mockLogout).toHaveBeenCalledTimes(1);
    expect(location.href).toBe("/login");
  });

  test("TC-008 · A 401 from the session probe clears the session without redirecting", async () => {
    const location = setLocation("/owner/tournaments");
    await expect(
      responseInterceptor.rejected(axiosError({ status: 401, url: "/auth/me" }))
    ).rejects.toThrow();
    // hydrateAuth already handles this one; redirecting here as well produces a reload loop
    expect(mockLogout).toHaveBeenCalledTimes(1);
    expect(location.href).toBe("");
  });

  test("TC-009 · A 401 raised on the sign-in page does not redirect to itself", async () => {
    const location = setLocation("/login");
    await expect(responseInterceptor.rejected(axiosError({ status: 401 }))).rejects.toThrow();
    // A wrong password is a 401, and bouncing to /login would wipe the error the user needs to read
    expect(location.href).toBe("");
  });

  test("TC-010 · The other two public pages are treated the same way", async () => {
    for (const path of ["/register", "/forgot-password"]) {
      const location = setLocation(path);
      await expect(responseInterceptor.rejected(axiosError({ status: 401 }))).rejects.toThrow();
      expect(location.href).toBe("");
    }
  });

  test("TC-011 · The public live screen is never interrupted by a redirect", async () => {
    const location = setLocation("/live/77");
    await expect(responseInterceptor.rejected(axiosError({ status: 401 }))).rejects.toThrow();
    // A spectator following a match has no session to lose and must not be thrown out mid-frame
    expect(location.href).toBe("");
  });

  test("TC-012 · A 403 leaves the session intact", async () => {
    await expect(responseInterceptor.rejected(axiosError({ status: 403 }))).rejects.toThrow();
    // The token is valid, the role simply is not allowed here — signing the user out would be wrong
    expect(mockLogout).not.toHaveBeenCalled();
  });

  test("TC-013 · A server error leaves the session intact", async () => {
    await expect(responseInterceptor.rejected(axiosError({ status: 500 }))).rejects.toThrow();
    expect(mockLogout).not.toHaveBeenCalled();
  });
});

describe("The response interceptor — the error handed to the caller (UC-03 / BR-02)", () => {
  test("TC-014 · The backend message is what the screen receives", async () => {
    const error = axiosError({
      status: 400,
      data: { message: "Mã field đã tồn tại trong catalog", code: "DUPLICATE_RESOURCE" },
    });
    await expect(responseInterceptor.rejected(error)).rejects.toThrow(
      "Mã field đã tồn tại trong catalog"
    );
  });

  test("TC-015 · The business error code is carried alongside the message", async () => {
    const error = axiosError({ status: 400, data: { message: "x", code: "DUPLICATE_RESOURCE" } });
    await responseInterceptor.rejected(error).catch((wrapped) => {
      // Screens branch on the code rather than on the Vietnamese text
      expect(wrapped.code).toBe("DUPLICATE_RESOURCE");
      expect(wrapped.response.status).toBe(400);
    });
  });

  test("TC-016 · Without a backend message the axios message is used", async () => {
    const error = axiosError({ status: 400, data: {}, message: "Request failed with status 400" });
    await expect(responseInterceptor.rejected(error)).rejects.toThrow(
      "Request failed with status 400"
    );
  });

  test("TC-017 · A network failure with no response still produces a readable error", async () => {
    const error = { message: "", config: { url: "/tournaments" } };
    await expect(responseInterceptor.rejected(error)).rejects.toThrow(
      "Có lỗi xảy ra. Vui lòng thử lại."
    );
  });

  test("TC-018 · A dropped connection does not sign the user out", async () => {
    await expect(
      responseInterceptor.rejected({ message: "Network Error", config: { url: "/x" } })
    ).rejects.toThrow("Network Error");
    // Losing wifi for a moment must not cost the user their session
    expect(mockLogout).not.toHaveBeenCalled();
  });

  test("TC-019 · Every rejection reaches the caller as a real Error", async () => {
    await responseInterceptor.rejected(axiosError({ status: 500, data: {} })).catch((wrapped) => {
      // Screens call err.message directly, so a plain object here would render as [object Object]
      expect(wrapped).toBeInstanceOf(Error);
      expect(typeof wrapped.message).toBe("string");
    });
  });
});
