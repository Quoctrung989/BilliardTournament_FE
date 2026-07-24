import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import AdminPagination from "./AdminPagination";
import { getApiErrorMessage } from "../../../utils/apiError";
import { formatVND } from "../../../utils/helpers";
import { DEFAULT_PAGE_SIZE } from "../../../utils/pagination";

const TRANSACTION_STATUS_STYLES = {
  SUCCESS: "bg-emerald-100 text-emerald-800",
  PENDING: "bg-amber-100 text-amber-800",
  FAILED: "bg-rose-100 text-rose-800",
  CANCELLED: "bg-gray-200 text-gray-700",
};

const TRANSACTION_STATUS_OPTIONS = [
  { value: "", label: "Tất cả trạng thái" },
  { value: "SUCCESS", label: "Thành công" },
  { value: "PENDING", label: "Chờ thanh toán" },
  { value: "FAILED", label: "Thất bại" },
  { value: "CANCELLED", label: "Đã hủy" },
];

const fmtDateTime = (iso) => (iso ? new Date(iso).toLocaleString("vi-VN") : "—");

/**
 * Bảng giao dịch phân trang, có bộ lọc trạng thái riêng — độc lập với vòng load() của trang cha
 * nên chuyển trang/lọc trạng thái ở đây không kéo theo việc load lại toàn bộ trang.
 * tournamentId bỏ trống = xem tất cả giao dịch của mọi giải (view tổng quan/trang quản lý giao dịch).
 */
const TransactionTable = ({ analyticsApi, tournamentId, from, to }) => {
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [rows, setRows] = useState([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await analyticsApi.listTransactions({
        tournamentId, status: status || undefined, from, to, page, size: pageSize,
      });
      setRows(result.content);
      setTotalElements(result.totalElements);
      setTotalPages(result.totalPages);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [analyticsApi, tournamentId, status, from, to, page, pageSize]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(0); }, [status, tournamentId, from, to]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <select className="admin-select w-auto" value={status} onChange={(e) => setStatus(e.target.value)}>
          {TRANSACTION_STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <span className="text-xs text-slate-400">{totalElements} giao dịch</span>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table w-full text-sm">
          <thead>
            <tr>
              <th>Người chơi</th>
              {!tournamentId && <th>Giải đấu</th>}
              <th>Số tiền</th>
              <th>Phương thức</th>
              <th>Trạng thái</th>
              <th>Mã giao dịch</th>
              <th>Thời gian</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={tournamentId ? 6 : 7} className="text-center py-6 text-slate-400">Đang tải...</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={tournamentId ? 6 : 7} className="text-center py-6 text-slate-400">Không có giao dịch nào.</td></tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id}>
                  <td className="text-xs">{r.playerName || "—"}</td>
                  {!tournamentId && <td className="text-xs text-slate-500">{r.tournamentName || "—"}</td>}
                  <td className="text-xs font-semibold">{formatVND(r.amount || 0)}</td>
                  <td className="text-xs">{r.paymentMethod || "—"}</td>
                  <td>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${TRANSACTION_STATUS_STYLES[r.status] || ""}`}>
                      {r.statusLabel || r.status}
                    </span>
                  </td>
                  <td className="text-xs">
                    <code className="admin-table-code" title={r.transactionCode}>{r.transactionCode || "—"}</code>
                  </td>
                  <td className="text-xs">{fmtDateTime(r.paidAt || r.createdAt)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <AdminPagination
        page={page}
        totalPages={totalPages}
        totalElements={totalElements}
        pageSize={pageSize}
        disabled={loading}
        onPageChange={setPage}
        onPageSizeChange={(s) => { setPageSize(s); setPage(0); }}
      />
    </div>
  );
};

export default TransactionTable;
