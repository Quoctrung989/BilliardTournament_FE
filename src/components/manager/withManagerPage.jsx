import { withPageMeta } from "../admin/pageMetaLeaf";

export const withManagerPage = (Page, title, subtitle, options = {}) => {
  const Wrapped = withPageMeta(Page, {
    title,
    subtitle,
    fullWidth: options.fullWidth,
    hideBreadcrumb: options.hideBreadcrumb,
    hideTitles: options.hideTitles,
    contentClassName: options.contentClassName,
  });
  Wrapped.__routeSection = "manager";
  return Wrapped;
};
