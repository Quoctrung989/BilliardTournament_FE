import { useState } from "react";
import { useAuthStore } from "../../store/authStore";
import { AiOutlineClose, AiOutlineExclamationCircle, AiOutlineLoading3Quarters } from "react-icons/ai";

const Login = () => {
  const { isLoginOpen, closeLogin, login, openSignup, openForgotPassword } = useAuthStore();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setTouched(prev => ({ ...prev, [name]: true }));
    validateField(name, value);
  };

  const validateField = (name, value) => {
    const newErrors = { ...errors };

    switch (name) {
      case "email":
        if (!value) {
          newErrors.email = "Email là bắt buộc";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          newErrors.email = "Email không hợp lệ";
        } else {
          delete newErrors.email;
        }
        break;
      case "password":
        if (!value) {
          newErrors.password = "Mật khẩu là bắt buộc";
        } else if (value.length < 5) {
          newErrors.password = "Mật khẩu phải có ít nhất 6 ký tự";
        } else {
          delete newErrors.password;
        }
        break;
      default:
        break;
    }

    setErrors(newErrors);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({
      email: true,
      password: true,
    });

    const newErrors = {};

    if (!formData.email) {
      newErrors.email = "Email là bắt buộc";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Email không hợp lệ";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    if (!formData.password) {
      newErrors.password = "Mật khẩu là bắt buộc";
    } else if (formData.password.length < 6) {
      newErrors.password = "Mật khẩu phải có ít nhất 6 ký tự";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setIsLoading(true);

    let baseUrl = process.env.REACT_APP_API_URL || "http://localhost:8080";
    if (baseUrl.endsWith("/api")) baseUrl = baseUrl.slice(0, -4);
    const apiUrl = `${baseUrl}/api/v1/auth/login`;

    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email, password: formData.password }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        const errorMessage = data.message || "Đăng nhập thất bại. Sai email hoặc mật khẩu.";
        throw new Error(errorMessage);
      }

      const token = data?.data?.token;
      if (!token) throw new Error("Không nhận được token từ server.");

      login({ email: formData.email }, token);
      closeLogin();
    } catch (err) {
      setErrors({ submit: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToEvents = () => {
    closeLogin();
  };

  if (!isLoginOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
        onClick={closeLogin}
      ></div>
      <div className="relative z-10 w-full max-w-md mx-4 bg-white rounded-lg shadow-xl p-8">
        <button
          onClick={closeLogin}
          className="absolute top-4 right-4 p-1 hover:bg-gray-100 rounded-full transition"
        >
          <AiOutlineClose size={24} />
        </button>
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">wnt.</h1>
          <p className="text-gray-600 mt-2">Chào mừng đến với wnt live scoring.</p>
        </div>
        <h2 className="text-xl font-semibold text-center text-gray-700 mb-6">
          ĐĂNG NHẬP
        </h2>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <div className="relative">
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                onBlur={() => setTouched(prev => ({ ...prev, email: true }))}
                className={`w-full px-4 py-2 border-2 rounded-md focus:outline-none transition ${
                  touched.email && errors.email
                    ? "border-red-500 focus:ring-2 focus:ring-red-300"
                    : "border-gray-300 focus:ring-2 focus:ring-gray-400"
                }`}
                placeholder="Địa chỉ email"
              />
              {touched.email && errors.email && (
                <AiOutlineExclamationCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 text-red-500" size={20} />
              )}
            </div>
            {touched.email && errors.email && (
              <p className="text-red-500 text-sm mt-1">{errors.email}</p>
            )}
          </div>

          <div>
            <div className="relative">
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                onBlur={() => setTouched(prev => ({ ...prev, password: true }))}
                className={`w-full px-4 py-2 border-2 rounded-md focus:outline-none transition ${
                  touched.password && errors.password
                    ? "border-red-500 focus:ring-2 focus:ring-red-300"
                    : "border-gray-300 focus:ring-2 focus:ring-gray-400"
                }`}
                placeholder="Password"
              />
              {touched.password && errors.password && (
                <AiOutlineExclamationCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 text-red-500" size={20} />
              )}
            </div>
            {touched.password && errors.password && (
              <p className="text-red-500 text-sm mt-1">{errors.password}</p>
            )}
          </div>
          <div className="text-right">
            <button
              type="button"
              onClick={openForgotPassword}
              className="text-sm text-blue-600 hover:underline"
            >
              Khôi phục mật khẩu tại đây
            </button>
          </div>
          {errors.submit && (
            <div className="text-red-500 text-sm text-center bg-red-50 p-3 rounded border border-red-200">
              {errors.submit}
            </div>
          )}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-black hover:bg-gray-800 disabled:bg-gray-400 text-white font-semibold py-2 rounded-full transition mt-4"
          >
            {isLoading ? (
              <div className="flex items-center justify-center gap-2">
                <AiOutlineLoading3Quarters className="animate-spin" />
                <span>Đang xử lý...</span>
              </div>
            ) : (
              "Đăng nhập"
            )}
          </button>
        </form>
        <div className="mt-8 text-center">
          <p className="text-sm font-semibold text-gray-700">
            BẠN CHƯA CÓ TÀI KHOẢN?
          </p>
          <p className="text-sm text-gray-600 mt-1">
            Đăng ký để truy cập wnt live scoring.
          </p>
          <button
            onClick={() => {
              closeLogin();
              openSignup();
            }}
            className="mt-3 w-full bg-black hover:bg-gray-800 text-white font-semibold py-2 rounded-full transition"
          >
            Đăng ký ngay
          </button>
        </div>
        <div className="mt-6 text-center">
          <button
            onClick={closeLogin}
            className="text-sm text-gray-500 hover:text-gray-700 underline"
          >
            Quay lại trang sự kiện
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;