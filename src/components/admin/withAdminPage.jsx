import { withPageMeta } from "./pageMetaLeaf";

export const withAdminPage = (Page, title, subtitle, options = {}) => {
  const Wrapped = withPageMeta(Page, {
    title,
    subtitle,
    fullWidth: options.fullWidth,
    hideBreadcrumb: options.hideBreadcrumb,
    hideTitles: options.hideTitles,
    contentClassName: options.contentClassName,
  });
  Wrapped.__routeSection = "admin";
  return Wrapped;
};
