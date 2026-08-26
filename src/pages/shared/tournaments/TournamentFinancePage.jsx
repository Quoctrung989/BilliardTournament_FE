import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useGoBack } from "../../../hooks/useGoBack";
import { toast } from "react-toastify";
import { ArrowLeft, Plus, Pencil, Trash2, Lock } from "lucide-react";
import AdminButton from "../../../components/admin/ui/AdminButton";
import AdminCard from "../../../components/admin/ui/AdminCard";
import AdminModal from "../../../components/admin/ui/AdminModal";
import ConfirmModal from "../../../components/shared/ui/ConfirmModal";
import { ownerFinanceApi, managerFinanceApi } from "../../../api/financeApi";
import { getApiErrorMessage } from "../../../utils/apiError";
import { formatVND } from "../../../utils/helpers";

/** Khớp assertMutable() bên BE — giải Hoàn thành/Đã hủy khóa sổ thu/chi, không cho thêm/sửa/xóa. */
const FINANCE_LOCKED_STATUSES = ["COMPLETED", "CANCELLED"];

const EMPTY_FORM = {
  entryType: "INCOME",
  label: "",
  amount: "",
  occurredAt: new Date().toISOString().slice(0, 10),
  note: "",
};

const fmtDate = (iso) => {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return "—";
  }
};

