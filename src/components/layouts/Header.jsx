import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import {
  AiOutlineUser,
  AiOutlineLogout,
  AiOutlineQuestionCircle,
} from "react-icons/ai";

const Header = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuthStore();

  return (
    <div className="w-full bg-[#333333] text-white px-8 lg:px-12 h-[var(--layout-header-h)] sticky top-0 z-50">
      <div className="max-w-[1600px] flex items-center justify-between font-bold mx-auto h-full">
        <div className="text-xl font-bold">CAPSTONE</div>
        <div className="flex gap-5 lg:gap-6 text-sm lg:text-base justify-center items-center h-full">
          <div className="flex items-center border-y-[4px] border-transparent px-3 hover:border-b-[var(--wnt25-color-red)] h-full cursor-pointer">
            Mới nhất
          </div>
          <div className="flex items-center border-y-[4px] border-transparent px-3 hover:border-b-[var(--wnt25-color-red)] h-full cursor-pointer">
            Tỷ số trực tiếp
          </div>
          <div className="flex items-center border-y-[4px] border-transparent px-3 hover:border-b-[var(--wnt25-color-red)] h-full cursor-pointer">
            Lịch thi đấu
          </div>
          {/* <div className="flex items-center border-y-[4px] border-transparent px-3 hover:border-b-[var(--wnt25-color-red)] h-full cursor-pointer">
            Vé
          </div> */}
          <div className="flex items-center border-y-[4px] border-transparent px-3 hover:border-b-[var(--wnt25-color-red)] h-full cursor-pointer">
            Xếp hạng
          </div>
          <div className="flex items-center border-y-[4px] border-transparent px-3 hover:border-b-[var(--wnt25-color-red)] h-full cursor-pointer">
            Cơ thủ
          </div>
          {/* <div className="flex items-center border-y-[4px] border-transparent px-3 hover:border-b-[var(--wnt25-color-red)] h-full cursor-pointer">
            Cửa hàng
          </div> */}
        </div>
        <div>
          {isAuthenticated && user ? (
            <div className="flex items-center gap-5 h-full">
              {/* Hồ sơ */}
              <button
                type="button"
                onClick={() => navigate("/profile")}
                className="flex items-center gap-1.5 text-gray-300 hover:text-[#EF342A] transition h-full border-b-4 border-transparent hover:border-[#EF342A] px-2"
              >
                <AiOutlineUser size={18} />
                <span className="text-sm font-semibold">Hồ sơ</span>
              </button>

              {/* Hỗ trợ
              <button className="flex items-center gap-2 text-gray-300 hover:text-[#EF342A] transition h-full border-b-6 border-transparent hover:border-b-6 hover:border-[#EF342A] px-2">
                <AiOutlineQuestionCircle size={20} />
                <span className="text-base font-semibold">Hỗ trợ</span>
              </button> */}

              {/* Đăng xuất */}
              <button
                onClick={logout}
                className="flex items-center gap-1.5 text-gray-300 hover:text-[#EF342A] transition h-full border-b-4 border-transparent hover:border-[#EF342A] px-2"
              >
                <AiOutlineLogout size={18} />
                <span className="text-sm font-semibold">Đăng xuất</span>
              </button>
            </div>
          ) : (
            <button
              onClick={() => navigate("/login")}
              className="border-2 border-[#EF342A] text-[var(--wnt25-color-light)] hover:bg-[#EF342A] hover:text-white text-sm font-semibold px-5 py-1.5 rounded-full transition-all duration-300"
            >
              Đăng nhập
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Header;
