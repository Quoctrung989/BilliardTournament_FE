import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { CreditCard, ChevronRight, X, Calendar, User } from "lucide-react";
import {
  cancelMyRegistration,
  getMyRegistrationDetail,
  getMyRegistrations,
} from "../../api/playerRegistrationApi";
import { createCheckout } from "../../api/paymentApi";
import AdminPagination from "../../components/admin/ui/AdminPagination";
import ConfirmModal from "../../components/shared/ui/ConfirmModal";
import { REGISTRATION_STATUS_LABELS } from "../../constants/registrationFormConfig";
import { getApiErrorMessage } from "../../utils/apiError";
import { buildListParams, DEFAULT_PAGE_SIZE } from "../../utils/pagination";
import { useReveal } from "../../hooks/useReveal";
import "../Profile/profile.scss";

const STATUS_STYLES = {
  PENDING_PAYMENT: { bg: "bg-amber-100 text-amber-800",     dot: "bg-amber-500",   bar: "#f59e0b" },
  PAID:            { bg: "bg-blue-100 text-blue-800",       dot: "bg-blue-500",    bar: "#3b82f6" },
  APPROVED:        { bg: "bg-emerald-100 text-emerald-800", dot: "bg-emerald-500", bar: "#10b981" },
  REJECTED:        { bg: "bg-red-100 text-red-700",         dot: "bg-red-500",     bar: "#ef4444" },
  CANCELLED:       { bg: "bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-white/60",     dot: "bg-slate-400",   bar: "#94a3b8" },
};

const fmtDate = (iso) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("vi-VN", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
};

const StatusBadge = ({ status }) => {
  const s = STATUS_STYLES[status] || STATUS_STYLES.CANCELLED;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${s.bg}`}
      style={{ width: "fit-content" }}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${s.dot}`} />
      {REGISTRATION_STATUS_LABELS[status] || status}
    </span>
  );
};

