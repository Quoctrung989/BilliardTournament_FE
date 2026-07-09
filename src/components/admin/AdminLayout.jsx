import { useState } from "react";
import AdminSidebar from "./AdminSidebar";
import AdminHeader from "./AdminHeader";
import "../../styles/admin.css";

import { ADMIN_NAV } from "../../constants/adminNav";

const SIDEBAR_EXPANDED = 260;
const SIDEBAR_COLLAPSED = 64;

const AdminLayout = ({
  children,
  title,
  subtitle,
  fullWidth,
  navConfig = ADMIN_NAV,
  hideBreadcrumb = false,
  hideSearch = false,
  hideTitles = false,
  contentClassName = "",
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const sidebarW = collapsed ? SIDEBAR_COLLAPSED : SIDEBAR_EXPANDED;

  return (
    <div className="admin-shell min-h-screen bg-[var(--admin-bg)]">
      <AdminSidebar
        navConfig={navConfig}
        collapsed={collapsed}
        onToggle={() => setCollapsed((v) => !v)}
      />
      <div
        className="admin-main min-h-screen"
        style={{ marginLeft: sidebarW, width: `calc(100% - ${sidebarW}px)` }}
      >
        <AdminHeader
          title={title}
          subtitle={subtitle}
          hideBreadcrumb={hideBreadcrumb}
          hideSearch={hideSearch}
          hideTitles={hideTitles}
        />
        <main
          className={`${fullWidth ? "admin-content admin-content--full" : "admin-content"} ${contentClassName}`.trim()}
        >
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
