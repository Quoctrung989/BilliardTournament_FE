import AdminRoute from "../guards/AdminRoute";
import AdminLayout from "./AdminLayout";

export const withAdminPage = (Page, title, subtitle, options = {}) => {
  const Wrapped = () => (
    <AdminRoute>
      <AdminLayout title={title} subtitle={subtitle} fullWidth={options.fullWidth}>
        <Page />
      </AdminLayout>
    </AdminRoute>
  );
  return Wrapped;
};
