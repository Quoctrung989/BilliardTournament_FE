import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import * as authApi from "../../api/authApi";
import { getPostLoginPath } from "../../utils/auth";

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { loginFromResponse } = useAuthStore();
  const redirectAfterLogin = location.state?.from?.pathname;
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const validateField = (name, value, currentErrors = errors) => {
    const newErrors = { ...currentErrors };
    if (name === "email") {
      if (!value) newErrors.email = "Email là bắt buộc";
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) newErrors.email = "Email không hợp lệ";
      else delete newErrors.email;
    }
    if (name === "password") {
      if (!value) newErrors.password = "Mật khẩu là bắt buộc";
      else if (value.length < 6) newErrors.password = "Mật khẩu phải có ít nhất 6 ký tự";
      else delete newErrors.password;
    }
    return newErrors;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setTouched((prev) => ({ ...prev, [name]: true }));
    setErrors((prev) => validateField(name, value, prev));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({ email: true, password: true });
    let newErrors = validateField("email", formData.email, {});
    newErrors = validateField("password", formData.password, newErrors);
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }
    setErrors({});
    setIsLoading(true);

    try {
      const { data } = await authApi.login({
        email: formData.email,
        password: formData.password,
      });
      if (!data.success) {
        throw new Error(data.message || "Đăng nhập thất bại. Sai email hoặc mật khẩu.");
      }
      const user = loginFromResponse(data, formData.email);
      navigate(getPostLoginPath(user.role, redirectAfterLogin));
    } catch (err) {
      setErrors({ submit: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass = (field) =>
    `w-full px-3 py-2 text-sm border rounded focus:outline-none transition-colors ${
      touched[field] && errors[field]
        ? "border-red-400 bg-red-50 focus:border-red-400"
        : "border-gray-300 bg-gray-50 focus:border-gray-500 focus:bg-white"
    }`;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero section with background */}
      <div
        className="flex-1 flex flex-col items-center pt-10 pb-0 relative"
        style={{
          background: "linear-gradient(rgba(10,20,50,0.72), rgba(10,20,60,0.80)), url('https://matchroompool.com/wp-content/uploads/2024/01/wnt-hero.jpg') center/cover no-repeat",
          backgroundColor: "#0d1b3e",
        }}
      >
        {/* Logo CAPSTONE */}
        <div className="text-center mb-5">
          <div style={{ fontSize: 42, fontWeight: 900, color: "#fff", fontStyle: "italic", letterSpacing: -1.5, lineHeight: 1, textTransform: "uppercase" }}>
            capstone<span style={{ color: "#e8471a" }}>.</span>
          </div>
          <p style={{ fontSize: 13, color: "#ccc", marginTop: 6 }}>
            Chào mừng bạn đến với nền tảng tỉ số trực tuyến <strong style={{ color: "#fff", fontStyle: "italic", textTransform: "uppercase" }}>capstone</strong>.
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-lg w-full max-w-sm mx-4" style={{ padding: "28px 28px 24px" }}>
          {/* Log in section */}
          <h2 style={{ fontSize: 13, fontWeight: 700, color: "#1a2a4a", textTransform: "uppercase", letterSpacing: "1.5px", fontStyle: "italic", marginBottom: 16 }}>
            Đăng nhập.
          </h2>

          {errors.submit && (
            <div className="mb-4 p-3 rounded text-xs text-red-600 bg-red-50 border border-red-200">
              {errors.submit}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="mb-3">
              <label className="block text-xs text-gray-600 mb-1">Địa chỉ E-mail</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                onBlur={() => setTouched((p) => ({ ...p, email: true }))}
                className={inputClass("email")}
                placeholder="Nhập địa chỉ email"
              />
              {touched.email && errors.email && (
                <p className="text-red-500 text-xs mt-1">{errors.email}</p>
              )}
            </div>

            <div className="mb-2">
              <label className="block text-xs text-gray-600 mb-1">Mật khẩu</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                onBlur={() => setTouched((p) => ({ ...p, password: true }))}
                className={inputClass("password")}
                placeholder="Nhập mật khẩu"
              />
              {touched.password && errors.password && (
                <p className="text-red-500 text-xs mt-1">{errors.password}</p>
              )}
            </div>

            <div className="text-right mb-4">
              <button
                type="button"
                onClick={() => navigate("/forgot-password")}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                Khôi phục mật khẩu tại đây
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center gap-2 px-6 py-2 rounded-full text-sm font-semibold text-white transition-colors"
              style={{ background: isLoading ? "#9ca3af" : "#1a2a4a" }}
            >
              {isLoading ? (
                <>
                  <AiOutlineLoading3Quarters className="animate-spin" size={14} />
                  Đang xử lý...
                </>
              ) : (
                "Đăng nhập"
              )}
            </button>
          </form>

          {/* Divider */}
          <hr className="my-5 border-gray-200" />

          {/* Sign up section */}
          <h3 style={{ fontSize: 13, fontWeight: 700, color: "#1a2a4a", textTransform: "uppercase", letterSpacing: "1.5px", fontStyle: "italic", marginBottom: 8 }}>
            Bạn chưa có tài khoản?
          </h3>
          <p className="text-xs text-gray-500 mb-4">
            Đăng ký ngay để cập nhật tỉ số trực tiếp từ <strong style={{ fontStyle: "italic", color: "#111", textTransform: "uppercase" }}>capstone</strong>.
          </p>
          <button
            type="button"
            onClick={() => navigate("/register")}
            className="px-6 py-2 rounded-full text-sm font-semibold text-white transition-colors"
            style={{ background: "#1a2a4a" }}
            onMouseOver={(e) => (e.target.style.background = "#243660")}
            onMouseOut={(e) => (e.target.style.background = "#1a2a4a")}
          >
            Đăng ký ngay
          </button>

          <div className="text-right mt-4">
            <button
              type="button"
              onClick={() => navigate("/")}
              className="text-xs text-gray-400 hover:text-gray-600"
            >
              Quay lại trang sự kiện
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer style={{ background: "#111d30", padding: "32px 40px 0" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1.4fr", gap: 24, maxWidth: 960, margin: "0 auto" }}>
          {/* Logo Footer */}
          <div>
            <div style={{ fontSize: 24, fontWeight: 900, color: "#fff", fontStyle: "italic", letterSpacing: -1, textTransform: "uppercase" }}>
              capstone<span style={{ color: "#e8471a" }}>.</span>
            </div>
          </div>

          {/* News */}
          <div>
            <h4 style={{ fontSize: 13, fontWeight: 600, color: "#fff", marginBottom: 12 }}>Tin tức</h4>
            <a href="https://matchroompool.com" target="_blank" rel="noreferrer"
              style={{ fontSize: 12.5, color: "#8a99b5", textDecoration: "none", display: "block" }}>
              🌐 matchroompool.com
            </a>
          </div>

          {/* Legal */}
          <div>
            <h4 style={{ fontSize: 13, fontWeight: 600, color: "#fff", marginBottom: 12 }}>Pháp lý</h4>
            {["Điều khoản & Điều kiện", "Chính sách bảo mật", "Chính sách Cookie"].map((item) => (
              <a key={item} href="#" style={{ fontSize: 12.5, color: "#8a99b5", textDecoration: "none", display: "block", marginBottom: 6 }}>
                {item}
              </a>
            ))}
          </div>

          {/* Contact */}
          <div>
            <h4 style={{ fontSize: 13, fontWeight: 600, color: "#fff", marginBottom: 12 }}>Liên hệ</h4>
            <p style={{ fontSize: 12.5, color: "#8a99b5", marginBottom: 6 }}>📞 +44 (0)1277 359 900</p>
            <p style={{ fontSize: 12.5, color: "#8a99b5", marginBottom: 12 }}>✉️ pool@matchroom.com</p>
            <p style={{ fontSize: 12.5, color: "#8a99b5", lineHeight: 1.6 }}>
              Matchroom Multi Sport Ltd<br />
              Mascalls, Mascalls Lane, Brentwood,<br />
              Essex, England CM14 5LJ
            </p>
          </div>
        </div>

        <div style={{ borderTop: "1px solid #1e2d4a", marginTop: 28, padding: "14px 0", textAlign: "center" }}>
          <p style={{ fontSize: 11.5, color: "#6b7280" }}>
            Nền tảng cập nhật tỉ số trực tiếp <strong style={{ fontStyle: "italic", color: "#8a99b5", textTransform: "uppercase" }}>capstone</strong>.<br />
            Bản quyền © Đã đăng ký bảo hộ cho Matchroom Multi Sport Ltd
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LoginPage;