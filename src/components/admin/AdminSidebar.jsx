import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  ChevronDown,
  ChevronLeft,
  LayoutDashboard,
  Settings,
  Trophy,
  UserCog,
  Users,
} from "lucide-react";
import { ADMIN_NAV } from "../../constants/adminNav";

/** @typedef {{ id: string, label: string, items?: Array, collapsible?: boolean, matchPrefix?: string, icon?: string, labelNav?: string, children?: Array }} NavSection */

const iconMap = {
  "layout-dashboard": LayoutDashboard,
  users: Users,
  trophy: Trophy,
  settings: Settings,
  "user-cog": UserCog,
};

const NavLink = ({ active, onClick, icon: Icon, label, indent }) => (
  <button
    type="button"
    onClick={onClick}
    className={`w-full flex items-center gap-3 rounded-lg text-sm font-medium transition-colors ${
      indent ? "pl-9 pr-3 py-2" : "px-3 py-2.5"
    } ${
      active
        ? "bg-indigo-600/90 text-white shadow-sm"
        : "text-slate-300 hover:bg-slate-800 hover:text-white"
    }`}
  >
    {Icon && <Icon size={18} strokeWidth={2} className="flex-shrink-0 opacity-90" />}
    <span className="truncate text-left">{label}</span>
  </button>
);

const AdminSidebar = ({ navConfig = ADMIN_NAV }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const configSection = navConfig.find((s) => s.id === "config");
  const [configOpen, setConfigOpen] = useState(
    location.pathname.startsWith(configSection?.matchPrefix || "")
  );

  const isActive = (path) =>
    location.pathname === path ||
    (path !== "/admin/dashboard" && location.pathname.startsWith(path + "/"));

  return (
    <aside className="admin-shell fixed left-0 top-0 z-40 flex h-screen w-[var(--admin-sidebar-w)] flex-col bg-[var(--admin-sidebar)] text-white border-r border-slate-800/50">
      <div className="flex items-center gap-3 px-5 min-h-[var(--admin-header-h)] py-4 border-b border-slate-700/50 flex-shrink-0">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-400 to-violet-600 flex items-center justify-center font-bold text-sm shadow-lg">
          B
        </div>
        <div>
          <p className="font-bold text-base tracking-tight leading-none">BTMS</p>
          <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-0.5">
            Billiards
          </p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6 scrollbar-thin">
        {navConfig.map((section) => {
          if (section.collapsible) {
            const sectionActive = location.pathname.startsWith(section.matchPrefix);
            const SettingsIcon = iconMap[section.icon] || Settings;
            return (
              <div key={section.id}>
                <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                  {section.label}
                </p>
                <button
                  type="button"
                  onClick={() => setConfigOpen((v) => !v)}
                  className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    sectionActive
                      ? "bg-slate-800 text-white"
                      : "text-slate-300 hover:bg-slate-800"
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <SettingsIcon size={18} />
                    {section.labelNav}
                  </span>
                  <ChevronDown
                    size={16}
                    className={`transition-transform ${configOpen ? "rotate-180" : ""}`}
                  />
                </button>
                {configOpen && (
                  <div className="mt-1 space-y-0.5">
                    {section.children.map((child) => (
                      <NavLink
                        key={child.path}
                        indent
                        active={isActive(child.path)}
                        label={child.label}
                        onClick={() => navigate(child.path)}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          }

          return (
            <div key={section.id}>
              <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                {section.label}
              </p>
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = iconMap[item.icon];
                  return (
                    <NavLink
                      key={item.path + item.label}
                      active={isActive(item.path)}
                      icon={Icon}
                      label={item.label}
                      onClick={() => navigate(item.path)}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-700/50">
        <button
          type="button"
          onClick={() => navigate("/")}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <ChevronLeft size={18} />
          Về trang chủ
        </button>
      </div>
    </aside>
  );
};

export default AdminSidebar;
