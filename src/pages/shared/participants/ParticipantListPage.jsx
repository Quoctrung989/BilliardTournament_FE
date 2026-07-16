import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { UserPlus, Upload, Download, Lock } from "lucide-react";
import AdminButton from "../../../components/admin/ui/AdminButton";
import AdminCard from "../../../components/admin/ui/AdminCard";
import AdminModal from "../../../components/admin/ui/AdminModal";
import ConfirmModal from "../../../components/shared/ui/ConfirmModal";
import { ownerTournamentApi, managerTournamentApi } from "../../../api/tournamentManagementApi";
import { getApiErrorMessage } from "../../../utils/apiError";

const ROSTER_EDITABLE_STATUSES = ["DRAFT", "OPEN_FOR_REGISTRATION", "REGISTRATION_CLOSED"];

const STATUS_STYLES = {
  ACTIVE: "bg-emerald-100 text-emerald-800",
  WITHDRAWN: "bg-red-100 text-red-700",
};

const SOURCE_LABELS = {
  ONLINE_REGISTRATION: "Đăng ký online",
  MANUAL: "Thêm thủ công",
};

const ParticipantListPage = ({ api, basePath }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const tournamentId = Number(id);
  const fileInputRef = useRef();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addModal, setAddModal] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [form, setForm] = useState({ displayName: "", phone: "", partnerFullName: "", partnerPhone: "", seedNo: "" });
  const [withdrawModal, setWithdrawModal] = useState(null);
  const [tournamentStatus, setTournamentStatus] = useState(null);
  const [participantType, setParticipantType] = useState(null);

  const tournamentApi = basePath.startsWith("/owner") ? ownerTournamentApi : managerTournamentApi;
  const rosterEditable = tournamentStatus == null || ROSTER_EDITABLE_STATUSES.includes(tournamentStatus);
  const isDouble = participantType === "DOUBLE";

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [data, tournament] = await Promise.all([
        api.listParticipants(tournamentId),
        tournamentApi.getTournament(tournamentId).catch(() => null),
      ]);
      setItems(Array.isArray(data) ? data : []);
      if (tournament) {
        setTournamentStatus(tournament.status);
        setParticipantType(tournament.participantType);
      }
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [api, tournamentApi, tournamentId]);

  useEffect(() => { load(); }, [load]);

  const handleAdd = async () => {
    if (!form.displayName.trim()) {
      toast.warn(isDouble ? "Vui lòng nhập tên người chơi 1" : "Vui lòng nhập tên hiển thị");
      return;
    }
    if (isDouble && !form.partnerFullName.trim()) {
      toast.warn("Vui lòng nhập tên người chơi 2");
      return;
    }
    const seedNo = form.seedNo.trim() ? Number(form.seedNo) : undefined;
    if (seedNo !== undefined && (isNaN(seedNo) || seedNo < 1)) {
      toast.warn("Hạt giống phải là số nguyên từ 1 trở lên");
      return;
    }
    setActionLoading(true);
    try {
      await api.addManual(tournamentId, {
        displayName: form.displayName.trim(),
        phone: form.phone.trim() || undefined,
        partnerFullName: isDouble ? form.partnerFullName.trim() : undefined,
        partnerPhone: isDouble ? form.partnerPhone.trim() || undefined : undefined,
        seedNo: seedNo,
      });
      toast.success("Đã thêm người tham gia");
      setAddModal(false);
      setForm({ displayName: "", phone: "", partnerFullName: "", partnerPhone: "", seedNo: "" });
      load();
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setActionLoading(true);
    try {
      const result = await api.importExcel(tournamentId, file);
      setImportResult(result);
      load();
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setActionLoading(false);
      fileInputRef.current.value = "";
    }
  };

  const handleWithdraw = async (participantId, name) => {
    setWithdrawModal({ participantId, name });
  };

  const confirmWithdraw = async () => {
    if (!withdrawModal) return;
    setActionLoading(true);
    try {
      await api.withdraw(withdrawModal.participantId);
      toast.success("Đã rút lui");
      setWithdrawModal(null);
      load();
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  const downloadTemplate = async () => {
    try {
      await api.downloadImportTemplate(tournamentId);
    } catch {
      toast.error("Tải template thất bại");
    }
  };

  const active = items.filter((p) => p.status === "ACTIVE").length;
  const seeded = items.filter((p) => p.status === "ACTIVE" && p.seedNo != null).length;

  return (
    <div className="space-y-5">
      {/* Back */}
      <AdminButton variant="secondary" onClick={() => navigate(`${basePath}/${tournamentId}`)}>
        ← Chi tiết giải
      </AdminButton>

      <AdminCard padding={false}>
        <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100">
          <div>
            <h2 className="font-semibold text-slate-900">
              Người tham gia chính thức
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {active} ACTIVE · {items.length} tổng · {seeded} có hạt giống
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <AdminButton
              variant="secondary"
              onClick={downloadTemplate}
              className="flex items-center gap-1.5"
            >
              <Download size={15} />
              Tải template
            </AdminButton>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={handleImport}
            />
            {rosterEditable ? (
              <>
                <AdminButton
                  variant="secondary"
                  disabled={actionLoading}
                  onClick={() => fileInputRef.current.click()}
                  className="flex items-center gap-1.5"
                >
                  <Upload size={15} />
                  Import Excel
                </AdminButton>
                <AdminButton
                  variant="primary"
                  onClick={() => setAddModal(true)}
                  className="flex items-center gap-1.5"
                >
                  <UserPlus size={15} />
                  Thêm thủ công
                </AdminButton>
              </>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-xs text-slate-400 px-3 py-2 rounded-lg bg-slate-50 border border-slate-100">
                <Lock size={13} />
                Giải đã lên bracket — không thể thêm người tham gia mới
              </span>
            )}
          </div>
        </div>

        <div className="admin-table-wrap">
          {loading ? (
            <div className="admin-empty">Đang tải...</div>
          ) : items.length === 0 ? (
            <div className="admin-empty">
              {rosterEditable
                ? "Chưa có người tham gia. Dùng \"Thêm thủ công\" hoặc \"Import Excel\"."
                : "Chưa có người tham gia."}
            </div>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Tên hiển thị</th>
                  <th>Số điện thoại</th>
                  <th>Hạt giống</th>
                  <th>Nguồn</th>
                  <th>Trạng thái</th>
                  <th className="text-right pr-4">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {items.map((p, idx) => (
                  <tr key={p.id} className={p.status === "WITHDRAWN" ? "opacity-50" : ""}>
                    <td className="text-slate-400">{idx + 1}</td>
                    <td className="font-medium">{p.displayName}</td>
                    <td>{p.phone || "—"}</td>
                    <td>{p.seedNo ?? "—"}</td>
                    <td>
                      <span className="text-xs text-slate-500">
                        {SOURCE_LABELS[p.source] || p.source}
                      </span>
                    </td>
                    <td>
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[p.status] || "bg-slate-100 text-slate-600"}`}>
                        {p.status === "ACTIVE" ? "Tham gia" : "Rút lui"}
                      </span>
                    </td>
                    <td className="text-right pr-4">
                      {p.status === "ACTIVE" && (
                        <button
                          type="button"
                          className="admin-table-action text-red-500"
                          disabled={actionLoading}
                          onClick={() => handleWithdraw(p.id, p.displayName)}
                        >
                          Rút lui
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </AdminCard>

      {/* Import result */}
      {importResult && (
        <AdminCard>
          <div className="flex justify-between items-start">
            <div>
              <p className="font-semibold text-slate-900 mb-1">Kết quả import</p>
              <p className="text-sm text-slate-600">
                ✓ Import thành công: <strong>{importResult.imported}</strong> người ·
                Bỏ qua: <strong>{importResult.skipped}</strong>
              </p>
              {importResult.errors?.length > 0 && (
                <ul className="mt-2 text-xs text-red-600 space-y-0.5">
                  {importResult.errors.map((e, i) => <li key={i}>• {e}</li>)}
                </ul>
              )}
            </div>
            <button
              type="button"
              className="text-slate-400 hover:text-slate-600 text-xs"
              onClick={() => setImportResult(null)}
            >
              Đóng
            </button>
          </div>
        </AdminCard>
      )}

      {/* Add manual modal */}
      <AdminModal
        open={addModal}
        onClose={() => setAddModal(false)}
        title="Thêm người tham gia thủ công"
        footer={
          <>
            <AdminButton variant="secondary" onClick={() => setAddModal(false)}>Hủy</AdminButton>
            <AdminButton variant="primary" onClick={handleAdd} disabled={actionLoading}>
              {actionLoading ? "Đang thêm..." : "Thêm"}
            </AdminButton>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="admin-label">{isDouble ? "Tên người chơi 1 *" : "Tên hiển thị *"}</label>
            <input
              className="admin-input w-full mt-1"
              placeholder="Nguyễn Văn A"
              value={form.displayName}
              onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="admin-label">{isDouble ? "SĐT người chơi 1" : "Số điện thoại"}</label>
              <input
                className="admin-input w-full mt-1"
                placeholder="0901234567"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              />
            </div>
            <div>
              <label className="admin-label">Hạt giống</label>
              <input
                type="number"
                min={1}
                className="admin-input w-full mt-1"
                placeholder="1, 2, 3..."
                value={form.seedNo}
                onChange={(e) => setForm((f) => ({ ...f, seedNo: e.target.value }))}
              />
            </div>
          </div>
          {isDouble && (
            <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-100">
              <div className="col-span-2 -mb-1 mt-3">
                <label className="admin-label">Người chơi 2</label>
              </div>
              <div>
                <input
                  className="admin-input w-full"
                  placeholder="Tên người chơi 2 *"
                  value={form.partnerFullName}
                  onChange={(e) => setForm((f) => ({ ...f, partnerFullName: e.target.value }))}
                />
              </div>
              <div>
                <input
                  className="admin-input w-full"
                  placeholder="SĐT người chơi 2"
                  value={form.partnerPhone}
                  onChange={(e) => setForm((f) => ({ ...f, partnerPhone: e.target.value }))}
                />
              </div>
            </div>
          )}
          <p className="text-xs text-slate-400">
            Import nhiều người cùng lúc → dùng nút "Import Excel". Tải template từ nút bên phải.
          </p>
        </div>
      </AdminModal>

      <ConfirmModal
        open={!!withdrawModal}
        onCancel={() => setWithdrawModal(null)}
        onConfirm={confirmWithdraw}
        title="Xác nhận rút lui"
        message={withdrawModal ? `Rút lui "${withdrawModal.name}" khỏi giải?` : ""}
        confirmText="Rút lui"
        confirmVariant="danger"
        loading={actionLoading}
      />
    </div>
  );
};

export default ParticipantListPage;
