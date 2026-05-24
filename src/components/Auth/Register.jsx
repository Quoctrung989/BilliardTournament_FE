import { useState } from "react";
import { useAuthStore } from "../../store/authStore";
import { AiOutlineClose, AiOutlineExclamationCircle, AiOutlineLoading3Quarters } from "react-icons/ai";

const Register = () => {
  const { isSignupOpen, closeSignup, openLogin } = useAuthStore();
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

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const val = type === "checkbox" ? checked : value;
    setFormData(prev => ({ ...prev, [name]: val }));
    setTouched(prev => ({ ...prev, [name]: true }));
    if (type !== "checkbox") {
      validateField(name, val);
    } else if (name === "agreeTerms") {
      const newErrors = { ...errors };
      if (!checked) {
        newErrors.agreeTerms = "Bạn phải đồng ý với Điều khoản và Chính sách bảo mật";
      } else {
        delete newErrors.agreeTerms;
      }
      setErrors(newErrors);
    }
  };

  const validateField = (name, value) => {
    const newErrors = { ...errors };
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
        if (formData.confirmPassword && formData.confirmPassword !== value) {
          newErrors.confirmPassword = "Mật khẩu không khớp";
        } else if (formData.confirmPassword && value) {
          delete newErrors.confirmPassword;
        }
        break;
      case "confirmPassword":
        if (!value) newErrors.confirmPassword = "Vui lòng xác nhận mật khẩu";
        else if (value !== formData.password) newErrors.confirmPassword = "Mật khẩu không khớp";
        else delete newErrors.confirmPassword;
        break;
      default: break;
    }
    setErrors(newErrors);
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.email) newErrors.email = "Email là bắt buộc";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = "Email không hợp lệ";
    if (!formData.phone) newErrors.phone = "Số điện thoại là bắt buộc";
    else if (!/^[0-9]{10,11}$/.test(formData.phone)) newErrors.phone = "Số điện thoại không hợp lệ (10-11 số)";
    if (!formData.password) newErrors.password = "Mật khẩu là bắt buộc";
    else if (formData.password.length < 6) newErrors.password = "Mật khẩu phải có ít nhất 6 ký tự";
    if (!formData.confirmPassword) newErrors.confirmPassword = "Vui lòng xác nhận mật khẩu";
    else if (formData.confirmPassword !== formData.password) newErrors.confirmPassword = "Mật khẩu không khớp";
    if (!formData.agreeTerms) newErrors.agreeTerms = "Bạn phải đồng ý với Điều khoản và Chính sách bảo mật";
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({
      email: true,
      phone: true,
      password: true,
      confirmPassword: true,
      agreeTerms: true,
    });
    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});
    setIsLoading(true);
    let baseUrl = process.env.REACT_APP_API_URL || "http://localhost:8080";
    if (baseUrl.endsWith("/api")) baseUrl = baseUrl.slice(0, -4);
    const apiUrl = `${baseUrl}/api/v1/auth/register`;

    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        const errorMessage = data.message || "Đăng ký thất bại. Vui lòng thử lại.";
        throw new Error(errorMessage);
      }
      closeSignup();
      openLogin();
    } catch (err) {
      setErrors({ submit: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    closeSignup();
    openLogin();
  };

  if (!isSignupOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm" onClick={closeSignup}></div>
      <div className="relative z-10 w-full max-w-md mx-4 bg-white rounded-lg shadow-xl p-8 max-h-[90vh] overflow-y-auto">
        <button onClick={closeSignup} className="absolute top-4 right-4 p-1 hover:bg-gray-100 rounded-full transition">
          <AiOutlineClose size={24} />
        </button>
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">wnt.</h1>
          <p className="text-gray-600 mt-2">Chào mừng đến với wnt live scoring.</p>
        </div>
        <h2 className="text-xl font-semibold text-center text-gray-700 mb-6">ĐĂNG KÝ</h2>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <div className="relative">
              <input type="email" name="email" value={formData.email} onChange={handleChange}
                onBlur={() => setTouched(prev => ({ ...prev, email: true }))}
                className={`w-full px-4 py-2 border-2 rounded-md focus:outline-none transition ${touched.email && errors.email ? "border-red-500 focus:ring-red-300" : "border-gray-300 focus:ring-gray-400"
                  }`} placeholder="Địa chỉ email" />
              {touched.email && errors.email && <AiOutlineExclamationCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 text-red-500" size={20} />}
            </div>
            {touched.email && errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
          </div>
          <div>
            <div className="relative">
              <input type="tel" name="phone" value={formData.phone} onChange={handleChange}
                onBlur={() => setTouched(prev => ({ ...prev, phone: true }))}
                className={`w-full px-4 py-2 border-2 rounded-md focus:outline-none transition ${touched.phone && errors.phone ? "border-red-500 focus:ring-red-300" : "border-gray-300 focus:ring-gray-400"
                  }`} placeholder="Số điện thoại" />
              {touched.phone && errors.phone && <AiOutlineExclamationCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 text-red-500" size={20} />}
            </div>
            {touched.phone && errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
          </div>
          <div>
            <div className="relative">
              <input type="password" name="password" value={formData.password} onChange={handleChange}
                onBlur={() => setTouched(prev => ({ ...prev, password: true }))}
                className={`w-full px-4 py-2 border-2 rounded-md focus:outline-none transition ${touched.password && errors.password ? "border-red-500 focus:ring-red-300" : "border-gray-300 focus:ring-gray-400"
                  }`} placeholder="Mật khẩu" />
              {touched.password && errors.password && <AiOutlineExclamationCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 text-red-500" size={20} />}
            </div>
            {touched.password && errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
          </div>
          <div>
            <div className="relative">
              <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange}
                onBlur={() => setTouched(prev => ({ ...prev, confirmPassword: true }))}
                className={`w-full px-4 py-2 border-2 rounded-md focus:outline-none transition ${touched.confirmPassword && errors.confirmPassword ? "border-red-500 focus:ring-red-300" : "border-gray-300 focus:ring-gray-400"
                  }`} placeholder="Xác nhận mật khẩu" />
              {touched.confirmPassword && errors.confirmPassword && <AiOutlineExclamationCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 text-red-500" size={20} />}
            </div>
            {touched.confirmPassword && errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>}
          </div>
          <div className="flex items-start gap-3 pt-2">
            <input type="checkbox" id="agreeTerms" name="agreeTerms" checked={formData.agreeTerms} onChange={handleChange} className="mt-1 cursor-pointer" />
            <label htmlFor="agreeTerms" className="text-sm text-gray-600 cursor-pointer">
              Tôi đã đọc và đồng ý với <a href="#" className="text-blue-600 hover:underline">Điều khoản sử dụng</a> và{" "}
              <a href="#" className="text-blue-600 hover:underline">Chính sách bảo mật</a>
            </label>
          </div>
          {touched.agreeTerms && errors.agreeTerms && <p className="text-red-500 text-sm mt-1">{errors.agreeTerms}</p>}
          {errors.submit && <div className="text-red-500 text-sm text-center bg-red-50 p-3 rounded border border-red-200">{errors.submit}</div>}
          <button type="submit" disabled={isLoading} className="w-full bg-black hover:bg-gray-800 disabled:bg-gray-400 text-white font-semibold py-2 rounded-full transition mt-6">
            {isLoading ? (
              <div className="flex items-center justify-center gap-2">
                <AiOutlineLoading3Quarters className="animate-spin" />
                <span>Đang xử lý...</span>
              </div>
            ) : (
              "Đăng ký"
            )}
          </button>
        </form>
        <div className="mt-6 text-center">
          <button onClick={handleBackToLogin} className="text-sm text-gray-500 hover:text-gray-700 underline">Quay lại đăng nhập</button>
        </div>
      </div>
    </div>
  );
};

export default Register;