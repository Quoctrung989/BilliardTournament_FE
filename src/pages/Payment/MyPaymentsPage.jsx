import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { ArrowLeft, CreditCard, Calendar, CheckCircle2, XCircle, Clock, X } from "lucide-react";
import { getMyPayments } from "../../api/paymentApi";
import AdminPagination from "../../components/admin/ui/AdminPagination";
import { getApiErrorMessage } from "../../utils/apiError";
import { buildListParams, DEFAULT_PAGE_SIZE } from "../../utils/pagination";
import "../Profile/profile.scss";

const STATUS_CONFIG = {
  PENDING: { label: "Chờ thanh toán", bg: "bg-amber-100 text-amber-800",     dot: "bg-amber-500",   bar: "#f59e0b", Icon: Clock },
  SUCCESS: { label: "Đã thanh toán",  bg: "bg-emerald-100 text-emerald-800", dot: "bg-emerald-500", bar: "#10b981", Icon: CheckCircle2 },
  FAILED:  { label: "Thất bại",       bg: "bg-red-100 text-red-700",         dot: "bg-red-500",     bar: "#ef4444", Icon: XCircle },
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

const StatusBadge = ({ status }) => {
  const s = STATUS_CONFIG[status] || STATUS_CONFIG.PENDING;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${s.bg}`}
      style={{ width: "fit-content" }}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${s.dot}`} />
      {s.label}
    </span>
  );
};

const MyPaymentsPage = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [selectedPayment, setSelectedPayment] = useState(null);

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
    <div className="profile-page content-dark">
      <div className="profile-page-inner">
        <div className="profile-prefs-card">
          <div className="profile-prefs-tab">
            <span className="profile-prefs-tab-line" aria-hidden />
            <span className="profile-prefs-tab-text">Lịch sử thanh toán</span>
          </div>

          <div className="profile-prefs-body">
            <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
              <p className="profile-prefs-lead" style={{ marginBottom: 0 }}>
                Tất cả giao dịch thanh toán phí tham dự giải đấu
              </p>
              <button type="button" className="profile-btn-secondary inline-flex items-center gap-1.5" onClick={() => navigate("/player/registrations")}>
                <ArrowLeft size={14} /> Đăng ký của tôi
              </button>
            </div>

            {loading ? (
              <div className="profile-prefs-empty">Đang tải...</div>
            ) : items.length === 0 ? (
              <div className="profile-prefs-empty">
                <CreditCard size={40} className="mx-auto mb-4 text-slate-300" />
                <p className="mb-4">Chưa có giao dịch nào</p>
                <button type="button" className="profile-btn-save" onClick={() => navigate("/event")}>
                  Xem giải đấu
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                  {items.map((row) => {
                    const s = STATUS_CONFIG[row.status] || STATUS_CONFIG.PENDING;
                    const StatusIcon = s.Icon;
                    return (
                      <button key={row.id} type="button" onClick={() => setSelectedPayment(row)}
                        className="text-left bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col cursor-pointer hover:-translate-y-0.5 transition-transform"
                        style={{ boxShadow: "0 1px 3px rgba(15,23,42,0.06), 0 4px 12px rgba(15,23,42,0.04)" }}>
                        <div style={{ height: "4px", background: s.bar }} />
                        <div className="p-4 flex flex-col gap-2.5 flex-1">
                          <div className="flex items-center justify-between">
                            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                              style={{ background: `${s.bar}18` }}>
                              <StatusIcon size={16} style={{ color: s.bar }} />
                            </div>
                            <p className="font-black text-lg text-slate-900 tracking-tight m-0">
                              {fmtMoney(row.amount)}
                            </p>
                          </div>
                          <h3 className="font-semibold text-slate-900 text-sm leading-snug line-clamp-2">
                            {row.tournamentName || "Giải đấu"}
                          </h3>
                          <StatusBadge status={row.status} />
                          <span className="flex items-center gap-1.5 text-xs text-slate-400">
                            <Calendar size={11} />
                            {row.paidAt ? `Thanh toán: ${fmtDate(row.paidAt)}` : `Tạo: ${fmtDate(row.createdAt)}`}
                          </span>
                        </div>
                        <div className="px-4 py-2 border-t border-slate-100 text-xs text-slate-400">
                          Nhấn để xem chi tiết
                        </div>
                      </button>
                    );
                  })}
                </div>

                <AdminPagination
                  page={page} totalPages={totalPages} totalElements={totalElements}
                  pageSize={pageSize} disabled={loading}
                  onPageChange={setPage}
                  onPageSizeChange={(size) => { setPageSize(size); setPage(0); }}
                />
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Payment Detail Modal — giống AdminModal ── */}
      {selectedPayment && (() => {
        const row = selectedPayment;
        const s = STATUS_CONFIG[row.status] || STATUS_CONFIG.PENDING;
        const StatusIcon = s.Icon;
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setSelectedPayment(null)} role="presentation" />

            <div className="relative bg-white border border-slate-200 rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col">
              {/* Header */}
              <div className="px-6 py-4 border-b border-slate-200 shrink-0 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900">Chi tiết giao dịch</h3>
                <button type="button" onClick={() => setSelectedPayment(null)}
                  className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-lg hover:bg-slate-100">
                  <X size={18} />
                </button>
              </div>

              {/* Body */}
              <div className="px-6 py-4 text-sm text-slate-600 overflow-y-auto flex-1 space-y-4">
                {/* Tournament + status */}
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <p className="font-semibold text-slate-900 mb-2 line-clamp-2">
                    {row.tournamentName || "Giải đấu"}
                  </p>
                  <StatusBadge status={row.status} />
                </div>

                {/* Amount prominent */}
                <div className="flex items-center justify-between p-4 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                      style={{ background: `${s.bar}18` }}>
                      <StatusIcon size={16} style={{ color: s.bar }} />
                    </div>
                    <span className="text-slate-500 font-medium">Số tiền</span>
                  </div>
                  <p className="text-2xl font-black text-slate-900 tracking-tight m-0">
                    {fmtMoney(row.amount)}
                  </p>
                </div>

                {/* Info rows */}
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Thông tin giao dịch</p>
                  <div className="divide-y divide-slate-100">
                    {row.paidAt && (
                      <div className="flex justify-between py-2">
                        <span className="text-slate-500">Thời gian thanh toán</span>
                        <span className="font-medium text-slate-900">{fmtDate(row.paidAt)}</span>
                      </div>
                    )}
                    <div className="flex justify-between py-2">
                      <span className="text-slate-500">Ngày tạo giao dịch</span>
                      <span className="font-medium text-slate-900">{fmtDate(row.createdAt)}</span>
                    </div>
                    {row.transactionId && (
                      <div className="flex justify-between py-2">
                        <span className="text-slate-500">Mã giao dịch</span>
                        <span className="font-mono text-xs text-slate-700 text-right max-w-[60%] break-all">{row.transactionId}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 rounded-b-xl shrink-0 flex justify-end gap-2">
                <button type="button" onClick={() => setSelectedPayment(null)}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-white text-slate-900 border border-slate-200 hover:bg-slate-100 transition-colors cursor-pointer">
                  Đóng
                </button>
                {row.status === "PENDING" && row.checkoutUrl && (
                  <a href={row.checkoutUrl}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg text-white no-underline"
                    style={{ background: "#EF342A" }}>
                    <CreditCard size={14} /> Thanh toán ngay
                  </a>
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default MyPaymentsPage;