const MyRegistrationsPage = () => {
  const navigate = useNavigate();
  const gridRef = useReveal({ threshold: 0.08 });
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [payingId, setPayingId] = useState(null);
  const [cancelModal, setCancelModal] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getMyRegistrations(buildListParams({ page, size: pageSize }));
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

  const openDetail = async (id) => {
    setDetailLoading(true);
    setDetail({ id, loading: true });
    try {
      const data = await getMyRegistrationDetail(id);
      setDetail(data);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
      setDetail(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetail = () => setDetail(null);

  const confirmCancel = async () => {
    if (!cancelModal) return;
    try {
      await cancelMyRegistration(cancelModal.id);
      toast.success("Đã hủy đăng ký");
      setDetail(null);
      setCancelModal(null);
      load();
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  const handlePayNow = async (registrationId) => {
    setPayingId(registrationId);
    try {
      const checkout = await createCheckout(registrationId);
      window.location.href = checkout.checkoutUrl;
    } catch (err) {
      toast.error(getApiErrorMessage(err));
      setPayingId(null);
    }
  };

  return (
    <div className="profile-page content-dark">
      <div className="profile-page-inner">
        <div className="profile-prefs-card">
          <div className="profile-prefs-tab">
            <span className="profile-prefs-tab-line" aria-hidden />
            <span className="profile-prefs-tab-text">Đăng ký của tôi</span>
          </div>

          <div className="profile-prefs-body">
            <div className="mb-6">
              <p className="profile-prefs-lead" style={{ marginBottom: 0 }}>
                Lịch sử và trạng thái các đăng ký giải đấu
              </p>
            </div>

            {loading ? (
              <div className="profile-prefs-empty">Đang tải...</div>
            ) : items.length === 0 ? (
              <div className="profile-prefs-empty">
                <p className="mb-4">Bạn chưa đăng ký giải nào</p>
                <button type="button" className="profile-btn-save" onClick={() => navigate("/event")}>
                  Xem giải đấu đang mở
                </button>
              </div>
            ) : (
              <>
                <div ref={gridRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                  {items.map((row, index) => {
                    const s = STATUS_STYLES[row.status] || STATUS_STYLES.CANCELLED;
                    return (
                      // Stagger ở lớp ngoài, hover ở lớp trong — gộp chung thì
                      // transition-delay của stagger sẽ rò sang hover.
                      <div key={row.id} className="ui-stagger flex" style={{ "--i": Math.min(index, 11) }}>
                      <div className="ui-card group bg-white dark:bg-[#131c2e] border border-slate-200 dark:border-white/10 rounded-xl overflow-hidden flex flex-col w-full"
                        style={{ boxShadow: "0 1px 3px rgba(15,23,42,0.06), 0 4px 12px rgba(15,23,42,0.04)" }}>
                        <div style={{ height: "4px", background: s.bar }} />
                        <div className="p-4 flex flex-col gap-2.5 flex-1">
                          <button type="button" className="text-left"
                            onClick={() => navigate(`/event/${row.tournamentId}`)}>
                            <h3 className="font-semibold text-slate-900 dark:text-white text-sm leading-snug line-clamp-2 hover:text-indigo-600 transition-colors">
                              {row.tournamentName}
                            </h3>
                          </button>
                          <StatusBadge status={row.status} />
                          <div className="flex flex-col gap-1">
                            <span className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-white/40">
                              <Calendar size={11} />{fmtDate(row.createdAt)}
                            </span>
                            <span className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-white/60">
                              <User size={11} />{row.playerFullName}
                            </span>
                          </div>
                          {row.status === "APPROVED" && (
                            <span className="text-xs font-semibold text-emerald-600">✓ Đã xác nhận tham dự</span>
                          )}
                          {row.status === "REJECTED" && (
                            <span className="text-xs font-semibold text-red-600">✗ Không được tham dự</span>
                          )}
                        </div>
                        <div className="px-4 py-2.5 border-t border-slate-100 dark:border-white/10 bg-slate-50/60 flex items-center gap-2">
                          {row.status === "PENDING_PAYMENT" && (
                            <button type="button" disabled={payingId === row.id}
                              onClick={() => handlePayNow(row.id)}
                              className="ui-press flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold text-white disabled:opacity-60"
                              style={{ background: "#EF342A" }}>
                              <CreditCard size={11} />
                              {payingId === row.id ? "..." : "Thanh toán"}
                            </button>
                          )}
                          <button type="button" onClick={() => openDetail(row.id)}
                            className="ml-auto flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-white/70 border border-slate-200 dark:border-white/10 bg-white dark:bg-[#131c2e] hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                            Chi tiết <ChevronRight size={12} className="ui-arrow-x" />
                          </button>
                        </div>
                      </div>
                      </div>
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

      {/* ── Detail Modal — giống AdminModal ── */}
      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="ui-modal-backdrop absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={closeDetail} role="presentation" />

          <div className="ui-modal-panel relative bg-white dark:bg-[#131c2e] border border-slate-200 dark:border-white/10 rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-200 dark:border-white/10 shrink-0 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Chi tiết đăng ký</h3>
              <button type="button" onClick={closeDetail}
                className="text-slate-400 dark:text-white/40 hover:text-slate-600 dark:hover:text-white/70 transition-colors p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10">
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            {detailLoading || detail.loading ? (
              <div className="px-6 py-12 text-center text-slate-400 dark:text-white/40 text-sm">Đang tải thông tin...</div>
            ) : (
              <>
                <div className="px-6 py-4 text-sm text-slate-600 dark:text-white/70 overflow-y-auto flex-1 space-y-4">
                  {/* Tournament + status */}
                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10">
                    <p className="font-semibold text-slate-900 dark:text-white mb-2">{detail.tournamentName}</p>
                    <StatusBadge status={detail.status} />
                    {detail.status === "APPROVED" && (
                      <p className="mt-2 text-xs font-semibold text-emerald-600">✓ Đã xác nhận tham dự — Chờ giải đấu bắt đầu</p>
                    )}
                  </div>

                  {/* Info rows */}
                  <div>
                    <p className="text-xs font-semibold text-slate-400 dark:text-white/40 uppercase tracking-wide mb-2">Thông tin đăng ký</p>
                    <div className="divide-y divide-slate-100">
                      <div className="flex justify-between py-2">
                        <span className="text-slate-500 dark:text-white/60">Người đăng ký</span>
                        <span className="font-medium text-slate-900 dark:text-white">{detail.playerFullName}</span>
                      </div>
                      <div className="flex justify-between py-2">
                        <span className="text-slate-500 dark:text-white/60">Số điện thoại</span>
                        <span className="font-medium text-slate-900 dark:text-white">{detail.playerPhone || "—"}</span>
                      </div>
                      <div className="flex justify-between py-2">
                        <span className="text-slate-500 dark:text-white/60">Ngày đăng ký</span>
                        <span className="font-medium text-slate-900 dark:text-white">{fmtDate(detail.createdAt)}</span>
                      </div>
                      {detail.note && (
                        <div className="flex justify-between py-2">
                          <span className="text-slate-500 dark:text-white/60">Ghi chú</span>
                          <span className="font-medium text-slate-900 dark:text-white text-right max-w-[60%]">{detail.note}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {detail.rejectedReason && (
                    <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                      <p className="text-xs font-semibold text-red-600 uppercase tracking-wide mb-1">Lý do không được tham dự</p>
                      <p className="text-sm text-red-700">{detail.rejectedReason}</p>
                    </div>
                  )}

                  {detail.fieldValues?.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-slate-400 dark:text-white/40 uppercase tracking-wide mb-2">Thông tin đã điền</p>
                      <div className="divide-y divide-slate-100">
                        {detail.fieldValues.map((fv) => (
                          <div key={fv.fieldKey} className="flex justify-between py-2">
                            <span className="text-slate-500 dark:text-white/60">{fv.label}</span>
                            <span className="font-medium text-slate-900 dark:text-white text-right max-w-[60%]">{fv.value || "—"}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 rounded-b-xl shrink-0 flex justify-end gap-2 flex-wrap">
                  {detail.status === "PENDING_PAYMENT" && (
                    <button type="button" onClick={() => setCancelModal({ id: detail.id })}
                      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg border border-red-200 text-red-600 bg-white dark:bg-[#131c2e] hover:bg-red-50 transition-colors cursor-pointer">
                      Hủy đăng ký
                    </button>
                  )}
                  <button type="button"
                    onClick={() => navigate(`/event/${detail.tournamentId}`)}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-white dark:bg-[#131c2e] text-slate-900 dark:text-white border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer">
                    Xem giải đấu
                  </button>
                  {detail.status === "PENDING_PAYMENT" && (
                    <button type="button" disabled={payingId === detail.id}
                      onClick={() => handlePayNow(detail.id)}
                      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg text-white disabled:opacity-60 transition-opacity cursor-pointer"
                      style={{ background: "#EF342A" }}>
                      <CreditCard size={14} />
                      {payingId === detail.id ? "Đang chuyển..." : "Thanh toán ngay"}
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <ConfirmModal
        open={!!cancelModal}
        onCancel={() => setCancelModal(null)}
        onConfirm={confirmCancel}
        title="Xác nhận hủy đăng ký"
        message="Hủy đăng ký này?"
        confirmText="Hủy đăng ký"
        confirmVariant="danger"
      />
    </div>
  );
};

export default MyRegistrationsPage;
