import { useState } from "react";
import * as authApi from "../../api/authApi";
import { useNavigate } from "react-router-dom";
import { AiOutlineLoading3Quarters, AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";

const RegisterPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    agreeTerms: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const validateField = (name, value, currentFormData = formData, currentErrors = errors) => {
    const newErrors = { ...currentErrors };
    switch (name) {
      case "email":
        if (!value) newErrors.email = "Email là bắt buộc";
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) newErrors.email = "Email không hợp lệ";
        else delete newErrors.email;
        break;
      case "phone":
        if (!value) newErrors.phone = "Số điện thoại là bắt buộc";
        else if (!/^[0-9]{10,11}$/.test(value)) newErrors.phone = "Số điện thoại không hợp lệ (10-11 số)";
        else delete newErrors.phone;
        break;
      case "password":
        if (!value) newErrors.password = "Mật khẩu là bắt buộc";
        else if (value.length < 6) newErrors.password = "Mật khẩu phải có ít nhất 6 ký tự";
        else delete newErrors.password;
        if (currentFormData.confirmPassword && currentFormData.confirmPassword !== value)
          newErrors.confirmPassword = "Mật khẩu không khớp";
        else if (currentFormData.confirmPassword && value)
          delete newErrors.confirmPassword;
        break;
      case "confirmPassword":
        if (!value) newErrors.confirmPassword = "Vui lòng xác nhận mật khẩu";
        else if (value !== currentFormData.password) newErrors.confirmPassword = "Mật khẩu không khớp";
        else delete newErrors.confirmPassword;
        break;
      default: break;
    }
    return newErrors;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const val = type === "checkbox" ? checked : value;
    const newFormData = { ...formData, [name]: val };
    setFormData(newFormData);
    setTouched((prev) => ({ ...prev, [name]: true }));
    if (type === "checkbox") {
      const newErrors = { ...errors };
      if (!checked) newErrors.agreeTerms = "Bạn phải đồng ý với Điều khoản và Chính sách bảo mật";
      else delete newErrors.agreeTerms;
      setErrors(newErrors);
    } else {
      setErrors(validateField(name, val, newFormData, errors));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({ email: true, phone: true, password: true, confirmPassword: true, agreeTerms: true });
    let newErrors = {};
    newErrors = validateField("email", formData.email, formData, newErrors);
    newErrors = validateField("phone", formData.phone, formData, newErrors);
    newErrors = validateField("password", formData.password, formData, newErrors);
    newErrors = validateField("confirmPassword", formData.confirmPassword, formData, newErrors);
    if (!formData.agreeTerms) newErrors.agreeTerms = "Bạn phải đồng ý với Điều khoản và Chính sách bảo mật";
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }
    setErrors({});
    setIsLoading(true);
    try {
      const { data } = await authApi.register({
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
      });
      if (!data.success) throw new Error(data.message || "Đăng ký thất bại. Vui lòng thử lại.");
      navigate("/login");
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
      {/* Hero */}
      <div
        className="flex-1 flex flex-col items-center pt-10 pb-0 relative"
        style={{
          background: "linear-gradient(rgba(10,20,50,0.72), rgba(10,20,60,0.80)), url('https://matchroompool.com/wp-content/uploads/2024/01/wnt-hero.jpg') center/cover no-repeat",
          backgroundColor: "#0d1b3e",
        }}
      >
        {/* Logo */}
        <div className="text-center mb-5">
          <div style={{ fontSize: 42, fontWeight: 900, color: "#fff", fontStyle: "italic", letterSpacing: -1.5, lineHeight: 1, textTransform: "uppercase" }}>
            capstone<span style={{ color: "#e8471a" }}>.</span>
          </div>
          <p style={{ fontSize: 13, color: "#ccc", marginTop: 6 }}>
            Chào mừng bạn đến với nền tảng tỉ số trực tuyến{" "}
            <strong style={{ color: "#fff", fontStyle: "italic", textTransform: "uppercase" }}>capstone</strong>.
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-lg w-full max-w-sm mx-4" style={{ padding: "28px 28px 24px" }}>
          <h2 style={{ fontSize: 13, fontWeight: 700, color: "#1a2a4a", textTransform: "uppercase", letterSpacing: "1.5px", fontStyle: "italic", marginBottom: 16 }}>
            Đăng ký.
          </h2>

          {errors.submit && (
            <div className="mb-4 p-3 rounded text-xs text-red-600 bg-red-50 border border-red-200">
              {errors.submit}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-3">
            {/* Email */}
            <div>
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
              {touched.email && errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs text-gray-600 mb-1">Số điện thoại</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                onBlur={() => setTouched((p) => ({ ...p, phone: true }))}
                className={inputClass("phone")}
                placeholder="Nhập số điện thoại"
              />
              {touched.phone && errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs text-gray-600 mb-1">Mật khẩu</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  onBlur={() => setTouched((p) => ({ ...p, password: true }))}
                  className={`${inputClass("password")} pr-9`}
                  placeholder="Ít nhất 6 ký tự"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  tabIndex={-1}
                >
                  {showPassword ? <AiOutlineEyeInvisible size={16} /> : <AiOutlineEye size={16} />}
                </button>
              </div>
              {touched.password && errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-xs text-gray-600 mb-1">Xác nhận mật khẩu</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  onBlur={() => setTouched((p) => ({ ...p, confirmPassword: true }))}
                  className={`${inputClass("confirmPassword")} pr-9`}
                  placeholder="Nhập lại mật khẩu"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <AiOutlineEyeInvisible size={16} /> : <AiOutlineEye size={16} />}
                </button>
              </div>
              {touched.confirmPassword && errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>}
            </div>

            {/* Agree Terms */}
            <div>
              <div className="flex items-start gap-2 pt-1">
                <input
                  type="checkbox"
                  id="agreeTerms"
                  name="agreeTerms"
                  checked={formData.agreeTerms}
                  onChange={handleChange}
                  className="mt-0.5 cursor-pointer w-3.5 h-3.5"
                />
                <label htmlFor="agreeTerms" className="text-xs text-gray-600 cursor-pointer leading-relaxed">
                  Tôi đã đọc và đồng ý với{" "}
                  <a href="#" className="text-blue-600 hover:underline">Điều khoản sử dụng</a>{" "}
                  và{" "}
                  <a href="#" className="text-blue-600 hover:underline">Chính sách bảo mật</a>
                </label>
              </div>
              {touched.agreeTerms && errors.agreeTerms && <p className="text-red-500 text-xs mt-1">{errors.agreeTerms}</p>}
            </div>

            <div className="pt-2">
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
                  "Đăng ký"
                )}
              </button>
            </div>
          </form>

          <hr className="my-5 border-gray-200" />

          <h3 style={{ fontSize: 13, fontWeight: 700, color: "#1a2a4a", textTransform: "uppercase", letterSpacing: "1.5px", fontStyle: "italic", marginBottom: 8 }}>
            Đã có tài khoản?
          </h3>
          <p className="text-xs text-gray-500 mb-4">
            Đăng nhập để truy cập{" "}
            <strong style={{ fontStyle: "italic", color: "#111", textTransform: "uppercase" }}>capstone</strong>.
          </p>
          <button
            type="button"
            onClick={() => navigate("/login")}
            className="px-6 py-2 rounded-full text-sm font-semibold text-white transition-colors"
            style={{ background: "#1a2a4a" }}
            onMouseOver={(e) => (e.currentTarget.style.background = "#243660")}
            onMouseOut={(e) => (e.currentTarget.style.background = "#1a2a4a")}
          >
            Đăng nhập
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
          <div>
            <div style={{ fontSize: 24, fontWeight: 900, color: "#fff", fontStyle: "italic", letterSpacing: -1, textTransform: "uppercase" }}>
              capstone<span style={{ color: "#e8471a" }}>.</span>
            </div>
          </div>
          <div>
            <h4 style={{ fontSize: 13, fontWeight: 600, color: "#fff", marginBottom: 12 }}>Tin tức</h4>
            <a href="https://matchroompool.com" target="_blank" rel="noreferrer"
              style={{ fontSize: 12.5, color: "#8a99b5", textDecoration: "none", display: "block" }}>
              🌐 matchroompool.com
            </a>
          </div>
          <div>
            <h4 style={{ fontSize: 13, fontWeight: 600, color: "#fff", marginBottom: 12 }}>Pháp lý</h4>
            {["Điều khoản & Điều kiện", "Chính sách bảo mật", "Chính sách Cookie"].map((item) => (
              <a key={item} href="#" style={{ fontSize: 12.5, color: "#8a99b5", textDecoration: "none", display: "block", marginBottom: 6 }}>
                {item}
              </a>
            ))}
          </div>
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
            Nền tảng cập nhật tỉ số trực tiếp{" "}
            <strong style={{ fontStyle: "italic", color: "#8a99b5", textTransform: "uppercase" }}>capstone</strong>.<br />
            Bản quyền © Đã đăng ký bảo hộ cho Matchroom Multi Sport Ltd
          </p>
        </div>
      </footer>
    </div>
  );
};

export default RegisterPage;