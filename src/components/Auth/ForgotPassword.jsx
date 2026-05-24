import { useState } from "react";
import { useAuthStore } from "../../store/authStore";
import { AiOutlineClose, AiOutlineExclamationCircle } from "react-icons/ai";

const ForgotPassword = () => {
  const { isForgotPasswordOpen, closeForgotPassword, openLogin } = useAuthStore();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState("");

  const resetState = () => {
    setStep(1);
    setEmail("");
    setOtp("");
    setNewPassword("");
    setConfirmPassword("");
    setErrors({});
    setSuccessMessage("");
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!email) newErrors.email = "Email là bắt buộc";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = "Email không hợp lệ";
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }

    setErrors({});
    setIsLoading(true);
    let baseUrl = process.env.REACT_APP_API_URL || "http://localhost:8080";
    if (baseUrl.endsWith("/api")) baseUrl = baseUrl.slice(0, -4);
    try {
      const response = await fetch(`${baseUrl}/api/v1/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      let data = {};
      try { data = await response.json(); } catch { throw new Error("Server lỗi, vui lòng thử lại."); }
      if (!response.ok || !data.success) throw new Error(data.message || "Không thể gửi OTP.");
      setSuccessMessage("Mã OTP đã được gửi đến email của bạn.");
      setStep(2);
    } catch (err) {
      setErrors({ server: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!otp) newErrors.otp = "OTP là bắt buộc";
    if (!newPassword) newErrors.newPassword = "Mật khẩu là bắt buộc";
    else if (newPassword.length < 6) newErrors.newPassword = "Mật khẩu phải có ít nhất 6 ký tự";
    if (!confirmPassword) newErrors.confirmPassword = "Vui lòng xác nhận mật khẩu";
    else if (newPassword !== confirmPassword) newErrors.confirmPassword = "Mật khẩu xác nhận không khớp";
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }

    setErrors({});
    setIsLoading(true);
    let baseUrl = process.env.REACT_APP_API_URL || "http://localhost:8080";
    if (baseUrl.endsWith("/api")) baseUrl = baseUrl.slice(0, -4);
    try {
      const response = await fetch(`${baseUrl}/api/v1/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, newPassword }),
      });
      let data = {};
      try { data = await response.json(); } catch { throw new Error("Server lỗi, vui lòng thử lại."); }
      if (!response.ok || !data.success) throw new Error(data.message || "Đặt lại mật khẩu thất bại.");
      setSuccessMessage("Mật khẩu đã được đặt lại thành công. Vui lòng đăng nhập.");
      setTimeout(() => {
        resetState();
        closeForgotPassword();
        openLogin();
      }, 2000);
    } catch (err) {
      setErrors({ server: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => { resetState(); closeForgotPassword(); };
  const handleBackToLogin = () => { resetState(); closeForgotPassword(); openLogin(); };

  // Component input có validate
  const InputField = ({ label, type, value, onChange, placeholder, errorKey }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div className="relative">
        <input
          type={type}
          value={value}
          onChange={onChange}
          className={`w-full px-4 py-2 border-2 rounded-md focus:outline-none focus:ring-2 transition
            ${errors[errorKey]
              ? "border-red-400 focus:ring-red-300"
              : "border-gray-300 focus:ring-gray-400"
            }`}
          placeholder={placeholder}
        />
        {errors[errorKey] && (
          <AiOutlineExclamationCircle className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500" size={18} />
        )}
      </div>
      {errors[errorKey] && (
        <p className="text-red-500 text-xs mt-1">{errors[errorKey]}</p>
      )}
    </div>
  );

  if (!isForgotPasswordOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm" onClick={handleClose}></div>
      <div className="relative z-10 w-full max-w-md mx-4 bg-white rounded-lg shadow-xl p-8">
        <button onClick={handleClose} className="absolute top-4 right-4 p-1 hover:bg-gray-100 rounded-full transition">
          <AiOutlineClose size={24} />
        </button>
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">wnt.</h1>
          <p className="text-gray-600 mt-2">Khôi phục mật khẩu</p>
        </div>

        {step === 1 && (
          <form onSubmit={handleSendOtp} className="space-y-5">
            <InputField
              label="Địa chỉ email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              errorKey="email"
            />
            {errors.server && <p className="text-red-500 text-xs text-center bg-red-50 p-2 rounded">{errors.server}</p>}
            {successMessage && <p className="text-green-600 text-xs text-center bg-green-50 p-2 rounded">{successMessage}</p>}
            <button type="submit" disabled={isLoading} className="w-full bg-black hover:bg-gray-800 disabled:bg-gray-400 text-white font-semibold py-2 rounded-full transition mt-4">
              {isLoading ? "Đang gửi..." : "Gửi mã OTP"}
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleResetPassword} className="space-y-5">
            <InputField
              label="Mã OTP"
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="Nhập mã OTP"
              errorKey="otp"
            />
            <InputField
              label="Mật khẩu mới"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Ít nhất 6 ký tự"
              errorKey="newPassword"
            />
            <InputField
              label="Xác nhận mật khẩu mới"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Nhập lại mật khẩu"
              errorKey="confirmPassword"
            />
            {errors.server && <p className="text-red-500 text-xs text-center bg-red-50 p-2 rounded">{errors.server}</p>}
            {successMessage && <p className="text-green-600 text-xs text-center bg-green-50 p-2 rounded">{successMessage}</p>}
            <button type="submit" disabled={isLoading} className="w-full bg-black hover:bg-gray-800 disabled:bg-gray-400 text-white font-semibold py-2 rounded-full transition mt-4">
              {isLoading ? "Đang xử lý..." : "Đặt lại mật khẩu"}
            </button>
          </form>
        )}

        <div className="mt-6 text-center">
          <button onClick={handleBackToLogin} className="text-sm text-gray-500 hover:text-gray-700 underline">
            Quay lại đăng nhập
          </button>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;