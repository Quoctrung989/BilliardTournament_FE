import { useState } from "react";
import { useAuthStore } from "../../store/authStore";
import { AiOutlineClose } from "react-icons/ai";

const Login = () => {
  const { isLoginOpen, closeLogin, login } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    let baseUrl = process.env.REACT_APP_API_URL || "http://localhost:8080";
    if (baseUrl.endsWith("/api")) baseUrl = baseUrl.slice(0, -4);
    const apiUrl = `${baseUrl}/api/v1/auth/login`;

    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        const errorMessage = data.message || "Đăng nhập thất bại. Sai email hoặc mật khẩu.";
        throw new Error(errorMessage);
      }

      const token = data?.data?.token;
      if (!token) throw new Error("Không nhận được token từ server.");

      login({ email }, token);
      closeLogin();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRecoverPassword = () => {
  };

  const handleSignUp = () => {
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
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Địa chỉ email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400"
              placeholder="your@email.com"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mật khẩu
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400"
              placeholder="••••••••"
              required
            />
          </div>
          <div className="text-right">
            <button
              type="button"
              onClick={handleRecoverPassword}
              className="text-sm text-blue-600 hover:underline"
            >
              Khôi phục mật khẩu tại đây
            </button>
          </div>
          {error && (
            <div className="text-red-500 text-sm text-center bg-red-50 p-2 rounded">
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-black hover:bg-gray-800 disabled:bg-gray-400 text-white font-semibold py-2 rounded-full transition mt-4"
          >
            {isLoading ? "Đang đăng nhập..." : "Đăng nhập"}
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
            onClick={handleSignUp}
            className="mt-3 w-full bg-black hover:bg-gray-800 text-white font-semibold py-2 rounded-full transition"
          >
            Đăng ký ngay
          </button>
        </div>
        <div className="mt-6 text-center">
          <button
            onClick={handleBackToEvents}
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