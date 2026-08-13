import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { ArrowLeft, UserPlus, Upload, Download, Lock } from "lucide-react";
import AdminButton from "../../../components/admin/ui/AdminButton";
import AdminCard from "../../../components/admin/ui/AdminCard";
import AdminModal from "../../../components/admin/ui/AdminModal";
import ConfirmModal from "../../../components/shared/ui/ConfirmModal";
import { ownerTournamentApi, managerTournamentApi } from "../../../api/tournamentManagementApi";
import { getApiErrorMessage } from "../../../utils/apiError";
import { BILLIARD_RANK_OPTIONS, billiardRankShort } from "../../../constants/profileConfig";

const ROSTER_EDITABLE_STATUSES = ["DRAFT", "OPEN_FOR_REGISTRATION", "REGISTRATION_CLOSED"];

const EMPTY_ADD_FORM = {
  displayName: "",
  phone: "",
  partnerFullName: "",
  partnerPhone: "",
  billiardRank: "UNKNOWN",
  seedNo: "",
};

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
  const [previewData, setPreviewData] = useState(null);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [form, setForm] = useState(EMPTY_ADD_FORM);
  const [withdrawModal, setWithdrawModal] = useState(null);
  const [editSeedModal, setEditSeedModal] = useState(null);
  const [editSeedValue, setEditSeedValue] = useState("");
  const [tournamentStatus, setTournamentStatus] = useState(null);
  const [participantType, setParticipantType] = useState(null);
  const [seedingMethod, setSeedingMethod] = useState(null);
  const [maxParticipants, setMaxParticipants] = useState(null);
  const [closeRegModal, setCloseRegModal] = useState(null);
  const [closingReg, setClosingReg] = useState(false);

  const tournamentApi = basePath.startsWith("/owner") ? ownerTournamentApi : managerTournamentApi;
  const rosterEditable = tournamentStatus == null || ROSTER_EDITABLE_STATUSES.includes(tournamentStatus);
  const isDouble = participantType === "DOUBLE";
  const isSeedMethod = seedingMethod === "SEED";

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
        setSeedingMethod(tournament.configSummary?.seedingMethod ?? null);
        setMaxParticipants(tournament.maxParticipants ?? null);
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
    if (isSeedMethod && form.seedNo && Number(form.seedNo) < 1) {
      toast.warn("Số hạt giống phải từ 1 trở lên");
      return;
    }
    setActionLoading(true);
    try {
      await api.addManual(tournamentId, {
        displayName: form.displayName.trim(),
        phone: form.phone.trim() || undefined,
        partnerFullName: isDouble ? form.partnerFullName.trim() : undefined,
        partnerPhone: isDouble ? form.partnerPhone.trim() || undefined : undefined,
        billiardRank: form.billiardRank || "UNKNOWN",
        seedNo: isSeedMethod && form.seedNo ? Number(form.seedNo) : undefined,
      });
      toast.success("Đã thêm người tham gia");
      setAddModal(false);
      setForm(EMPTY_ADD_FORM);
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
      const result = await api.previewImportExcel(tournamentId, file);
      setPreviewData(result);
      setPreviewModalOpen(true);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setActionLoading(false);
      fileInputRef.current.value = "";
    }
  };

  const closePreview = () => {
    setPreviewModalOpen(false);
    setPreviewData(null);
  };

  const confirmPreview = async () => {
    if (!previewData?.rows?.length) return;
    setConfirming(true);
    try {
      const rows = previewData.rows.map((r) => ({
        name1: r.name1,
        phone1: r.phone1,
        name2: r.name2,
        phone2: r.phone2,
        billiardRank: r.billiardRank,
        seedNo: r.seedNo,
      }));
      const result = await api.confirmImportExcel(tournamentId, rows);
      setImportResult(result);
      closePreview();
      load();
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setConfirming(false);
    }
  };

  const handleWithdraw = async (participantId, name) => {
    setWithdrawModal({ participantId, name });
  };

  const openEditSeed = (participant) => {
    setEditSeedModal(participant);
    setEditSeedValue(participant.seedNo != null ? String(participant.seedNo) : "");
  };

  const confirmEditSeed = async () => {
    if (!editSeedModal) return;
    if (editSeedValue && Number(editSeedValue) < 1) {
      toast.warn("Số hạt giống phải từ 1 trở lên");
      return;
    }
    setActionLoading(true);
    try {
      const seedNo = editSeedValue ? Number(editSeedValue) : null;
      await api.updateSeedNo(editSeedModal.id, seedNo);
      toast.success("Đã cập nhật hạt giống");
      setEditSeedModal(null);
      load();
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  const confirmWithdraw = async () => {
    if (!withdrawModal) return;
    setActionLoading(true);
    try {
      await api.withdraw(withdrawModal.participantId);
      setItems((prev) => prev.map((p) => (p.id === withdrawModal.participantId ? { ...p, status: "WITHDRAWN" } : p)));
      toast.success("Đã rút lui");
      setWithdrawModal(null);
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

  const isOpenReg = tournamentStatus === "OPEN_FOR_REGISTRATION";

  /**
   * Mở modal xác nhận đóng đăng ký, mức cảnh báo tuỳ theo số người hiện có.
   *
   * Đếm theo participant ACTIVE đang hiển thị trên bảng chứ không theo số đơn
   * đăng ký — vì đây mới là danh sách thật sự đi vào bốc thăm, và nó gồm cả
   * người được thêm thủ công lẫn import từ Excel.
   */
  const askCloseRegistration = () => {
    const missing = maxParticipants != null ? maxParticipants - active : 0;

    // Dưới 2 người thì không bốc thăm được — giải sẽ mắc kẹt ở trạng thái đã
    // đóng đăng ký mà không đi tiếp được, nên cảnh báo nặng hơn hẳn.
    if (active < 2) {
      setCloseRegModal({
        message: `Giải mới có ${active} người tham gia.`,
        details:
          "Cần tối thiểu 2 người mới bốc thăm và sinh bracket được. Đóng đăng ký bây giờ thì giải sẽ không đi tiếp được cho tới khi bạn thêm người hoặc mở lại đăng ký.",
        danger: true,
      });
      return;
    }

    if (missing > 0) {
      setCloseRegModal({
        message: `Giải mới có ${active}/${maxParticipants} người, còn thiếu ${missing} suất.`,
        details:
          "Đóng đăng ký bây giờ nghĩa là giải sẽ thi đấu với đúng số người hiện tại. Người chơi mới sẽ không đăng ký được nữa.",
        danger: true,
      });
      return;
    }

    setCloseRegModal({ message: "Đóng đăng ký giải này?", danger: false });
  };

  const confirmCloseRegistration = async () => {
    setClosingReg(true);
    try {
      await tournamentApi.patchStatus(tournamentId, { status: "REGISTRATION_CLOSED" });
      toast.success("Đã đóng đăng ký giải đấu");
      setCloseRegModal(null);
      await load();
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setClosingReg(false);
    }
  };
  const ranked = items.filter(
    (p) => p.status === "ACTIVE" && p.billiardRank && p.billiardRank !== "UNKNOWN"
  ).length;

  return (
    <div className="space-y-5">
      {/* Back */}
      <AdminButton variant="secondary" onClick={() => navigate(`${basePath}/${tournamentId}`)}>
        <ArrowLeft size={14} /> Chi tiết giải
      </AdminButton>

      <AdminCard padding={false}>
        <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-white/10">
          <div>
            <h2 className="font-semibold text-slate-900 dark:text-white">
              Người tham gia chính thức
            </h2>
            <p className="text-xs text-slate-400 dark:text-white/40 mt-0.5">
              {active} ACTIVE · {items.length} tổng · {ranked} đã có hạng
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
                {/* Chỉ hiện khi giải đang mở đăng ký — các trạng thái khác đã chốt sổ rồi */}
                {isOpenReg && (
                  <AdminButton
                    variant="secondary"
                    disabled={closingReg}
                    onClick={askCloseRegistration}
                    className="flex items-center gap-1.5"
                  >
                    <Lock size={15} />
                    Đóng đăng ký
                  </AdminButton>
                )}
              </>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-xs text-slate-400 dark:text-white/40 px-3 py-2 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10">
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
                  <th>Hạng</th>
                  {isSeedMethod && <th>Hạt giống</th>}
                  <th>Nguồn</th>
                  <th>Trạng thái</th>
                  <th className="align-right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {items.map((p, idx) => (
                  <tr key={p.id} className={p.status === "WITHDRAWN" ? "opacity-50" : ""}>
                    <td className="text-slate-400 dark:text-white/40">{idx + 1}</td>
                    <td>
                      <span className="admin-table-name" title={p.displayName}>{p.displayName}</span>
                    </td>
                    <td>{p.phone || "—"}</td>
                    <td>
                      <span className="text-xs font-semibold text-slate-700 dark:text-white/75">
                        {billiardRankShort(p.billiardRank)}
                      </span>
                    </td>
                    {isSeedMethod && (
                      <td className="text-xs font-semibold text-slate-700 dark:text-white/75">
                        {rosterEditable && p.status === "ACTIVE" ? (
                          <button
                            type="button"
                            className="hover:underline decoration-dotted underline-offset-2"
                            title="Sửa số hạt giống"
                            onClick={() => openEditSeed(p)}
                          >
                            {p.seedNo ?? "—"}
                          </button>
                        ) : (
                          p.seedNo ?? "—"
                        )}
                      </td>
                    )}
                    <td>
                      <span className="text-xs text-slate-500 dark:text-white/60">
                        {SOURCE_LABELS[p.source] || p.source}
                      </span>
                    </td>
                    <td>
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[p.status] || "bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-white/70"}`}>
                        {p.status === "ACTIVE" ? "Tham gia" : "Rút lui"}
                      </span>
                    </td>
                    <td className="align-right">
                      <div className="admin-table-actions">
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
                      </div>
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
              <p className="font-semibold text-slate-900 dark:text-white mb-1">Kết quả import</p>
              <p className="text-sm text-slate-600 dark:text-white/70">
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
              className="text-slate-400 dark:text-white/40 hover:text-slate-600 dark:hover:text-white/70 text-xs"
              onClick={() => setImportResult(null)}
            >
              Đóng
            </button>
          </div>
        </AdminCard>
      )}

      {/* Import preview / confirm modal */}
      <AdminModal
        open={previewModalOpen}
        onClose={closePreview}
        title="Xem trước import"
        size="lg"
        footer={
          <>
            <AdminButton variant="secondary" onClick={closePreview} disabled={confirming}>
              Hủy
            </AdminButton>
            <AdminButton
              variant="primary"
              onClick={confirmPreview}
              disabled={confirming || !previewData?.validCount}
            >
              {confirming ? "Đang xác nhận..." : `Xác nhận (${previewData?.validCount ?? 0} hợp lệ)`}
            </AdminButton>
          </>
        }
      >
        {previewData && (
          <div className="space-y-3">
            <p className="text-sm text-slate-600 dark:text-white/70">
              Tổng <strong>{previewData.totalRows}</strong> dòng ·{" "}
              <span className="text-emerald-600">{previewData.validCount} hợp lệ</span> ·{" "}
              <span className="text-red-600">{previewData.invalidCount} lỗi</span>
            </p>
            <div className="admin-table-wrap max-h-[50vh] overflow-y-auto">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Hàng</th>
                    <th>{isDouble ? "Tên VĐV 1" : "Tên hiển thị"}</th>
                    <th>SĐT{isDouble ? " VĐV 1" : ""}</th>
                    {isDouble && <th>Tên VĐV 2</th>}
                    {isDouble && <th>SĐT VĐV 2</th>}
                    <th>Hạng</th>
                    {isSeedMethod && <th>Hạt giống</th>}
                    <th>Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {previewData.rows.map((r) => (
                    <tr key={r.rowNo} className={r.valid ? "" : "bg-red-50"}>
                      <td className="text-slate-400 dark:text-white/40">{r.rowNo}</td>
                      <td>{r.name1 || "—"}</td>
                      <td>{r.phone1 || "—"}</td>
                      {isDouble && <td>{r.name2 || "—"}</td>}
                      {isDouble && <td>{r.phone2 || "—"}</td>}
                      <td>{billiardRankShort(r.billiardRank)}</td>
                      {isSeedMethod && <td>{r.seedNo ?? "—"}</td>}
                      <td>
                        {r.valid ? (
                          <span className="text-emerald-600 text-xs font-medium">✓ Hợp lệ</span>
                        ) : (
                          <span className="text-red-600 text-xs">{r.error}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </AdminModal>

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
          </div>
          <div>
            <label className="admin-label">Hạng cơ thủ</label>
            <select
              className="admin-input w-full mt-1"
              value={form.billiardRank}
              onChange={(e) => setForm((f) => ({ ...f, billiardRank: e.target.value }))}
            >
              {BILLIARD_RANK_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <p className="text-xs text-slate-400 dark:text-white/40 mt-1">
              Dùng để xếp cặp khi giải chọn phương thức "Theo hạng cơ thủ". Để "Chưa xếp hạng" nếu
              không rõ trình độ.
            </p>
          </div>
          {isSeedMethod && (
            <div>
              <label className="admin-label">Hạt giống</label>
              <input
                type="number"
                min={1}
                className="admin-input w-full mt-1"
                placeholder="VD: 1 (mạnh nhất)"
                value={form.seedNo}
                onChange={(e) => setForm((f) => ({ ...f, seedNo: e.target.value }))}
              />
              <p className="text-xs text-slate-400 dark:text-white/40 mt-1">
                Số hạt giống (1 = mạnh nhất), mỗi số chỉ gán cho đúng 1 người trong giải. Để trống
                nếu không xếp — người này sẽ bốc thăm ngẫu nhiên với nhóm chưa xếp hạt giống.
              </p>
            </div>
          )}
          {isDouble && (
            <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-100 dark:border-white/10">
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
          <p className="text-xs text-slate-400 dark:text-white/40">
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

      {/* Edit seed number modal */}
      <AdminModal
        open={!!editSeedModal}
        onClose={() => setEditSeedModal(null)}
        title="Sửa số hạt giống"
        footer={
          <>
            <AdminButton variant="secondary" onClick={() => setEditSeedModal(null)} disabled={actionLoading}>
              Hủy
            </AdminButton>
            <AdminButton variant="primary" onClick={confirmEditSeed} disabled={actionLoading}>
              {actionLoading ? "Đang lưu..." : "Lưu"}
            </AdminButton>
          </>
        }
      >
        {editSeedModal && (
          <div className="space-y-2">
            <p className="text-sm text-slate-600 dark:text-white/70">
              {editSeedModal.displayName}
            </p>
            <input
              type="number"
              min={1}
              autoFocus
              className="admin-input w-full"
              placeholder="Để trống nếu không xếp hạt giống"
              value={editSeedValue}
              onChange={(e) => setEditSeedValue(e.target.value)}
            />
            <p className="text-xs text-slate-400 dark:text-white/40">
              Mỗi số hạt giống chỉ gán cho đúng 1 người trong giải. Chỉ sửa được khi giải chưa bốc thăm.
            </p>
          </div>
        )}
      </AdminModal>

      <ConfirmModal
        open={!!closeRegModal}
        onCancel={() => setCloseRegModal(null)}
        onConfirm={confirmCloseRegistration}
        title={closeRegModal?.danger ? "Bạn có chắc chắn?" : "Xác nhận thao tác"}
        message={closeRegModal?.message || ""}
        details={closeRegModal?.details}
        confirmText={closeRegModal?.danger ? "Vẫn đóng đăng ký" : "Xác nhận"}
        confirmVariant={closeRegModal?.danger ? "danger" : "primary"}
        loading={closingReg}
      />
    </div>
  );
};

export default ParticipantListPage;