const TournamentFinancePage = ({ api, basePath }) => {
  const { id } = useParams();
  const tournamentId = Number(id);
  const goBack = useGoBack(`${basePath}/${id}`);
  const financeApi = basePath.startsWith("/owner") ? ownerFinanceApi : managerFinanceApi;

  const [tournamentName, setTournamentName] = useState("");
  const [tournamentStatus, setTournamentStatus] = useState(null);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formModal, setFormModal] = useState(null); // null | { mode: "add" } | { mode: "edit", entry }
  const [form, setForm] = useState(EMPTY_FORM);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [filterType, setFilterType] = useState("");
  const [filterSearch, setFilterSearch] = useState("");
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [data, tournament] = await Promise.all([
        financeApi.getSummary(tournamentId),
        api?.getTournament ? api.getTournament(tournamentId).catch(() => null) : Promise.resolve(null),
      ]);
      setSummary(data);
      if (tournament) {
        setTournamentName(tournament.name);
        setTournamentStatus(tournament.status);
      }
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [api, financeApi, tournamentId]);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => {
    setForm(EMPTY_FORM);
    setFormModal({ mode: "add" });
  };

  const openEdit = (entry) => {
    setForm({
      entryType: entry.entryType,
      label: entry.label,
      amount: String(entry.amount ?? ""),
      occurredAt: entry.occurredAt ? entry.occurredAt.slice(0, 10) : EMPTY_FORM.occurredAt,
      note: entry.note || "",
    });
    setFormModal({ mode: "edit", entry });
  };

  const handleSave = async () => {
    if (!form.label.trim()) {
      toast.warn("Vui lòng nhập nội dung khoản thu/chi");
      return;
    }
    const amount = Number(form.amount);
    if (!amount || amount <= 0) {
      toast.warn("Số tiền phải lớn hơn 0");
      return;
    }
    setSaving(true);
    try {
      const body = {
        entryType: form.entryType,
        label: form.label.trim(),
        amount,
        note: form.note.trim() || undefined,
        occurredAt: form.occurredAt ? new Date(form.occurredAt).toISOString() : undefined,
      };
      if (formModal.mode === "edit") {
        await financeApi.updateEntry(tournamentId, formModal.entry.id, body);
        toast.success("Đã cập nhật khoản thu/chi");
      } else {
        await financeApi.createEntry(tournamentId, body);
        toast.success("Đã thêm khoản thu/chi");
      }
      setFormModal(null);
      load();
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await financeApi.deleteEntry(tournamentId, deleteTarget.id);
      toast.success("Đã xóa khoản thu/chi");
      setDeleteTarget(null);
      load();
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  const entries = useMemo(() => summary?.entries || [], [summary]);
  const netAmount = summary?.netAmount ?? 0;

  /** Lọc client-side — danh sách 1 giải luôn nhỏ, không cần round-trip API. Không đụng vào các
   * card tổng thu/chi phía trên (đó là tổng thật của cả giải, không phải tổng theo bộ lọc). */
  const filteredEntries = useMemo(() => {
    const search = filterSearch.trim().toLowerCase();
    const from = filterFrom ? new Date(filterFrom) : null;
    const to = filterTo ? new Date(filterTo) : null;
    return entries.filter((e) => {
      if (filterType && e.entryType !== filterType) return false;
      if (search && !e.label.toLowerCase().includes(search) && !(e.note || "").toLowerCase().includes(search)) {
        return false;
      }
      if (e.occurredAt) {
        const occurred = new Date(e.occurredAt);
        if (from && occurred < from) return false;
        if (to && occurred > new Date(to.getTime() + 24 * 60 * 60 * 1000 - 1)) return false;
      }
      return true;
    });
  }, [entries, filterType, filterSearch, filterFrom, filterTo]);

  const hasActiveFilter = !!(filterType || filterSearch || filterFrom || filterTo);
  const resetFilters = () => {
    setFilterType("");
    setFilterSearch("");
    setFilterFrom("");
    setFilterTo("");
  };

  const financeLocked = FINANCE_LOCKED_STATUSES.includes(tournamentStatus);

  return (
    <div className="space-y-5">
      <AdminButton variant="secondary" onClick={goBack}>
        <ArrowLeft size={14} /> Quay lại
      </AdminButton>

      <AdminCard>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              Thu chi giải đấu
            </h2>
            {tournamentName && (
              <p className="text-sm text-slate-500 dark:text-white/60 mt-0.5">{tournamentName}</p>
            )}
            <p className="text-xs text-slate-400 dark:text-white/40 mt-1 max-w-2xl">
              Ghi nhận các khoản thu/chi ngoài tiền đăng ký — tiền tài trợ, quyên góp, thuê thêm
              bàn, in ấn, giải thưởng phụ... Tự nhập nội dung, hệ thống không giới hạn danh mục.
            </p>
          </div>
          {financeLocked ? (
            <span className="inline-flex items-center gap-1.5 text-xs text-slate-400 dark:text-white/40 px-3 py-2 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 shrink-0">
              <Lock size={13} />
              Giải đã kết thúc/hủy — sổ thu chi đã khóa
            </span>
          ) : (
            <AdminButton variant="primary" onClick={openAdd} className="flex items-center gap-1.5 shrink-0">
              <Plus size={15} />
              Thêm khoản thu/chi
            </AdminButton>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-500/10 dark:border-emerald-500/30 p-4">
            <p className="text-xs uppercase tracking-wide text-emerald-700 dark:text-emerald-300">Tổng thu</p>
            <p className="text-xl font-bold text-emerald-700 dark:text-emerald-300 mt-1">
              {formatVND(summary?.totalIncome || 0)}
            </p>
          </div>
          <div className="rounded-xl border border-rose-200 bg-rose-50 dark:bg-rose-500/10 dark:border-rose-500/30 p-4">
            <p className="text-xs uppercase tracking-wide text-rose-700 dark:text-rose-300">Tổng chi</p>
            <p className="text-xl font-bold text-rose-700 dark:text-rose-300 mt-1">
              {formatVND(summary?.totalExpense || 0)}
            </p>
          </div>
          <div className={`rounded-xl border p-4 ${
            netAmount < 0
              ? "border-rose-200 bg-rose-50 dark:bg-rose-500/10 dark:border-rose-500/30"
              : "border-slate-200 bg-slate-50 dark:bg-white/5 dark:border-white/10"
          }`}>
            <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-white/60">Chênh lệch</p>
            <p className={`text-xl font-bold mt-1 ${netAmount < 0 ? "text-rose-600" : "text-slate-800 dark:text-white"}`}>
              {formatVND(netAmount)}
            </p>
          </div>
        </div>
      </AdminCard>

      <AdminCard>
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[200px]">
            <label className="admin-label">Tìm theo nội dung/ghi chú</label>
            <input
              className="admin-input w-full mt-1"
              placeholder="VD: tài trợ, thuê bàn..."
              value={filterSearch}
              onChange={(e) => setFilterSearch(e.target.value)}
            />
          </div>
          <div className="w-full sm:w-40">
            <label className="admin-label">Loại</label>
            <select
              className="admin-select w-full mt-1"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="">Tất cả</option>
              <option value="INCOME">Khoản thu</option>
              <option value="EXPENSE">Khoản chi</option>
            </select>
          </div>
          <div className="w-full sm:w-40">
            <label className="admin-label">Từ ngày</label>
            <input
              type="date"
              className="admin-input w-full mt-1"
              value={filterFrom}
              onChange={(e) => setFilterFrom(e.target.value)}
            />
          </div>
          <div className="w-full sm:w-40">
            <label className="admin-label">Đến ngày</label>
            <input
              type="date"
              className="admin-input w-full mt-1"
              value={filterTo}
              onChange={(e) => setFilterTo(e.target.value)}
            />
          </div>
          {hasActiveFilter && (
            <AdminButton variant="secondary" onClick={resetFilters}>
              Xóa lọc
            </AdminButton>
          )}
        </div>
      </AdminCard>

      <AdminCard padding={false}>
        <div className="admin-table-wrap">
          {loading ? (
            <div className="admin-empty">Đang tải...</div>
          ) : entries.length === 0 ? (
            <div className="admin-empty">
              {financeLocked
                ? "Giải đã kết thúc/hủy — không có khoản thu/chi nào được ghi nhận."
                : 'Chưa có khoản thu/chi nào. Nhấn "Thêm khoản thu/chi" để bắt đầu.'}
            </div>
          ) : filteredEntries.length === 0 ? (
            <div className="admin-empty">
              Không có khoản nào khớp bộ lọc.
            </div>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Loại</th>
                  <th>Nội dung</th>
                  <th>Ngày</th>
                  <th className="align-right">Số tiền</th>
                  <th>Ghi chú</th>
                  <th>Người tạo</th>
                  <th className="align-right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredEntries.map((e) => (
                  <tr key={e.id}>
                    <td>
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
                        e.entryType === "INCOME"
                          ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                          : "bg-rose-50 text-rose-700 ring-1 ring-rose-200"
                      }`}>
                        {e.entryTypeLabel}
                      </span>
                    </td>
                    <td className="text-sm text-slate-700 dark:text-white/75">{e.label}</td>
                    <td className="text-sm text-slate-500 dark:text-white/60">{fmtDate(e.occurredAt)}</td>
                    <td className={`align-right text-sm font-semibold ${
                      e.entryType === "INCOME" ? "text-emerald-700" : "text-rose-600"
                    }`}>
                      {e.entryType === "INCOME" ? "+" : "-"}{formatVND(e.amount)}
                    </td>
                    <td className="text-sm text-slate-500 dark:text-white/60 max-w-xs truncate" title={e.note}>
                      {e.note || "—"}
                    </td>
                    <td className="text-sm text-slate-500 dark:text-white/60">{e.createdByName || "—"}</td>
                    <td className="align-right">
                      {financeLocked ? (
                        <span className="text-xs text-slate-300 dark:text-white/30">—</span>
                      ) : (
                        <div className="inline-flex gap-1.5">
                          <button
                            type="button"
                            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-slate-500 dark:text-white/60"
                            title="Sửa"
                            onClick={() => openEdit(e)}
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            type="button"
                            className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/10 text-rose-500"
                            title="Xóa"
                            onClick={() => setDeleteTarget(e)}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </AdminCard>

      <AdminModal
        open={!!formModal}
        onClose={() => setFormModal(null)}
        title={formModal?.mode === "edit" ? "Sửa khoản thu/chi" : "Thêm khoản thu/chi"}
        footer={
          <>
            <AdminButton variant="secondary" onClick={() => setFormModal(null)} disabled={saving}>
              Hủy
            </AdminButton>
            <AdminButton variant="primary" onClick={handleSave} disabled={saving}>
              {saving ? "Đang lưu..." : "Lưu"}
            </AdminButton>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="admin-label">Loại *</label>
            <select
              className="admin-select w-full mt-1"
              value={form.entryType}
              onChange={(e) => setForm((f) => ({ ...f, entryType: e.target.value }))}
            >
              <option value="INCOME">Khoản thu</option>
              <option value="EXPENSE">Khoản chi</option>
            </select>
          </div>
          <div>
            <label className="admin-label">Nội dung *</label>
            <input
              className="admin-input w-full mt-1"
              placeholder="VD: Tiền tài trợ CLB ABC, Thuê bàn thêm..."
              value={form.label}
              onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="admin-label">Số tiền (đ) *</label>
              <input
                type="number"
                min={0}
                className="admin-input w-full mt-1"
                placeholder="500000"
                value={form.amount}
                onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
              />
            </div>
            <div>
              <label className="admin-label">Ngày phát sinh</label>
              <input
                type="date"
                className="admin-input w-full mt-1"
                value={form.occurredAt}
                onChange={(e) => setForm((f) => ({ ...f, occurredAt: e.target.value }))}
              />
            </div>
          </div>
          <div>
            <label className="admin-label">Ghi chú</label>
            <textarea
              className="admin-input w-full mt-1"
              rows={2}
              placeholder="Không bắt buộc"
              value={form.note}
              onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
            />
          </div>
        </div>
      </AdminModal>

      <ConfirmModal
        open={!!deleteTarget}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Xóa khoản thu/chi"
        message={deleteTarget ? `Xóa khoản "${deleteTarget.label}"?` : ""}
        confirmText="Xóa"
        confirmVariant="danger"
        loading={deleting}
      />
    </div>
  );
};

export default TournamentFinancePage;
