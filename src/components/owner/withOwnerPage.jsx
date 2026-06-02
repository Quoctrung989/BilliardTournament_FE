import OwnerRoute from "../guards/OwnerRoute";
import AdminLayout from "../admin/AdminLayout";
import { OWNER_NAV } from "../../constants/ownerNav";

export const withOwnerPage = (Page, title, subtitle, options = {}) => {
  const Wrapped = () => (
    <OwnerRoute>
      <AdminLayout
        title={title}
        subtitle={subtitle}
        fullWidth={options.fullWidth}
        navConfig={OWNER_NAV}
      >
        <Page />
      </AdminLayout>
    </OwnerRoute>
  );
  return Wrapped;
};
