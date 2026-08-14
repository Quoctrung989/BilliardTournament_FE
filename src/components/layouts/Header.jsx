import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { normalizeRole } from "../../utils/auth";
import { ROLES } from "../../constants/auth";
import { useNotificationStore } from "../../store/notificationStore";
import {
  AiOutlineUser,
  AiOutlineLogout,
  AiOutlineFileText,
  AiOutlineCreditCard,
  AiOutlineDown,
  AiOutlineDashboard,
} from "react-icons/ai";
import NotificationBell from "../shared/notifications/NotificationBell";
import ThemeSwitch from "../shared/ThemeSwitch";

const DASHBOARD_PATH_BY_ROLE = {
  [ROLES.ADMIN]: "/admin/dashboard",
  [ROLES.OWNER]: "/owner/dashboard",
  [ROLES.MANAGER]: "/manager/dashboard",
  [ROLES.STAFF]: "/staff/matches",
};

const NAV_ITEMS = [
  { label: "Tin Mới Nhất",     path: "/news" },
  { label: "Giải Đấu",        path: "/event" },
  { label: "Cơ Sở",           path: "/branches" },
  // { label: "Vé",               path: null },
  { label: "Bảng Xếp Hạng",   path: "/rankings" },
  // { label: "Cửa Hàng",        path: null },
];

const PLAYER_MENU = [
  { label: "Đăng ký của tôi",    path: "/player/registrations", Icon: AiOutlineFileText },
  { label: "Lịch thi đấu",       path: "/player/matches",        Icon: AiOutlineFileText },
  { label: "Lịch sử thanh toán", path: "/player/payments",       Icon: AiOutlineCreditCard },
];

const Header = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  /* Khớp cả trang con: đang ở /event/24 thì tab "Giải Đấu" vẫn sáng. Dùng
     `path + "/"` chứ không phải `startsWith(path)` trần — nếu không, một route
     tương lai tên /eventual cũng sẽ làm sáng nhầm tab này. */
  const isActivePath = (path) =>
    Boolean(path) && (pathname === path || pathname.startsWith(`${path}/`));
  const { isAuthenticated, user, logout } = useAuthStore();
  // Xoá cả mốc đã đọc khi đăng xuất — người khác đăng nhập trên cùng máy mà giữ mốc của chủ
  // trước thì thông báo cũ hơn mốc đó bị coi là đã đọc dù họ chưa từng thấy
  const resetNotifications = useNotificationStore((s) => s.reset);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const role = normalizeRole(user?.role);
  const isPlayer = role === ROLES.PLAYER;
  const dashboardPath = DASHBOARD_PATH_BY_ROLE[role];
  const canManage = [ROLES.ADMIN, ROLES.OWNER, ROLES.MANAGER].includes(role);
  /* Trọng tài cũng cần lối quay lại khu làm việc. Tách khỏi `canManage` vì
     nhãn phải khác: họ không "quản lý" gì, chỉ trở về màn chấm điểm. */
  const isStaff = role === ROLES.STAFF;
  const backToWorkLabel = isStaff ? "Quay lại quản trị" : "Quản lý";

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
          className="ui-logo-zoom text-[28px] font-black italic tracking-tight text-[#1a1a2e] dark:text-white shrink-0 mr-8 leading-none select-none cursor-pointer"
        >
          BTMS<span className="text-[#EF342A]">.</span>
        </div>

        {/* Nav links */}
        <div className="flex items-center justify-evenly h-full flex-1">
          {NAV_ITEMS.map(({ label, path }) => {
            const active = isActivePath(path);
            return (
              <div
                key={label}
                onClick={() => path && navigate(path)}
                aria-current={active ? "page" : undefined}
                className={`ui-underline flex items-center whitespace-nowrap h-full px-2 text-[11px] font-semibold tracking-widest uppercase transition-colors duration-150 hover:text-[#EF342A] dark:hover:text-[#EF342A] ${
                  active
                    ? "ui-underline--active text-[#EF342A]"
                    : "text-[#1a1a2e] dark:text-gray-200"
                } ${path ? "cursor-pointer" : "cursor-default"}`}
              >
                {label}
              </div>
            );
          })}
        </div>

        {/* Auth area */}
        <div className="shrink-0 ml-6 flex items-center gap-3">
          {/* Công tắc sáng / tối */}
          <ThemeSwitch />

          {/* Chỉ dựng khi đã đăng nhập: chuông tự hỏi lại số chưa đọc theo nhịp,
              để nó chạy lúc chưa có phiên thì chỉ nhận 401 liên tục */}
          {isAuthenticated && user && (
            <NotificationBell className="flex items-center justify-center h-9 w-9 rounded-full text-[#1a1a2e] dark:text-gray-200 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors" />
          )}

          {isAuthenticated && user ? (
            <div className="relative flex items-center gap-1 h-full" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
                className="flex items-center gap-1.5 text-[#1a1a2e] dark:text-gray-200 hover:text-[#EF342A] dark:hover:text-[#EF342A] transition-colors px-3 py-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-white/10 text-[12px] font-normal whitespace-nowrap"
              >
                <AiOutlineUser size={17} />
                <span className="max-w-[100px] truncate">{user.fullName || user.email}</span>
                <AiOutlineDown size={12} className={`transition-transform ${menuOpen ? "rotate-180" : ""}`} />
              </button>

              {menuOpen && (
                <div className="absolute right-0 top-full mt-1 w-52 bg-white dark:bg-[#1a1d24] border border-slate-100 dark:border-white/10 rounded-xl shadow-lg py-1 z-50">
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setMenuOpen(false); navigate("/profile"); }}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 dark:text-gray-200 hover:bg-slate-50 dark:hover:bg-white/5 dark:hover:bg-white/10 hover:text-[#EF342A] dark:hover:text-[#EF342A] transition-colors text-left"
                  >
                    <AiOutlineUser size={15} />
                    Hồ sơ
                  </button>
                  {(canManage || isStaff) && dashboardPath && (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setMenuOpen(false); navigate(dashboardPath); }}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 dark:text-gray-200 hover:bg-slate-50 dark:hover:bg-white/5 dark:hover:bg-white/10 hover:text-[#EF342A] dark:hover:text-[#EF342A] transition-colors text-left"
                    >
                      <AiOutlineDashboard size={15} />
                      {backToWorkLabel}
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
                          className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 dark:text-gray-200 hover:bg-slate-50 dark:hover:bg-white/5 dark:hover:bg-white/10 hover:text-[#EF342A] dark:hover:text-[#EF342A] transition-colors text-left"
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
                    onClick={(e) => { e.stopPropagation(); setMenuOpen(false); resetNotifications(); logout(); navigate("/"); }}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 dark:text-gray-200 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 transition-colors text-left"
                  >
                    <AiOutlineLogout size={15} />
                    Đăng xuất
                  </button>
                </div>
              )}
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
