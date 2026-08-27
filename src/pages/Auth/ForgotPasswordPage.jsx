import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AiOutlineLoading3Quarters, AiOutlineEye, AiOutlineEyeInvisible, AiOutlineCheckCircle } from "react-icons/ai";
import * as authApi from "../../api/authApi";

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState("");
  const [successType, setSuccessType] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const resetState = () => {
    setStep(1);
    setEmail("");
    setOtp("");
    setNewPassword("");
    setConfirmPassword("");
    setErrors({});
    setSuccessMessage("");
    setSuccessType("");
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!email) newErrors.email = "Email là bắt buộc";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = "Email không hợp lệ";
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }
    setErrors({});
    setIsLoading(true);
    try {
      const { data } = await authApi.forgotPassword({ email });
      if (!data.success) throw new Error(data.message || "Không thể gửi OTP.");
      setSuccessMessage("Mã OTP đã được gửi đến email của bạn.");
      setSuccessType("otp_sent");
      setStep(2);
    } catch (err) {
      setErrors({ server: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!otp) newErrors.otp = "OTP là bắt buộc";
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }
    setErrors({});
    setIsLoading(true);
    try {
      const { data } = await authApi.verifyOtp({ email, otp });
      if (!data.success) throw new Error(data.message || "Mã OTP không hợp lệ.");
      setSuccessMessage("");
      setSuccessType("");
      setStep(3);
    } catch (err) {
      setErrors({ server: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!newPassword) newErrors.newPassword = "Mật khẩu là bắt buộc";
    else if (newPassword.length < 6) newErrors.newPassword = "Mật khẩu phải có ít nhất 6 ký tự";
    if (!confirmPassword) newErrors.confirmPassword = "Vui lòng xác nhận mật khẩu";
    else if (newPassword !== confirmPassword) newErrors.confirmPassword = "Mật khẩu xác nhận không khớp";
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }
    setErrors({});
    setIsLoading(true);
    try {
      const { data } = await authApi.resetPassword({
        email,
        otp,
        newPassword,
      });
      if (!data.success) throw new Error(data.message || "Đặt lại mật khẩu thất bại.");
      setSuccessMessage("Mật khẩu đã được đặt lại thành công! Đang chuyển hướng...");
      setSuccessType("password_reset_success");
      setTimeout(() => { resetState(); navigate("/login"); }, 2000);
    } catch (err) {
      setErrors({ server: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass = (field) =>
    `w-full px-3 py-2 text-sm border rounded focus:outline-none transition-colors ${
      errors[field]
        ? "border-red-400 bg-red-50 focus:border-red-400"
        : "border-gray-300 dark:border-white/15 bg-gray-50 dark:bg-white/5 focus:border-gray-500 focus:bg-white dark:focus:bg-[#161a22]"
    }`;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero */}
      <div
        className="flex-1 flex flex-col items-center pt-10 pb-20"
        style={{
          background: "linear-gradient(rgba(10,20,50,0.72), rgba(10,20,60,0.80)), url('/images/tournaments/action-1.jpg') center/cover no-repeat",
          backgroundColor: "#0d1b3e",
        }}
      >
        {/* Logo */}
        <div className="text-center mb-5">
          <div style={{ fontSize: 42, fontWeight: 900, color: "#fff", fontStyle: "italic", letterSpacing: -1.5, lineHeight: 1, textTransform: "uppercase" }}>
            btms<span style={{ color: "#e8471a" }}>.</span>
          </div>
          <p style={{ fontSize: 13, color: "#ccc", marginTop: 6 }}>
            Chào mừng bạn đến với nền tảng tỉ số trực tuyến{" "}
            <strong style={{ color: "#fff", fontStyle: "italic", textTransform: "uppercase" }}>btms</strong>.
          </p>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-[#161a22] rounded-lg w-full max-w-sm mx-4" style={{ padding: "28px 28px 24px" }}>
          <h2 style={{ fontSize: 13, fontWeight: 700, color: "#1a2a4a", textTransform: "uppercase", letterSpacing: "1.5px", fontStyle: "italic", marginBottom: 16 }}>
            Khôi phục mật khẩu.
          </h2>

          {/* Success reset */}
          {successType === "password_reset_success" && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded flex gap-2 items-start">
              <AiOutlineCheckCircle className="text-green-600 flex-shrink-0 mt-0.5" size={16} />
              <p className="text-green-700 text-xs">{successMessage}</p>
            </div>
          )}

          {/* Step 1: Email */}
          {step === 1 && (
            <form onSubmit={handleSendOtp} noValidate className="space-y-3">
              <p className="text-xs text-gray-500 mb-3">
                Nhập địa chỉ email liên kết với tài khoản của bạn. Chúng tôi sẽ gửi mã OTP để đặt lại mật khẩu.
              </p>
              <div>
                <label className="block text-xs text-gray-600 dark:text-white/70 mb-1">Địa chỉ E-mail</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClass("email")}
                  placeholder="Nhập email đã đăng ký với BTMS"
                />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
              </div>
              {errors.server && (
                <div className="p-2 bg-red-50 border border-red-200 rounded text-red-600 text-xs">
                  {errors.server}
                </div>
              )}
              {successType === "otp_sent" && (
                <div className="p-2 bg-green-50 border border-green-200 rounded text-green-600 text-xs">
                  ✓ {successMessage}
                </div>
              )}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex items-center gap-2 px-6 py-2 rounded-full text-sm font-semibold text-white transition-colors"
                  style={{ background: isLoading ? "#9ca3af" : "#1a2a4a" }}
                >
                  {isLoading ? (
                    <><AiOutlineLoading3Quarters className="animate-spin" size={14} /> Đang gửi...</>
                  ) : "Gửi mã OTP"}
                </button>
              </div>
            </form>
          )}

          {/* Step 2: OTP only — phải xác thực đúng OTP mới được sang bước đổi mật khẩu */}
          {step === 2 && (
            <form onSubmit={handleVerifyOtp} noValidate className="space-y-3">
              <p className="text-xs text-gray-500 mb-3">
                Nhập mã OTP đã được gửi đến <strong>{email}</strong>.
              </p>

              <div>
                <label className="block text-xs text-gray-600 dark:text-white/70 mb-1">Mã OTP</label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className={inputClass("otp")}
                  placeholder="Nhập mã OTP từ email"
                  autoFocus
                />
                {errors.otp && <p className="text-red-500 text-xs mt-1">{errors.otp}</p>}
              </div>

              {errors.server && (
                <div className="p-2 bg-red-50 border border-red-200 rounded text-red-600 text-xs">
                  {errors.server}
                </div>
              )}
              {successType === "otp_sent" && (
                <div className="p-2 bg-green-50 border border-green-200 rounded text-green-600 text-xs">
                  ✓ {successMessage}
                </div>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex items-center gap-2 px-6 py-2 rounded-full text-sm font-semibold text-white transition-colors"
                  style={{ background: isLoading ? "#9ca3af" : "#1a2a4a" }}
                >
                  {isLoading ? (
                    <><AiOutlineLoading3Quarters className="animate-spin" size={14} /> Đang xác thực...</>
                  ) : "Xác nhận OTP"}
                </button>
              </div>
            </form>
          )}

          {/* Step 3: New Password — chỉ hiện sau khi OTP đã được xác thực đúng ở bước 2 */}
          {step === 3 && (
            <form onSubmit={handleResetPassword} noValidate className="space-y-3">
              <p className="text-xs text-gray-500 mb-3">
                Mã OTP hợp lệ. Nhập mật khẩu mới của bạn.
              </p>

              {/* New Password */}
              <div>
                <label className="block text-xs text-gray-600 dark:text-white/70 mb-1">Mật khẩu mới</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className={`${inputClass("newPassword")} pr-9`}
                    placeholder="Ít nhất 6 ký tự"
                    autoFocus
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
                {errors.newPassword && <p className="text-red-500 text-xs mt-1">{errors.newPassword}</p>}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-xs text-gray-600 dark:text-white/70 mb-1">Xác nhận mật khẩu</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
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
                {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>}
              </div>

              {errors.server && (
                <div className="p-2 bg-red-50 border border-red-200 rounded text-red-600 text-xs">
                  {errors.server}
                </div>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex items-center gap-2 px-6 py-2 rounded-full text-sm font-semibold text-white transition-colors"
                  style={{ background: isLoading ? "#9ca3af" : "#1a2a4a" }}
                >
                  {isLoading ? (
                    <><AiOutlineLoading3Quarters className="animate-spin" size={14} /> Đang xử lý...</>
                  ) : "Đặt lại mật khẩu"}
                </button>
              </div>
            </form>
          )}

          <hr className="my-5 border-gray-200 dark:border-white/10" />

          <div className="text-right">
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="text-xs text-gray-400 hover:text-gray-600"
            >
              Quay lại đăng nhập
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer style={{ background: "#111d30", padding: "32px 40px 0" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1.4fr", gap: 24, maxWidth: 960, margin: "0 auto" }}>
          <div>
            <div style={{ fontSize: 24, fontWeight: 900, color: "#fff", fontStyle: "italic", letterSpacing: -1, textTransform: "uppercase" }}>
              btms<span style={{ color: "#e8471a" }}>.</span>
            </div>
          </div>
          <div>
            <h4 style={{ fontSize: 13, fontWeight: 600, color: "#fff", marginBottom: 12 }}>Tin tức</h4>
            <a href="/news"
              style={{ fontSize: 12.5, color: "#8a99b5", textDecoration: "none", display: "block" }}>
              🌐 Tin tức BTMS
            </a>
          </div>
          <div>
            <h4 style={{ fontSize: 13, fontWeight: 600, color: "#fff", marginBottom: 12 }}>Pháp lý</h4>
            {/* Chưa có trang đích cho ba mục này (không route nào trong ROUTES).
                Dùng <button> chứ không phải <a href="#">: link rỗng nhảy lên đầu
                trang khi bấm, và trình đọc màn hình xướng nó như link dùng được.
                Có trang rồi thì gắn onClick hoặc đổi sang <Link>. */}
            {["Điều khoản & Điều kiện", "Chính sách bảo mật", "Chính sách Cookie"].map((item) => (
              <button
                key={item}
                type="button"
                style={{ fontSize: 12.5, color: "#8a99b5", textDecoration: "none", display: "block", marginBottom: 6, background: "none", border: "none", padding: 0, cursor: "pointer", textAlign: "left", fontFamily: "inherit" }}
              >
                {item}
              </button>
            ))}
          </div>
          <div>
            <h4 style={{ fontSize: 13, fontWeight: 600, color: "#fff", marginBottom: 12 }}>Liên hệ</h4>
            <p style={{ fontSize: 12.5, color: "#8a99b5", marginBottom: 12 }}>✉️ support@btms.vn</p>
            <p style={{ fontSize: 12.5, color: "#8a99b5", lineHeight: 1.6 }}>
              Hệ thống quản lý giải đấu Bi-a BTMS
            </p>
          </div>
        </div>
        <div style={{ borderTop: "1px solid #1e2d4a", marginTop: 28, padding: "14px 0", textAlign: "center" }}>
          <p style={{ fontSize: 11.5, color: "#6b7280" }}>
            Nền tảng cập nhật tỉ số trực tiếp{" "}
            <strong style={{ fontStyle: "italic", color: "#8a99b5", textTransform: "uppercase" }}>btms</strong>.<br />
            Bản quyền © BTMS. Bảo lưu mọi quyền.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default ForgotPasswordPage;