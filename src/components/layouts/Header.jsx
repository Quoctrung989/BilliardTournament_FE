import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { normalizeRole } from "../../utils/auth";
import { ROLES } from "../../constants/auth";
import { useThemeStore } from "../../store/themeStore";
import {
  AiOutlineUser,
  AiOutlineLogout,
  AiOutlineFileText,
  AiOutlineCreditCard,
  AiOutlineDown,
  AiOutlineDashboard,
} from "react-icons/ai";
import { FiSun, FiMoon } from "react-icons/fi";

const DASHBOARD_PATH_BY_ROLE = {
  [ROLES.ADMIN]: "/admin/dashboard",
  [ROLES.OWNER]: "/owner/dashboard",
  [ROLES.MANAGER]: "/manager/dashboard",
  [ROLES.STAFF]: "/staff/matches",
};

const NAV_ITEMS = [
  { label: "Tin Mới Nhất",     path: "/news" },
  { label: "Tỷ Số Trực Tiếp", path: null },
  { label: "Giải Đấu",        path: "/event" },
  { label: "Cơ Sở",           path: "/branches" },
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
  const { theme, toggleTheme } = useThemeStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const role = normalizeRole(user?.role);
  const isPlayer = role === ROLES.PLAYER;
  const dashboardPath = DASHBOARD_PATH_BY_ROLE[role];
  const canManage = [ROLES.ADMIN, ROLES.OWNER, ROLES.MANAGER].includes(role);

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
    <div className="w-full bg-white dark:bg-[#0f1117] border-b border-[#e0e0e0] dark:border-[#2a2d36] px-10 h-[64px] sticky top-0 z-50 transition-colors duration-300">
      <div className="max-w-[1600px] flex items-center justify-between font-normal mx-auto h-full">

        {/* Logo */}
        <div
          onClick={() => navigate("/")}
          className="text-[28px] font-black italic tracking-tight text-[#1a1a2e] dark:text-white shrink-0 mr-8 leading-none select-none cursor-pointer hover:opacity-80 transition-opacity duration-150"
        >
          CAPSTONE<span className="text-[#EF342A]">.</span>
        </div>

        {/* Nav links */}
        <div className="flex items-center justify-evenly h-full flex-1">
          {NAV_ITEMS.map(({ label, path }) => (
            <div
              key={label}
              onClick={() => path && navigate(path)}
              className={`flex items-center whitespace-nowrap h-full px-2 text-[11px] font-semibold tracking-widest uppercase text-[#1a1a2e] dark:text-gray-200 hover:text-[#EF342A] dark:hover:text-[#EF342A] transition-colors duration-150 ${path ? "cursor-pointer" : "cursor-default"}`}
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
        <div className="shrink-0 ml-6 flex items-center gap-3">
          {/* Toggle sáng / tối */}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Chuyển giao diện sáng/tối"
            title={theme === "dark" ? "Chuyển sáng" : "Chuyển tối"}
            className="flex items-center justify-center h-9 w-9 rounded-full text-[#1a1a2e] dark:text-yellow-300 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
          >
            {theme === "dark" ? <FiSun size={18} /> : <FiMoon size={18} />}
          </button>

          {isAuthenticated && user ? (
            <div className="flex items-center gap-1 h-full" ref={menuRef}>
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="relative flex items-center gap-1.5 text-[#1a1a2e] dark:text-gray-200 hover:text-[#EF342A] dark:hover:text-[#EF342A] transition-colors px-3 py-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-white/10 text-[12px] font-normal whitespace-nowrap"
              >
                <AiOutlineUser size={17} />
                <span className="max-w-[100px] truncate">{user.fullName || user.email}</span>
                <AiOutlineDown size={12} className={`transition-transform ${menuOpen ? "rotate-180" : ""}`} />

                {menuOpen && (
                  <div className="absolute right-0 top-full mt-1 w-52 bg-white dark:bg-[#1a1d24] border border-slate-100 dark:border-white/10 rounded-xl shadow-lg py-1 z-50">
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setMenuOpen(false); navigate("/profile"); }}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 dark:text-gray-200 hover:bg-slate-50 dark:hover:bg-white/10 hover:text-[#EF342A] dark:hover:text-[#EF342A] transition-colors text-left"
                    >
                      <AiOutlineUser size={15} />
                      Hồ sơ
                    </button>
                    {canManage && dashboardPath && (
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setMenuOpen(false); navigate(dashboardPath); }}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 dark:text-gray-200 hover:bg-slate-50 dark:hover:bg-white/10 hover:text-[#EF342A] dark:hover:text-[#EF342A] transition-colors text-left"
                      >
                        <AiOutlineDashboard size={15} />
                        Quản lý
                      </button>
                    )}
                    {isPlayer && (
                      <>
                        <div className="my-1 border-t border-slate-100 dark:border-white/10" />
                        {PLAYER_MENU.map(({ label, path, Icon }) => (
                          <button
                            key={path}
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setMenuOpen(false); navigate(path); }}
                            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 dark:text-gray-200 hover:bg-slate-50 dark:hover:bg-white/10 hover:text-[#EF342A] dark:hover:text-[#EF342A] transition-colors text-left"
                          >
                            <Icon size={15} />
                            {label}
                          </button>
                        ))}
                      </>
                    )}
                    <div className="my-1 border-t border-slate-100 dark:border-white/10" />
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setMenuOpen(false); logout(); navigate("/"); }}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 dark:text-gray-200 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 transition-colors text-left"
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
