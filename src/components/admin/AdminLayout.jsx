import AdminSidebar from "./AdminSidebar";
import AdminHeader from "./AdminHeader";
import "../../styles/admin.css";

const AdminLayout = ({ children, title, subtitle, fullWidth }) => {
  return (
    <div className="admin-shell min-h-screen bg-[var(--admin-bg)]">
      <AdminSidebar />
      <div
        className="admin-main min-h-screen"
        style={{ marginLeft: "var(--admin-sidebar-w)" }}
      >
        <AdminHeader title={title} subtitle={subtitle} />
        <main className={fullWidth ? "admin-content admin-content--full" : "admin-content"}>
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
