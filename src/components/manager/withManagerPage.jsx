import ManagerRoute from "../guards/ManagerRoute";
import AdminLayout from "../admin/AdminLayout";
import { MANAGER_NAV } from "../../constants/managerNav";

export const withManagerPage = (Page, title, subtitle, options = {}) => {
  const Wrapped = () => (
    <ManagerRoute>
      <AdminLayout
        title={title}
        subtitle={subtitle}
        fullWidth={options.fullWidth}
        navConfig={MANAGER_NAV}
      >
        <Page />
      </AdminLayout>
    </ManagerRoute>
  );
  return Wrapped;
};
