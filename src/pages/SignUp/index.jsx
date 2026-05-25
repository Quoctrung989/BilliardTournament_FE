import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BACKGROUND_IMAGE_URL_HOME } from "../../constants/constUrl";
import VerifySignUpModal from "./components/VerifySignUpModal/VerifySignUpModal";

const SignUp = () => {
  const navigate = useNavigate();
  const [userName, setUserName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState([]);
  const [showOpt, setShowOpt] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isClickedBtn, setIsClickedBtn] = useState(false);

  const handeClickSignUp = () => {
    setIsClickedBtn(true);
    handleOpenVerifyModal();
  };

  const handleOpenVerifyModal = () => {
    setShowOpt(true);
  };

  return (
    <div className="w-full h-screen flex items-start">
      <div
        className={`w-1/2  h-full bg-[#f5f5f5] flex flex-col p-20 justify-between items-center bg-cover`}
        style={{
          backgroundImage: `url('${BACKGROUND_IMAGE_URL_HOME}')`,
        }}
      >
        <h1 className=" text-xl text-[#060606] font-semibold ">
          <img
            src={
              "https://i.pinimg.com/736x/1b/30/13/1b3013024531f649de7cd7494e5e9af9.jpg"
            }
            alt=""
            className="w-20 max-w-[500px] rounded-full cursor-pointer"
            onClick={() => navigate("/")}
          />
        </h1>

        <div className="w-full flex flex-col ">
          <div className="w-full flex flex-col mb-2">
            <h3 className="text-2xl font-semibold mb-2">Đăng ký</h3>
            <p className="text-base mb-2">
              Xin chào! Bạn vui lòng điền thông tin để đăng ký.
            </p>
          </div>

          <div className="w-full flex flex-col mt-4">
            <input
              type="text"
              placeholder="Họ và tên"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="w-full text-black py-2 my-2 bg-[var(--wnt25-color-light)] px-2 py-1 border-b border-black outline-none  transition duration-500 ease-in-out  focus:outline-none focus:border-blue-700"
            />
            {isClickedBtn && userName.trim() === "" && (
              <p className="mt-2 text-sm text-red-500" id="email-error">
                Họ và tên không được để trống.
              </p>
            )}
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full text-black py-2 my-2 bg-[var(--wnt25-color-light)] px-2 py-1 border-b border-black  transition duration-500 ease-in-out outline-none  focus:outline-none focus:border-blue-700"
            />
            {isClickedBtn && email.trim() === "" && (
              <p className="mt-2 text-sm text-red-500" id="email-error">
                Email sai định dạng.
              </p>
            )}
            <input
              type="text"
              placeholder="Số điện thoại"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full text-black py-2 my-2 bg-[var(--wnt25-color-light)] px-2 py-1 border-b border-black  transition duration-500 ease-in-out outline-none focus:outline-none focus:border-blue-700"
            />
            {isClickedBtn && phone.trim() === "" && (
              <p className="mt-2 text-sm text-red-500" id="phone-error">
                Số điện thoại sai định dạng
              </p>
            )}
            <input
              type="password"
              placeholder="Mật khẩu"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full text-black py-2 my-2 bg-[var(--wnt25-color-light)] px-2 py-1 border-b border-black  transition duration-500 ease-in-out outline-none focus:outline-none focus:border-blue-700"
            />
            {isClickedBtn && password.trim() === "" && (
              <p className="mt-2 text-sm text-red-500" id="email-error">
                Mật khẩu không được để trống.
              </p>
            )}
            <input
              type="password"
              placeholder="Xác nhận mật khẩu"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full text-black py-2 my-2 bg-[var(--wnt25-color-light)] px-2 py-1 border-b border-black  transition duration-500 ease-in-out outline-none focus:outline-none focus:border-blue-700"
            />
            {isClickedBtn && confirmPassword.trim() === "" && (
              <p className="mt-2 text-sm text-red-500" id="email-error">
                Vui lòng xác nhận mật khẩu.
              </p>
            )}
            {isClickedBtn && password !== confirmPassword && (
              <p className="mt-2 text-sm text-red-500" id="email-error">
                Mật khẩu không trùng khớp.
              </p>
            )}
          </div>

          <div className="w-full flex flex-col my-4">
            <button
              className="w-full text-white my-2 font-semibold bg-[#060606] rounded-md p-4 text-center flex items-center justify-center cursor-pointer"
              onClick={handeClickSignUp}
            >
              Đăng ký
            </button>
          </div>
        </div>

        <div className="w-full flex  items-center justify-center">
          <p className="text-sm font-normal text-[#060606]">
            Đã có tài khoản?{" "}
            <span
              className="font-semibold underline underline-offset-2 cursor-pointer"
              onClick={() => navigate("/login")}
            >
              {" "}
              Đăng nhập
            </span>
          </p>
        </div>
      </div>

      <div className="relative w-1/2 h-full flex flex-col">
        <div className="absolute top-[20%] left-[10%] flex flex-col">
          <h1 className="text-lg text-white font-extrabold my-4">
            Hệ thống giải đấu billiard chuyên nghiệp tại Việt Nam
          </h1>
          <p className="text-xl text-white font-normal">
            Bạn cần thông tin giải đấu nào, WNT sẽ giúp bạn cập nhật nhanh chóng
            và chính xác nhất
          </p>
        </div>
        <img
          className="w-full h-full object-cover"
          src="https://i.pinimg.com/736x/33/7f/38/337f38b41cd8cde58e4860aea0c29e88.jpg"
          alt=""
        />
      </div>

      {showOpt && (
        <VerifySignUpModal
          email={email}
          otp={otp}
          onSetOtp={setOtp}
          onSetOpenOtp={setShowOpt}
        />
      )}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideIn {
          from {
            transform: translateY(-20%);
          }
          to {
            transform: translateY(0);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.3s ease-in-out;
        }

        .animate-slideIn {
          animation: slideIn 0.3s ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default SignUp;
