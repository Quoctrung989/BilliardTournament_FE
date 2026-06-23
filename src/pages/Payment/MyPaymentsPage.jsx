import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { CreditCard, ArrowLeft } from "lucide-react";
import { getMyPayments } from "../../api/paymentApi";
import AdminPagination from "../../components/admin/ui/AdminPagination";
import { getApiErrorMessage } from "../../utils/apiError";
import { buildListParams, DEFAULT_PAGE_SIZE } from "../../utils/pagination";

const STATUS_CONFIG = {
  PENDING: { label: "Chờ thanh toán", bg: "bg-amber-100 text-amber-800", dot: "bg-amber-500" },
  SUCCESS: { label: "Đã thanh toán",  bg: "bg-emerald-100 text-emerald-800", dot: "bg-emerald-500" },
  FAILED:  { label: "Thất bại",       bg: "bg-red-100 text-red-700", dot: "bg-red-500" },
};

const fmtDate = (iso) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("vi-VN", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
};

const fmtMoney = (v) => {
  if (v == null) return "—";
  return `${Number(v).toLocaleString("vi-VN")} đ`;
};

const MyPaymentsPage = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getMyPayments(buildListParams({ page, size: pageSize }));
      setItems(result.content);
      setTotalElements(result.totalElements);
      setTotalPages(result.totalPages);
      if (result.page !== page) setPage(result.page);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [page, pageSize]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="min-h-screen" style={{ background: "#f5f6fa" }}>
      {/* Header */}
      <div className="w-full py-8 px-6" style={{ background: "linear-gradient(135deg,#010851 0%,#0d1b2e 100%)" }}>
        <div className="max-w-4xl mx-auto">
          <button
            type="button"
            onClick={() => navigate("/player/registrations")}
            className="flex items-center gap-1.5 text-white/60 hover:text-white text-sm mb-3 transition-colors"
          >
            <ArrowLeft size={14} />
            Đăng ký của tôi
          </button>
          <h1 className="text-2xl font-black text-white mb-1">Lịch sử thanh toán</h1>
          <p className="text-white/50 text-sm">Tất cả giao dịch thanh toán phí tham dự giải đấu</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {loading ? (
          <div className="bg-white rounded-3xl p-16 text-center text-slate-400 shadow-sm">Đang tải...</div>
        ) : items.length === 0 ? (
          <div className="bg-white rounded-3xl p-16 text-center shadow-sm">
            <CreditCard size={40} className="mx-auto mb-4 text-slate-300" />
            <p className="text-slate-400 mb-4">Chưa có giao dịch nào</p>
            <button
              type="button"
              onClick={() => navigate("/player/tournaments")}
              className="px-6 py-2.5 rounded-2xl font-bold text-white text-sm"
              style={{ background: "#EF342A" }}
            >
              Xem giải đấu
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((row) => {
              const s = STATUS_CONFIG[row.status] || STATUS_CONFIG.PENDING;
              return (
                <div key={row.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
                  <div className="flex items-start gap-4">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: row.status === "SUCCESS" ? "rgba(16,185,129,0.1)" : "rgba(1,8,81,0.06)" }}
                    >
                      <CreditCard size={18} className={row.status === "SUCCESS" ? "text-emerald-500" : "text-[#010851]/40"} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <div>
                          <p className="font-bold text-[#010851] text-sm truncate">{row.tournamentName || "Giải đấu"}</p>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {row.paidAt ? `Thanh toán: ${fmtDate(row.paidAt)}` : `Tạo: ${fmtDate(row.createdAt)}`}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-black text-lg text-[#010851]">{fmtMoney(row.amount)}</p>
                          <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium mt-0.5 ${s.bg}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                            {s.label}
                          </span>
                        </div>
                      </div>

                      {row.status === "PENDING" && row.checkoutUrl && (
                        <div className="mt-3">
                          <a
                            href={row.checkoutUrl}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90"
                            style={{ background: "#EF342A" }}
                          >
                            <CreditCard size={14} />
                            Thanh toán ngay
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            <AdminPagination
              page={page}
              totalPages={totalPages}
              totalElements={totalElements}
              pageSize={pageSize}
              disabled={loading}
              onPageChange={setPage}
              onPageSizeChange={(size) => { setPageSize(size); setPage(0); }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default MyPaymentsPage;
