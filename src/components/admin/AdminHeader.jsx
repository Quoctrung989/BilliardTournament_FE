import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Bell, ChevronDown, LayoutDashboard, LogOut, Search, Settings } from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { ROLES } from "../../constants/auth";
import { normalizeRole } from "../../utils/auth";

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
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();

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
    logout();
    navigate("/login");
  };

  const initials = (user?.email || "A").slice(0, 2).toUpperCase();
  const role = normalizeRole(user?.role);
  const dashboardPath = DASHBOARD_PATH_BY_ROLE[role];
  const canManage = [ROLES.ADMIN, ROLES.OWNER, ROLES.MANAGER].includes(role);

  return (
    <header
      className={`admin-header sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/90 ${
        hasSubtitle ? "admin-header--tall" : ""
      }`}
    >
      <div className="admin-header-titles">
        {!hideBreadcrumb && (
          <p className="admin-header-eyebrow">
            <span className="text-slate-400 font-medium">BTMS Admin</span>
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
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              size={18}
            />
            <input
              type="search"
              placeholder="Tìm kiếm nhanh..."
              className="admin-input pl-10 py-2 h-10 bg-slate-50 border-slate-200"
            />
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          type="button"
          className="admin-btn admin-btn-ghost w-10 h-10 p-0 rounded-full hidden sm:flex"
          aria-label="Thông báo"
        >
          <Bell size={20} />
        </button>

        <div className="relative" ref={menuRef}>
          <button
            type="button"
            className="flex items-center gap-2 pl-2 pr-3 h-10 rounded-full hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200"
            onClick={() => setMenuOpen((v) => !v)}
          >
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-xs font-bold shadow-sm flex-shrink-0">
              {initials}
            </div>
            <div className="hidden sm:block text-left min-w-0">
              <p className="text-sm font-semibold text-slate-800 leading-tight max-w-[140px] truncate">
                {user?.email || "Admin"}
              </p>
              <p className="text-xs text-slate-500 leading-tight">{user?.role || "ADMIN"}</p>
            </div>
            <ChevronDown size={16} className="text-slate-400 hidden sm:block flex-shrink-0" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-2 w-56 admin-card py-1 shadow-xl border border-slate-200 z-50">
              {canManage && dashboardPath && (
                <button
                  type="button"
                  className="w-full px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
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
                  className="w-full px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                  onClick={() => {
                    navigate("/admin/tournament-config/formats");
                    setMenuOpen(false);
                  }}
                >
                  <Settings size={16} /> Cài đặt mặc định
                </button>
              )}
              <hr className="my-1 border-slate-100" />
              <button
                type="button"
                className="w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
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
