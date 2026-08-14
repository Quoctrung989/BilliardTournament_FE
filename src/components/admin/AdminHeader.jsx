import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ChevronDown, Home, LayoutDashboard, LogOut, Search, Settings, User } from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { useNotificationStore } from "../../store/notificationStore";
import { ROLES } from "../../constants/auth";
import { normalizeRole } from "../../utils/auth";
import NotificationBell from "../shared/notifications/NotificationBell";
import ThemeSwitch from "../shared/ThemeSwitch";

const DASHBOARD_PATH_BY_ROLE = {
  [ROLES.ADMIN]: "/admin/dashboard",
  [ROLES.OWNER]: "/owner/dashboard",
  [ROLES.MANAGER]: "/manager/dashboard",
  [ROLES.STAFF]: "/staff/matches",
};

const breadcrumbMap = {
  "/admin/dashboard": "Dashboard",
  "/admin/tournament-config/formats": "Thể thức giải",
  "/admin/tournament-config/game-types": "Loại bi",
  "/admin/tournament-config/config-field-catalog": "Catalog trường",
};

const AdminHeader = ({
  title,
  subtitle,
  hideBreadcrumb = false,
  hideSearch = false,
  hideTitles = false,
  /* Bật cho section không có sidebar (Trọng tài): nút "Về trang chủ" vốn nằm ở
     chân sidebar phải xuất hiện ở đây, nếu không người dùng không còn lối ra. */
  showHomeButton = false,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const resetNotifications = useNotificationStore((s) => s.reset);

  const breadcrumb =
    breadcrumbMap[location.pathname] ||
    (location.pathname.includes("/formats/") ? "Cấu hình thể thức" : "Quản trị");

  const hasSubtitle = Boolean(subtitle) && !hideTitles;

  useEffect(() => {
    const close = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, []);

  const handleLogout = () => {
    // Xoá cả mốc đã đọc — người khác đăng nhập trên cùng máy mà giữ mốc của chủ trước thì
    // thông báo cũ hơn mốc đó bị coi là đã đọc dù họ chưa từng thấy
    resetNotifications();
    logout();
    navigate("/login");
  };

  const initials = (user?.email || "A").slice(0, 2).toUpperCase();
  const role = normalizeRole(user?.role);
  const dashboardPath = DASHBOARD_PATH_BY_ROLE[role];
  const canManage = [ROLES.ADMIN, ROLES.OWNER, ROLES.MANAGER].includes(role);

  return (
    <header
      className={`admin-header sticky top-0 z-30 bg-white/95 dark:bg-[#0d1015]/95 backdrop-blur-md border-b border-slate-200/90 dark:border-white/10 ${
        hasSubtitle ? "admin-header--tall" : ""
      }`}
    >
      <div className="admin-header-titles">
        {!hideBreadcrumb && (
          <p className="admin-header-eyebrow">
            <span className="text-slate-400 dark:text-white/40 font-medium">BTMS Admin</span>
            <span className="mx-1.5 text-slate-300" aria-hidden>
              /
            </span>
            <span>{breadcrumb}</span>
          </p>
        )}
        {!hideTitles && title && <h1 className="admin-page-title">{title}</h1>}
        {!hideTitles && subtitle && <p className="admin-page-subtitle">{subtitle}</p>}
      </div>

      {!hideSearch && (
        <div className="hidden lg:flex items-center flex-1 max-w-sm mx-2">
          <div className="relative w-full">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-white/40 pointer-events-none"
              size={18}
            />
            <input
              type="search"
              placeholder="Tìm kiếm nhanh..."
              className="admin-input pl-10 py-2 h-10 bg-slate-50 border-slate-200 dark:bg-[#101319] dark:border-[#2b3039]"
            />
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 flex-shrink-0">
        {showHomeButton && (
          <button
            type="button"
            onClick={() => navigate("/")}
            className="admin-btn admin-btn-ghost h-10 gap-1.5 px-3"
            title="Về trang chủ"
          >
            <Home size={16} />
            <span className="hidden sm:inline">Về trang chủ</span>
          </button>
        )}

        <ThemeSwitch />

        <NotificationBell className="admin-btn admin-btn-ghost w-10 h-10 p-0 rounded-full flex" />

        <div className="relative" ref={menuRef}>
          <button
            type="button"
            className="flex items-center gap-2 pl-2 pr-3 h-10 rounded-full hover:bg-slate-100 dark:hover:bg-white/5 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-white/10"
            onClick={() => setMenuOpen((v) => !v)}
          >
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-xs font-bold shadow-sm flex-shrink-0">
              {initials}
            </div>
            <div className="hidden sm:block text-left min-w-0">
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 leading-tight max-w-[140px] truncate">
                {user?.email || "Admin"}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-tight">{user?.role || "ADMIN"}</p>
            </div>
            <ChevronDown size={16} className="text-slate-400 dark:text-white/40 hidden sm:block flex-shrink-0" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-2 w-56 admin-card py-1 shadow-xl border border-slate-200 dark:border-white/10 z-50">
              <button
                type="button"
                className="w-full px-4 py-2.5 text-left text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5 flex items-center gap-2"
                onClick={() => {
                  navigate("/profile");
                  setMenuOpen(false);
                }}
              >
                <User size={16} /> Hồ sơ của tôi
              </button>
              {canManage && dashboardPath && (
                <button
                  type="button"
                  className="w-full px-4 py-2.5 text-left text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5 flex items-center gap-2"
                  onClick={() => {
                    navigate(dashboardPath);
                    setMenuOpen(false);
                  }}
                >
                  <LayoutDashboard size={16} /> Quản lý
                </button>
              )}
              {role === ROLES.ADMIN && (
                <button
                  type="button"
                  className="w-full px-4 py-2.5 text-left text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5 flex items-center gap-2"
                  onClick={() => {
                    navigate("/admin/tournament-config/formats");
                    setMenuOpen(false);
                  }}
                >
                  <Settings size={16} /> Cài đặt mặc định
                </button>
              )}
              <hr className="my-1 border-slate-100 dark:border-white/10" />
              <button
                type="button"
                className="w-full px-4 py-2.5 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 flex items-center gap-2"
                onClick={handleLogout}
              >
                <LogOut size={16} /> Đăng xuất
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;
