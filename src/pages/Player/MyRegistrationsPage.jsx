import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { CreditCard, ChevronRight, X } from "lucide-react";
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

const STATUS_STYLES = {
  PENDING_PAYMENT: { bg: "bg-amber-100 text-amber-800", dot: "bg-amber-500" },
  PAID: { bg: "bg-blue-100 text-blue-800", dot: "bg-blue-500" },
  APPROVED: { bg: "bg-emerald-100 text-emerald-800", dot: "bg-emerald-500" },
  REJECTED: { bg: "bg-red-100 text-red-700", dot: "bg-red-500" },
  CANCELLED: { bg: "bg-slate-100 text-slate-500", dot: "bg-slate-400" },
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
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${s.bg}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {REGISTRATION_STATUS_LABELS[status] || status}
    </span>
  );
};

const MyRegistrationsPage = () => {
  const navigate = useNavigate();
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

  const handleCancel = async (id) => {
    setCancelModal({ id });
  };

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
    <div className="min-h-screen" style={{ background: "#f5f6fa" }}>
      {/* Page header */}
      <div className="w-full py-8 px-6" style={{ background: "linear-gradient(135deg,#010851 0%,#0d1b2e 100%)" }}>
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-black text-white mb-1">Đăng ký của tôi</h1>
          <p className="text-white/50 text-sm">Lịch sử và trạng thái các đăng ký giải đấu</p>
          <div className="flex gap-4 mt-4">
            <button
              type="button"
              className="text-sm text-white/70 hover:text-white flex items-center gap-1 transition-colors"
              onClick={() => navigate("/player/payments")}
            >
              Lịch sử thanh toán →
            </button>
            <button
              type="button"
              className="text-sm text-white/70 hover:text-white flex items-center gap-1 transition-colors"
              onClick={() => navigate("/player/tournaments")}
            >
              Xem giải đấu →
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {loading ? (
          <div className="bg-white rounded-3xl p-16 text-center text-slate-400 shadow-sm">Đang tải...</div>
        ) : items.length === 0 ? (
          <div className="bg-white rounded-3xl p-16 text-center shadow-sm">
            <p className="text-slate-400 mb-4 text-lg">Bạn chưa đăng ký giải nào</p>
            <button
              type="button"
              className="px-8 py-3 rounded-2xl font-bold text-white text-sm transition-all hover:opacity-90"
              style={{ background: "#EF342A" }}
              onClick={() => navigate("/player/tournaments")}
            >
              Xem giải đấu đang mở
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((row) => (
              <div
                key={row.id}
                className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden"
              >
                <div className="p-5 flex items-center gap-4">
                  {/* Status dot + info */}
                  <div className="flex-1 min-w-0">
                    <button
                      type="button"
                      className="text-left w-full"
                      onClick={() => navigate(`/player/tournaments/${row.tournamentId}`)}
                    >
                      <p className="font-bold text-[#010851] truncate hover:text-[#EF342A] transition-colors">
                        {row.tournamentName}
                      </p>
                    </button>
                    <div className="flex flex-wrap items-center gap-3 mt-1.5">
                      <StatusBadge status={row.status} />
                      <span className="text-xs text-slate-400">{fmtDate(row.createdAt)}</span>
                      <span className="text-xs text-slate-500">{row.playerFullName}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    {row.status === "PENDING_PAYMENT" && (
                      <button
                        type="button"
                        disabled={payingId === row.id}
                        onClick={() => handlePayNow(row.id)}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-60"
                        style={{ background: "#EF342A" }}
                      >
                        <CreditCard size={14} />
                        {payingId === row.id ? "..." : "Thanh toán"}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => openDetail(row.id)}
                      className="p-2 rounded-xl text-slate-400 hover:text-[#010851] hover:bg-slate-50 transition-colors"
                    >
                      <ChevronRight size={18} />
                    </button>
                  </div>
                </div>

                {/* APPROVED banner */}
                {row.status === "APPROVED" && (
                  <div className="px-5 py-2.5 bg-emerald-50 border-t border-emerald-100">
                    <p className="text-xs font-semibold text-emerald-700">
                      ✓ Đã xác nhận tham dự — Chờ giải đấu bắt đầu
                    </p>
                  </div>
                )}
                {row.status === "REJECTED" && (
                  <div className="px-5 py-2.5 bg-red-50 border-t border-red-100">
                    <p className="text-xs font-semibold text-red-600">
                      Không được tham dự — Liên hệ ban tổ chức nếu cần hỗ trợ
                    </p>
                  </div>
                )}
              </div>
            ))}

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

      {/* Detail drawer */}
      {detail && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-[#010851]/50 backdrop-blur-sm" onClick={() => setDetail(null)} role="presentation" />
          <div className="relative w-full max-w-sm bg-white h-full shadow-2xl overflow-y-auto flex flex-col">
            {/* Drawer header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100"
              style={{ background: "linear-gradient(135deg,#010851 0%,#0d1b2e 100%)" }}>
              <h3 className="font-bold text-white">Chi tiết đăng ký</h3>
              <button type="button" onClick={() => setDetail(null)} className="text-white/50 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            {detailLoading || detail.loading ? (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-slate-400 animate-pulse">Đang tải...</p>
              </div>
            ) : (
              <div className="flex-1 flex flex-col p-6 gap-5">
                {/* Tournament + status */}
                <div>

                  <ConfirmModal
                    open={!!cancelModal}
                    onCancel={() => setCancelModal(null)}
                    onConfirm={confirmCancel}
                    title="Xác nhận hủy đăng ký"
                    message="Hủy đăng ký này?"
                    confirmText="Hủy đăng ký"
                    confirmVariant="danger"
                  />
                  <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Giải đấu</p>
                  <p className="font-bold text-[#010851] text-base leading-snug">{detail.tournamentName}</p>
                  <div className="mt-2">
                    <StatusBadge status={detail.status} />
                  </div>
                </div>

                {/* Info */}
                <div className="space-y-3 text-sm border-t border-slate-100 pt-4">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Người đăng ký</span>
                    <span className="font-medium text-slate-800">{detail.playerFullName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Số điện thoại</span>
                    <span className="font-medium text-slate-800">{detail.playerPhone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Ngày đăng ký</span>
                    <span className="font-medium text-slate-800">{fmtDate(detail.createdAt)}</span>
                  </div>
                  {detail.note && (
                    <div>
                      <span className="text-slate-400 block mb-1">Ghi chú</span>
                      <span className="text-slate-700 text-xs">{detail.note}</span>
                    </div>
                  )}
                </div>

                {/* Rejection reason */}
                {detail.rejectedReason && (
                  <div className="p-4 rounded-2xl bg-red-50 border border-red-100">
                    <p className="text-xs font-bold text-red-600 uppercase tracking-wide mb-1">Lý do không được tham dự</p>
                    <p className="text-sm text-red-700">{detail.rejectedReason}</p>
                  </div>
                )}

                {/* Form field values */}
                {detail.fieldValues?.length > 0 && (
                  <div className="border-t border-slate-100 pt-4">
                    <p className="text-xs text-slate-400 uppercase tracking-wide mb-3">Thông tin đã điền</p>
                    <div className="space-y-2">
                      {detail.fieldValues.map((fv) => (
                        <div key={fv.fieldKey} className="flex flex-col gap-0.5">
                          <span className="text-xs text-slate-400">{fv.label}</span>
                          <span className="text-sm font-medium text-slate-800">{fv.value || "—"}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-col gap-2 mt-auto pt-4 border-t border-slate-100">
                  {detail.status === "PENDING_PAYMENT" && (
                    <button
                      type="button"
                      disabled={payingId === detail.id}
                      onClick={() => handlePayNow(detail.id)}
                      className="w-full py-3 rounded-2xl font-bold text-sm text-white flex items-center justify-center gap-2 transition-all hover:opacity-90"
                      style={{ background: "#EF342A" }}
                    >
                      <CreditCard size={16} />
                      {payingId === detail.id ? "Đang chuyển hướng..." : "Thanh toán ngay"}
                    </button>
                  )}
                  {detail.status === "PENDING_PAYMENT" && (
                    <button
                      type="button"
                      onClick={() => handleCancel(detail.id)}
                      className="w-full py-2.5 rounded-2xl text-sm text-red-500 border border-red-200 hover:bg-red-50 transition-colors"
                    >
                      Hủy đăng ký
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => navigate(`/player/tournaments/${detail.tournamentId}`)}
                    className="w-full py-2.5 rounded-2xl text-sm font-medium border border-slate-200 text-slate-600 hover:border-[#010851] hover:text-[#010851] transition-colors"
                  >
                    Xem chi tiết giải đấu
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MyRegistrationsPage;
