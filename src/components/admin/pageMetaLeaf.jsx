import { useLayoutEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { DEFAULT_PAGE_META } from "./AdminLayout";

/**
 * Bọc `Page` thành 1 leaf dưới <Outlet> của AdminLayout (đã mount sẵn 1 lần cho cả section) —
 * báo title/subtitle/... của route này lên layout qua useOutletContext. Luôn thay thế toàn bộ
 * pageMeta (không merge từng phần) để tránh các cờ như fullWidth/hideBreadcrumb rò từ trang này
 * sang trang khác khi điều hướng.
 */
export const withPageMeta = (Page, meta) => {
  const Leaf = () => {
    const outletCtx = useOutletContext();
    useLayoutEffect(() => {
      outletCtx?.setPageMeta?.({ ...DEFAULT_PAGE_META, ...meta });
      // meta cố định theo closure của route — chỉ cần chạy 1 lần lúc mount
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    return <Page />;
  };
  return Leaf;
};
