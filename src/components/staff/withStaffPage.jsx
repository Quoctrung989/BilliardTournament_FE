import StaffRoute from "../guards/StaffRoute";
import AdminLayout from "../admin/AdminLayout";

/** Staff dùng chung shell sidebar (có thể tách StaffLayout sau) */
export const withStaffPage = (Page, title) => {
  const Wrapped = () => (
    <StaffRoute>
      <AdminLayout title={title}>
        <Page />
      </AdminLayout>
    </StaffRoute>
  );
  return Wrapped;
};
