import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import AdminSidebar from "./AdminSidebar";
import AdminHeader from "./AdminHeader";
import "../../styles/admin.css";

const SIDEBAR_EXPANDED = 260;
const SIDEBAR_COLLAPSED = 64;
/** Dưới ngưỡng này sidebar 260px sẽ ép content xuống còn quá hẹp (vd 375px mobile chỉ còn ~115px)
 *  — tự thu gọn về dạng icon-rail 64px (đã có sẵn, không cần dựng thêm drawer/overlay riêng). */
const MOBILE_BREAKPOINT = 768;

export const DEFAULT_PAGE_META = {
  title: "",
  subtitle: "",
  fullWidth: false,
  hideBreadcrumb: false,
  hideTitles: false,
  contentClassName: "",
};

/**
 * Shell chung cho Admin/Owner/Manager/Staff — mount 1 lần cho cả section (xem routes/index.jsx),
 * không remount theo từng trang, nhờ đó AdminSidebar không bị reset state khi điều hướng. Trang
 * con (qua with*Page) tự báo title/subtitle/... lên đây bằng useOutletContext (pageMetaLeaf.jsx).
 */
const AdminLayout = ({ navConfig, hideSidebar = false }) => {
  const [collapsed, setCollapsed] = useState(
    () => typeof window !== "undefined" && window.innerWidth < MOBILE_BREAKPOINT
  );
  const [pageMeta, setPageMeta] = useState(DEFAULT_PAGE_META);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < MOBILE_BREAKPOINT) setCollapsed(true);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  /* Không có sidebar thì phần nội dung chiếm trọn bề ngang, và nút "Về trang chủ"
     — vốn nằm ở chân sidebar — phải chuyển lên header, nếu không sẽ mất lối ra. */
  const sidebarW = hideSidebar ? 0 : collapsed ? SIDEBAR_COLLAPSED : SIDEBAR_EXPANDED;

  return (
    <div className="admin-shell min-h-screen bg-[var(--admin-bg)]">
      {!hideSidebar && (
        <AdminSidebar
          navConfig={navConfig}
          collapsed={collapsed}
          onToggle={() => setCollapsed((v) => !v)}
        />
      )}
      <div
        className="admin-main min-h-screen"
        style={{ marginLeft: sidebarW, width: `calc(100% - ${sidebarW}px)` }}
      >
        <AdminHeader
          title={pageMeta.title}
          subtitle={pageMeta.subtitle}
          hideBreadcrumb={pageMeta.hideBreadcrumb}
          hideTitles={pageMeta.hideTitles}
          showHomeButton={hideSidebar}
        />
        <main
          className={`${pageMeta.fullWidth ? "admin-content admin-content--full" : "admin-content"} ${pageMeta.contentClassName}`.trim()}
        >
          <Outlet context={{ setPageMeta }} />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
