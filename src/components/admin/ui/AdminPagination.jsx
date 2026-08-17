import { ChevronLeft, ChevronRight } from "lucide-react";
import AdminButton from "./AdminButton";
import { PAGE_SIZE_OPTIONS, pageDisplay } from "../../../utils/pagination";

const AdminPagination = ({
  page,
  totalPages,
  totalElements,
  pageSize,
  onPageChange,
  onPageSizeChange,
  disabled = false,
  /* Mặc định là bộ dùng chung [9, 18, 24] — hợp với lưới 3 cột của hầu hết màn
     admin. Màn nào bố cục khác thì truyền bộ riêng, ví dụ lưới 4 cột ở /event
     cần bội số của 4 để trang nào cũng kết thúc bằng hàng đầy. */
  pageSizeOptions = PAGE_SIZE_OPTIONS,
}) => {
  if (totalElements === 0) return null;

  const current = pageDisplay(page);
  const canPrev = page > 0 && !disabled;
  const canNext = page < totalPages - 1 && !disabled;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 border-t border-slate-200 dark:border-white/10 bg-slate-50/80 dark:bg-white/[0.03]">
      <p className="text-sm text-slate-600 dark:text-slate-300">
        Tổng <span className="font-semibold text-slate-800 dark:text-slate-100">{totalElements}</span> bản ghi
        {totalPages > 0 && (
          <>
            {" "}
            · Trang{" "}
            <span className="font-semibold text-slate-800 dark:text-slate-100">{current}</span> / {totalPages}
          </>
        )}
      </p>

      <div className="flex flex-wrap items-center gap-2">
        {onPageSizeChange && (
          <select
            className="admin-select w-auto h-9 text-sm py-1"
            value={pageSize}
            disabled={disabled}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            aria-label="Số dòng mỗi trang"
          >
            {pageSizeOptions.map((n) => (
              <option key={n} value={n}>
                {n} / trang
              </option>
            ))}
          </select>
        )}

        <AdminButton
          variant="secondary"
          type="button"
          className="!h-9 !px-2"
          disabled={!canPrev}
          onClick={() => onPageChange(page - 1)}
          aria-label="Trang trước"
        >
          <ChevronLeft size={18} />
        </AdminButton>

        <AdminButton
          variant="secondary"
          type="button"
          className="!h-9 !px-2"
          disabled={!canNext}
          onClick={() => onPageChange(page + 1)}
          aria-label="Trang sau"
        >
          <ChevronRight size={18} />
        </AdminButton>
      </div>
    </div>
  );
};

export default AdminPagination;
