import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  BarChart3,
  ChevronDown,
  ChevronLeft,
  CreditCard,
  FileText,
  LayoutDashboard,
  LayoutGrid,
  Mail,
  MapPin,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  Share2,
  Tags,
  Trophy,
  UserCog,
  Users,
} from "lucide-react";
import { ADMIN_NAV } from "../../constants/adminNav";

/** @typedef {{ id: string, label: string, items?: Array, collapsible?: boolean, matchPrefix?: string, icon?: string, labelNav?: string, children?: Array }} NavSection */

const iconMap = {
  "layout-dashboard": LayoutDashboard,
  "layout-grid": LayoutGrid,
  "bar-chart-3": BarChart3,
  "credit-card": CreditCard,
  users: Users,
  trophy: Trophy,
  settings: Settings,
  "user-cog": UserCog,
  "map-pin": MapPin,
  mail: Mail,
  "file-text": FileText,
  "share-2": Share2,
  tags: Tags,
};

const NavLink = ({ active, onClick, icon: Icon, label, indent, collapsed }) => {
  if (collapsed) {
    return (
      <button
        type="button"
        onClick={onClick}
        title={label}
        className={`w-full flex items-center justify-center rounded-lg py-2.5 transition-colors ${
          active
            ? "bg-indigo-600/90 text-white shadow-sm"
            : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
        }`}
      >
        {Icon && <Icon size={18} strokeWidth={2} className="flex-shrink-0 opacity-90" />}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center gap-3 rounded-lg text-sm font-medium transition-colors ${
        indent ? "pl-9 pr-3 py-2" : "px-3 py-2.5"
      } ${
        active
          ? "bg-indigo-600/90 text-white shadow-sm"
          : "text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
      }`}
    >
      {Icon && <Icon size={18} strokeWidth={2} className="flex-shrink-0 opacity-90" />}
      <span className="truncate text-left">{label}</span>
    </button>
  );
};

const AdminSidebar = ({ navConfig = ADMIN_NAV, collapsed, onToggle }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [openSections, setOpenSections] = useState(() => {
    const initial = {};
    navConfig.forEach((s) => {
      if (s.collapsible) {
        initial[s.id] = location.pathname.startsWith(s.matchPrefix || "");
      }
    });
    return initial;
  });

  const toggleSection = (id) =>
    setOpenSections((prev) => ({ ...prev, [id]: !prev[id] }));

  const allPaths = navConfig.flatMap((s) => (s.items || s.children || []).map((i) => i.path));

  // Prefix match chỉ được coi là active nếu không có path nào khác cụ thể hơn
  // (dài hơn) cũng khớp — tránh việc 2 mục cùng sáng khi 1 mục là tiền tố của mục kia
  // (vd "/owner/news" và "/owner/news/categories").
  const isActive = (path) => {
    if (location.pathname === path) return true;
    if (path === "/admin/dashboard" || !location.pathname.startsWith(path + "/")) return false;
    return !allPaths.some(
      (p) =>
        p !== path &&
        p.length > path.length &&
        (location.pathname === p || location.pathname.startsWith(p + "/"))
    );
  };

  return (
    <aside
      className={`admin-shell fixed left-0 top-0 z-40 flex h-screen flex-col bg-white dark:bg-[#0b1424] text-slate-800 dark:text-white border-r border-slate-200 dark:border-white/10 transition-all duration-250 ease-in-out ${
        collapsed ? "w-16" : "w-[var(--admin-sidebar-w)]"
      }`}
    >
      {/* Header */}
      <div
        className={`flex items-center min-h-[var(--admin-header-h)] py-4 border-b border-slate-200 dark:border-slate-700/50 flex-shrink-0 ${
          collapsed ? "justify-center px-2" : "gap-3 px-5"
        }`}
      >
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-400 to-violet-600 flex items-center justify-center font-bold text-sm shadow-lg flex-shrink-0">
          B
        </div>

        {!collapsed && (
          <div className="flex-1 min-w-0">
            <p className="font-bold text-base tracking-tight leading-none">BTMS</p>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-0.5">
              Billiards
            </p>
          </div>
        )}

        <button
          type="button"
          onClick={onToggle}
          title={collapsed ? "Mở rộng menu" : "Thu gọn menu"}
          className={`rounded-lg p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex-shrink-0 ${
            collapsed ? "mt-0" : ""
          }`}
        >
          {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
        </button>
      </div>

      {/* Nav */}
      <nav className={`admin-sidebar-nav flex-1 overflow-y-auto py-3 space-y-3 ${collapsed ? "px-2" : "px-3"}`}>
        {navConfig.map((section) => {
          if (section.collapsible) {
            const sectionActive = location.pathname.startsWith(section.matchPrefix);
            const SettingsIcon = iconMap[section.icon] || Settings;

            if (collapsed) {
              return (
                <div key={section.id} className="space-y-0.5">
                  {section.children.map((child) => (
                    <NavLink
                      key={child.path}
                      collapsed
                      active={isActive(child.path)}
                      label={child.label}
                      icon={Settings}
                      onClick={() => navigate(child.path)}
                    />
                  ))}
                </div>
              );
            }

            return (
              <div key={section.id}>
                <p className="px-3 mb-1 text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                  {section.label}
                </p>
                <button
                  type="button"
                  onClick={() => toggleSection(section.id)}
                  className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    sectionActive
                      ? "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white"
                      : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <SettingsIcon size={18} />
                    {section.labelNav}
                  </span>
                  <ChevronDown
                    size={16}
                    className={`transition-transform ${openSections[section.id] ? "rotate-180" : ""}`}
                  />
                </button>
                {openSections[section.id] && (
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
              {!collapsed && (
                <p className="px-3 mb-1 text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                  {section.label}
                </p>
              )}
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = iconMap[item.icon];
                  return (
                    <NavLink
                      key={item.path + item.label}
                      collapsed={collapsed}
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

      {/* Footer */}
      <div className={`border-t border-slate-200 dark:border-slate-700/50 ${collapsed ? "p-2" : "p-4"}`}>
        <button
          type="button"
          onClick={() => navigate("/")}
          title="Về trang chủ"
          className={`w-full flex items-center rounded-lg text-sm text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 transition-colors ${
            collapsed ? "justify-center py-2.5" : "justify-center gap-2 py-2.5"
          }`}
        >
          <ChevronLeft size={18} />
          {!collapsed && "Về trang chủ"}
        </button>
      </div>
    </aside>
  );
};

export default AdminSidebar;
