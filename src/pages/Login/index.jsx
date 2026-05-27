import { useNavigate } from "react-router-dom";
import { BACKGROUND_IMAGE_URL_DARK } from "../../constants/constUrl";

const Login = () => {
  const navigate = useNavigate();

  return (
    <div className="w-full h-screen flex flex-col md:flex-row items-start">
      <div className="relative w-full md:w-1/2 h-1/2 md:h-full flex flex-col">
        <div className="absolute top-[20%] left-[10%] flex flex-col">
          <h1 className="text-lg text-white font-extrabold my-4">
            Hệ thống giải đấu billiard chuyên nghiệp tại Việt Nam
          </h1>
          <p className="text-xl text-white font-normal">
            Bạn cần thông tin giải đấu nào, CAPSTONE sẽ giúp bạn cập nhật nhanh
            chóng và chính xác nhất
          </p>
        </div>
        <img
          className="w-full h-full object-cover"
          src="https://i.pinimg.com/1200x/9d/99/12/9d991234be6f8844231ceafdfcac9abc.jpg"
          alt=""
        />
      </div>
      <div
        className="w-full md:w-1/2 h-1/2 md:h-full  flex flex-col p-8 md:p-20 justify-between items-center"
        style={{
          backgroundImage: `url('${BACKGROUND_IMAGE_URL_DARK}')`,
        }}
      >
        <h1 className="text-xl text-[#060606] font-semibold ">
          <img
            src={
              "https://i.pinimg.com/736x/1b/30/13/1b3013024531f649de7cd7494e5e9af9.jpg"
            }
            alt=""
            className="w-28 max-w-[500px] cursor-pointer rounded-full"
            onClick={() => navigate("/")}
          />
        </h1>

        <div className="w-full flex flex-col ">
          <div className="w-full flex flex-col mb-2">
            <h3 className="text-3xl text-[var(--wnt25-color-light)] font-semibold mb-2">
              Đăng nhập
            </h3>
            <p className="text-base mb-2 text-[var(--wnt25-color-light)] font-normal">
              Xin chào! Đăng nhập với tư cách quản trị viên hệ thống
            </p>
          </div>

          <div className="w-full flex flex-col mt-4">
            <input
              type="email"
              placeholder={"Email"}
              className={`w-full text-[var(--wnt25-color-light)] py-2 px-4 my-2 bg-[var(--wnt25-color-dark)] border-b border-black outline-none  focus:outline-none `}
            />

            <input
              type="password"
              placeholder="Mật khẩu"
              className={`w-full text-[var(--wnt25-color-light)] py-2 px-4 my-2 bg-[var(--wnt25-color-dark)] border-b border-black outline-none focus:outline-none`}
            />
          </div>

          <div className={`w-full flex items-center justify-between `}>
            <div className="w-full flex cursor-pointer">
              <p className="text-sm font-medium whitespace-nowrap cursor-pointer underline-offset-2"></p>
            </div>
            <p
              className="text-sm font-medium text-[var(--wnt25-color-light)] whitespace-nowrap cursor-pointer underline underline-offset-2"
              onClick={() => navigate("/forgotPassword")}
            >
              Quên mật khẩu?
            </p>
          </div>

          <div className="w-full flex flex-col my-4">
            <button
              className={`w-full text-[#060606] my-2 font-semibold bg-white border-2 border-black-2 rounded-md p-4 text-center flex items-center justify-center ${true === 2 ? "hidden" : ""}`}
              onClick={() => navigate("/signUp")}
            >
              Đăng nhập
            </button>
          </div>
        </div>

        <div className={`w-full flex  items-center justify-center `}>
          <p className="text-sm font-normal text-[var(--wnt25-color-light)]">
            Không có tài khoản?{" "}
            <span
              className="font-semibold underline underline-offset-2 cursor-pointer"
              onClick={() => navigate("/signUp")}
            >
              Đăng ký
            </span>
          </p>
        </div>
      </div>
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

export default Login;
