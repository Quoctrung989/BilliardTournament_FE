import { withPageMeta } from "../admin/pageMetaLeaf";

/**
 * @param {React.ComponentType} Page
 * @param {string} title
 * @param {{
 *   subtitle?: string,
 *   fullWidth?: boolean,
 *   hideBreadcrumb?: boolean,
 *   hideTitles?: boolean,
 *   contentClassName?: string,
 * }} [options] navConfig không còn nhận per-page nữa — cố định theo section (STAFF_NAV) tại
 * routes/index.jsx.
 */
export const withStaffPage = (Page, title, options = {}) => {
  const {
    subtitle,
    fullWidth = false,
    hideBreadcrumb = false,
    hideTitles = false,
    contentClassName = "",
  } = options;

  const Wrapped = withPageMeta(Page, {
    title,
    subtitle,
    fullWidth,
    hideBreadcrumb,
    hideTitles,
    contentClassName,
  });
  Wrapped.__routeSection = "staff";
  return Wrapped;
};
