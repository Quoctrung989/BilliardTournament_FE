import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { ArrowLeft } from "lucide-react";
import AdminButton from "../../../components/admin/ui/AdminButton";
import AdminCard from "../../../components/admin/ui/AdminCard";
import AdminModal from "../../../components/admin/ui/AdminModal";
import AdminPagination from "../../../components/admin/ui/AdminPagination";
import {
  REGISTRATION_STATUS_LABELS,
  REGISTRATION_STATUS_STYLES,
} from "../../../constants/registrationFormConfig";
import { getApiErrorMessage } from "../../../utils/apiError";
import { buildListParams, DEFAULT_PAGE_SIZE } from "../../../utils/pagination";

const TournamentRegistrationListPage = ({ api, basePath }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const tournamentId = Number(id);

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [statusFilter, setStatusFilter] = useState("");
  const [detail, setDetail] = useState(null);
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await api.listTournamentRegistrations(
        tournamentId,
        buildListParams({
          page,
          size: pageSize,
          ...(statusFilter ? { status: statusFilter } : {}),
        })
      );
      setItems(result.content);
      setTotalElements(result.totalElements);
      setTotalPages(result.totalPages);
      if (result.page !== page) setPage(result.page);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [api, tournamentId, page, pageSize, statusFilter]);

  useEffect(() => {
    if (tournamentId) load();
  }, [tournamentId, load]);

  const openDetail = async (registrationId) => {
    setDetail({ id: registrationId, loading: true });
    try {
      const data = await api.getRegistrationDetail(registrationId);
      setDetail({ ...data, loading: false });
    } catch (err) {
      toast.error(getApiErrorMessage(err));
      setDetail(null);
    }
  };

  const handleApprove = async (registrationId) => {
    setActionLoading(true);
    try {
      await api.approveRegistration(registrationId);
      setItems((prev) => prev.map((it) => (it.id === registrationId ? { ...it, status: "APPROVED" } : it)));
      toast.success("Đã duyệt đăng ký");
      setDetail(null);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectModal || !rejectReason.trim()) {
      toast.warn("Nhập lý do từ chối");
      return;
    }
    setActionLoading(true);
    try {
      await api.rejectRegistration(rejectModal.id, { reason: rejectReason.trim() });
      const rejectedId = rejectModal.id;
      const reason = rejectReason.trim();
      setItems((prev) => prev.map((it) => (it.id === rejectedId ? { ...it, status: "REJECTED", rejectReason: reason } : it)));
      toast.success("Đã từ chối đăng ký");
      setRejectModal(null);
      setRejectReason("");
      setDetail(null);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <AdminButton variant="secondary" onClick={() => navigate(`${basePath}/${tournamentId}`)}>
          <ArrowLeft size={14} /> Chi tiết giải
        </AdminButton>
      </div>

      <AdminCard padding={false}>
        <div className="p-5 border-b border-slate-100">
          <div className="w-full sm:w-52">
            <label className="admin-label">Trạng thái</label>
            <select
              className="admin-select"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(0);
              }}
            >
              <option value="">Tất cả</option>
              {Object.entries(REGISTRATION_STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="admin-table-wrap">
          {loading ? (
            <div className="admin-empty">Đang tải...</div>
          ) : items.length === 0 ? (
            <div className="admin-empty">Chưa có đăng ký nào.</div>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Người đăng ký</th>
                  <th>SĐT</th>
                  <th>Loại</th>
                  <th>Trạng thái</th>
                  <th className="align-right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {items.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <span className="admin-table-name">{row.playerFullName}</span>
                    </td>
                    <td>{row.playerPhone}</td>
                    <td>{row.registrationType}</td>
                    <td>
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${REGISTRATION_STATUS_STYLES[row.status] || "bg-slate-100 text-slate-600"}`}>
                        {REGISTRATION_STATUS_LABELS[row.status] || row.status}
                      </span>
                    </td>
                    <td className="align-right">
                      <button
                        type="button"
                        className="admin-table-action admin-table-action--primary"
                        onClick={() => openDetail(row.id)}
                      >
                        Chi tiết
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <AdminPagination
          page={page}
          totalPages={totalPages}
          totalElements={totalElements}
          pageSize={pageSize}
          disabled={loading}
          onPageChange={setPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setPage(0);
          }}
        />
      </AdminCard>

      <AdminModal
        open={!!detail}
        onClose={() => setDetail(null)}
        title="Chi tiết đăng ký"
        size="lg"
        footer={
          <>
            <AdminButton variant="secondary" onClick={() => setDetail(null)}>
              Đóng
            </AdminButton>
            {detail && !detail.loading && detail.status === "PENDING_PAYMENT" && (
              <>
                <AdminButton
                  variant="danger"
                  disabled={actionLoading}
                  onClick={() => setRejectModal({ id: detail.id })}
                >
                  Từ chối
                </AdminButton>
                <AdminButton
                  variant="primary"
                  disabled={actionLoading}
                  onClick={() => handleApprove(detail.id)}
                >
                  Duyệt
                </AdminButton>
              </>
            )}
          </>
        }
      >
        {detail?.loading ? (
          <p className="animate-pulse text-gray-400">Đang tải...</p>
        ) : detail ? (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">{detail.playerFullName}</h3>
              <span className={`inline-flex mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${REGISTRATION_STATUS_STYLES[detail.status] || "bg-slate-100 text-slate-600"}`}>
                {REGISTRATION_STATUS_LABELS[detail.status] || detail.status}
              </span>
            </div>
            <dl className="text-sm space-y-2">
              <div>
                <dt className="text-slate-500">SĐT</dt>
                <dd className="font-medium text-slate-900">{detail.playerPhone}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Ghi chú</dt>
                <dd className="font-medium text-slate-900">{detail.note || "—"}</dd>
              </div>
            </dl>
            {detail.fieldValues?.length > 0 && (
              <div>
                <p className="text-xs uppercase text-slate-500 mb-2">Thông tin form</p>
                <ul className="space-y-2 text-sm">
                  {detail.fieldValues.map((fv) => (
                    <li key={fv.fieldKey} className="border-b border-slate-100 pb-2">
                      <span className="text-slate-500">{fv.label}</span>
                      <p className="font-medium text-slate-900">{fv.value}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : null}
      </AdminModal>

      <AdminModal
        open={!!rejectModal}
        onClose={() => setRejectModal(null)}
        title="Từ chối đăng ký"
        footer={
          <>
            <AdminButton variant="secondary" onClick={() => setRejectModal(null)}>
              Hủy
            </AdminButton>
            <AdminButton variant="danger" onClick={handleReject} disabled={actionLoading}>
              Xác nhận từ chối
            </AdminButton>
          </>
        }
      >
        <label className="admin-label">Lý do *</label>
        <textarea
          className="admin-input w-full mt-1 min-h-[80px]"
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
        />
      </AdminModal>
    </div>
  );
};

export default TournamentRegistrationListPage;
