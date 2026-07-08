import StaffRoute from "../guards/StaffRoute";
import AdminLayout from "../admin/AdminLayout";
import { STAFF_NAV } from "../../constants/staffNav";

/**
 * @param {React.ComponentType} Page
 * @param {string} title
 * @param {{
 *   subtitle?: string,
 *   fullWidth?: boolean,
 *   navConfig?: object,
 *   hideBreadcrumb?: boolean,
 *   hideSearch?: boolean,
 *   hideTitles?: boolean,
 *   contentClassName?: string,
 * }} [options]
 */
export const withStaffPage = (Page, title, options = {}) => {
  const {
    subtitle,
    fullWidth = false,
    navConfig = STAFF_NAV,
    hideBreadcrumb = false,
    hideSearch = false,
    hideTitles = false,
    contentClassName = "",
  } = options;

  const Wrapped = () => (
    <StaffRoute>
      <AdminLayout
        title={title}
        subtitle={subtitle}
        fullWidth={fullWidth}
        navConfig={navConfig}
        hideBreadcrumb={hideBreadcrumb}
        hideSearch={hideSearch}
        hideTitles={hideTitles}
        contentClassName={contentClassName}
      >
        <Page />
      </AdminLayout>
    </StaffRoute>
  );
  return Wrapped;
};
