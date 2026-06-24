import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import {
  AiOutlineUser,
  AiOutlineLogout,
  AiOutlineFileText,
  AiOutlineCreditCard,
  AiOutlineDown,
} from "react-icons/ai";

const NAV_ITEMS = [
  { label: "Tin Mới Nhất",     path: "/news" },
  { label: "Tỷ Số Trực Tiếp", path: null },
  { label: "Giải Đấu",        path: "/event" },
  // { label: "Vé",               path: null },
  { label: "Bảng Xếp Hạng",   path: null },
  { label: "Cơ Thủ",          path: null },
  // { label: "Cửa Hàng",        path: null },
];

const PLAYER_MENU = [
  { label: "Đăng ký của tôi",    path: "/player/registrations", Icon: AiOutlineFileText },
  { label: "Lịch thi đấu",       path: "/player/matches",        Icon: AiOutlineFileText },
  { label: "Lịch sử thanh toán", path: "/player/payments",       Icon: AiOutlineCreditCard },
];

const Header = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuthStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const isPlayer = user?.role === "PLAYER";

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

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
          {NAV_ITEMS.map(({ label, path }) => (
            <div
              key={label}
              onClick={() => path && navigate(path)}
              className={`flex items-center whitespace-nowrap h-full px-2 text-[11px] font-semibold tracking-widest uppercase text-[#1a1a2e] hover:text-[#EF342A] transition-colors duration-150 ${path ? "cursor-pointer" : "cursor-default"}`}
            >
              {label}
            </div>
          ))}

          {isPlayer && (
            <div
              onClick={() => navigate("/player/tournaments")}
              className="flex items-center whitespace-nowrap h-full px-2 text-[11px] font-semibold tracking-widest uppercase text-[#EF342A] hover:opacity-80 cursor-pointer transition-opacity"
            >
              Đăng ký giải
            </div>
          )}
        </div>

        {/* Auth area */}
        <div className="shrink-0 ml-6">
          {isAuthenticated && user ? (
            <div className="flex items-center gap-1 h-full" ref={menuRef}>
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="relative flex items-center gap-1.5 text-[#1a1a2e] hover:text-[#EF342A] transition-colors px-3 py-1.5 rounded-lg hover:bg-slate-50 text-[12px] font-normal whitespace-nowrap"
              >
                <AiOutlineUser size={17} />
                <span className="max-w-[100px] truncate">{user.fullName || user.email}</span>
                <AiOutlineDown size={12} className={`transition-transform ${menuOpen ? "rotate-180" : ""}`} />

                {menuOpen && (
                  <div className="absolute right-0 top-full mt-1 w-52 bg-white border border-slate-100 rounded-xl shadow-lg py-1 z-50">
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setMenuOpen(false); navigate("/profile"); }}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 hover:text-[#EF342A] transition-colors text-left"
                    >
                      <AiOutlineUser size={15} />
                      Hồ sơ
                    </button>
                    {isPlayer && (
                      <>
                        <div className="my-1 border-t border-slate-100" />
                        {PLAYER_MENU.map(({ label, path, Icon }) => (
                          <button
                            key={path}
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setMenuOpen(false); navigate(path); }}
                            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 hover:text-[#EF342A] transition-colors text-left"
                          >
                            <Icon size={15} />
                            {label}
                          </button>
                        ))}
                      </>
                    )}
                    <div className="my-1 border-t border-slate-100" />
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setMenuOpen(false); logout(); navigate("/"); }}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-red-50 hover:text-red-600 transition-colors text-left"
                    >
                      <AiOutlineLogout size={15} />
                      Đăng xuất
                    </button>
                  </div>
                )}
              </button>
            </div>
          ) : (
            <button
              onClick={() => navigate("/login")}
              className="border border-[#EF342A] text-[#EF342A] hover:bg-[#EF342A] hover:text-white font-normal px-5 py-1.5 rounded-full transition-all duration-300 text-sm whitespace-nowrap"
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
