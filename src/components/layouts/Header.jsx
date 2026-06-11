import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import {
  AiOutlineUser,
  AiOutlineLogout,
  AiOutlineQuestionCircle,
} from "react-icons/ai";

const navItems = [
  { label: "Tin Mới Nhất",     path: null },
  { label: "Tỷ Số Trực Tiếp", path: null },
  { label: "Lịch Thi Đấu",    path: "/event" },
  { label: "Vé",               path: null },
  { label: "Bảng Xếp Hạng",   path: null },
  { label: "Cầu Thủ",         path: null },
  { label: "Cửa Hàng",        path: null },
];

const Header = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuthStore();

  return (
    <div className="w-full bg-white border-b border-[#e0e0e0] px-10 h-[64px] sticky top-0 z-50">
      <div className="max-w-[1600px] flex items-center justify-between font-normal mx-auto h-full">

        {/* Logo */}
        <div
          onClick={() => navigate("/")}
          className="text-[28px] font-black italic tracking-tight text-[#1a1a2e] shrink-0 mr-8 leading-none select-none cursor-pointer hover:opacity-80 transition-opacity duration-150"
        >
          CAPSTONE<span className="text-[#EF342A]">.</span>
        </div>

        {/* Nav links */}
        <div className="flex items-center justify-evenly h-full flex-1">
          {navItems.map(({ label, path }) => (
            <div
              key={label}
              onClick={() => path && navigate(path)}
              className={`flex items-center whitespace-nowrap h-full px-2 text-[11px] font-semibold tracking-widest uppercase text-[#1a1a2e] hover:text-[#EF342A] transition-colors duration-150 ${path ? "cursor-pointer" : "cursor-default"}`}
            >
              {label}
            </div>
          ))}
        </div>

        {/* Auth buttons */}
        <div className="shrink-0 ml-6">
          {isAuthenticated && user ? (
            <div className="flex items-center gap-2 h-full">
              <button className="flex items-center gap-1.5 text-[#1a1a2e] hover:text-[#EF342A] transition-colors px-3 text-[12px] font-normal whitespace-nowrap">
                <AiOutlineUser size={17} />
                <span>Hồ Sơ</span>
              </button>
              <button className="flex items-center gap-1.5 text-[#1a1a2e] hover:text-[#EF342A] transition-colors px-3 text-[12px] font-normal whitespace-nowrap">
                <AiOutlineQuestionCircle size={17} />
                <span>Hỗ Trợ</span>
              </button>
              <button
                onClick={logout}
                className="flex items-center gap-1.5 text-[#1a1a2e] hover:text-[#EF342A] transition-colors px-3 text-[12px] font-normal whitespace-nowrap"
              >
                <AiOutlineLogout size={17} />
                <span>Đăng Xuất</span>
              </button>
            </div>
          ) : (
            <button
              onClick={() => navigate("/login")}
              className="border border-[#EF342A] text-[#EF342A] hover:bg-[#EF342A] hover:text-white font-normal px-5 py-1.5 rounded-full transition-all duration-300 text-sm whitespace-nowrap"
            >
              Đăng Nhập
            </button>
          )}
        </div>

      </div>
    </div>
  );
};

export default Header;
