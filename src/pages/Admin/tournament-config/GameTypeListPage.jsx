import { useCallback, useEffect, useState } from "react";
import { Eye, Plus } from "lucide-react";
import { toast } from "react-toastify";
import {
  createGameType,
  getGameTypes,
  patchGameTypeActive,
  updateGameType,
} from "../../../api/adminGameTypeApi";
import GameTypeForm, {
  validateGameTypeForm,
} from "../../../components/admin/tournament-config/GameTypeForm";
import GameTypeDetail from "../../../components/admin/tournament-config/GameTypeDetail";
import AdminButton from "../../../components/admin/ui/AdminButton";
import AdminCard from "../../../components/admin/ui/AdminCard";
import AdminModal from "../../../components/admin/ui/AdminModal";
import AdminPagination from "../../../components/admin/ui/AdminPagination";
import { EMPTY_GAME_TYPE_FORM, TABLE_TYPE_LABELS } from "../../../constants/gameTypeConfig";
import { getApiErrorMessage } from "../../../utils/apiError";
import { buildListParams, DEFAULT_PAGE_SIZE } from "../../../utils/pagination";

const rowToEditForm = (row) => ({
  code: row.code,
  name: row.name || "",
  description: row.description || "",
  defaultRaceTo: row.defaultRaceTo ?? "",
  compatibleTableTypes: row.compatibleTableTypes || [],
});

const GameTypeListPage = () => {
  const [gameTypes, setGameTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [activeFilter, setActiveFilter] = useState("");

  const [formMode, setFormMode] = useState(null);
  const [form, setForm] = useState(EMPTY_GAME_TYPE_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const [confirmToggle, setConfirmToggle] = useState(null);
  const [detail, setDetail] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getGameTypes(
        buildListParams({
          page,
          size: pageSize,
          ...(activeFilter === "true"
            ? { isActive: true }
            : activeFilter === "false"
              ? { isActive: false }
              : {}),
        })
      );
      setGameTypes(result.content);
      setTotalElements(result.totalElements);
      setTotalPages(result.totalPages);
      if (result.page !== page) setPage(result.page);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, activeFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const patchForm = (updates) => {
    setForm((f) => ({ ...f, ...updates }));
    setFormErrors((e) => {
      const next = { ...e };
      Object.keys(updates).forEach((k) => delete next[k]);
      return next;
    });
  };

  const openCreate = () => {
    setForm(EMPTY_GAME_TYPE_FORM);
    setFormErrors({});
    setFormMode("create");
  };

  const openEdit = (row) => {
    setForm(rowToEditForm(row));
    setFormErrors({});
    setFormMode("edit");
  };

  const closeForm = () => {
    setFormMode(null);
    setFormErrors({});
    setSaving(false);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const isCreate = formMode === "create";
    const { body, errors } = validateGameTypeForm(form, { isCreate });
    if (errors) {
      setFormErrors(errors);
      return;
    }

    setSaving(true);
    try {
      if (isCreate) {
        await createGameType(body);
        toast.success("Đã tạo loại bi");
      } else {
        await updateGameType(form.code, body);
        toast.success("Đã cập nhật loại bi");
      }
      closeForm();
      load();
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = (row) => {
    if (!row.isActive) {
      applyPatchActive(row, true);
      return;
    }
    setConfirmToggle(row);
  };

  const applyPatchActive = async (row, isActive) => {
    setSaving(true);
    try {
      await patchGameTypeActive(row.code, { isActive });
      toast.success(isActive ? "Đã kích hoạt loại bi" : "Đã tắt loại bi");
      setConfirmToggle(null);
      load();
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <p className="text-sm text-slate-600">
        Cấu hình loại bi mặc định — Owner chọn khi tạo giải. Tắt active sẽ ẩn khỏi danh sách
        chọn giải.
      </p>

      <AdminCard padding={false}>
        <div className="p-5 flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-100">
          <div className="w-full sm:w-44">
            <label className="admin-label">Trạng thái</label>
            <select
              className="admin-select"
              value={activeFilter}
              onChange={(e) => {
                setActiveFilter(e.target.value);
                setPage(0);
              }}
            >
              <option value="">Tất cả</option>
              <option value="true">Đang bật</option>
              <option value="false">Đã tắt</option>
            </select>
          </div>
          <AdminButton onClick={openCreate} className="shrink-0">
            <Plus size={18} />
            Tạo loại bi
          </AdminButton>
        </div>

        <div className="admin-table-wrap">
          {loading ? (
            <div className="admin-empty">Đang tải...</div>
          ) : gameTypes.length === 0 ? (
            <div className="admin-empty">Chưa có loại bi.</div>
          ) : (
            <table className="admin-table">
              <colgroup>
                <col style={{ width: "12%" }} />
                <col style={{ width: "18%" }} />
                <col style={{ width: "28%" }} />
                <col style={{ width: "8%" }} />
                <col style={{ width: "14%" }} />
                <col style={{ width: "8%" }} />
                <col style={{ width: "12%" }} />
              </colgroup>
              <thead>
                <tr>
                  <th>Mã</th>
                  <th>Tên hiển thị</th>
                  <th>Mô tả</th>
                  <th className="align-center">Race-to</th>
                  <th>Loại bàn</th>
                  <th className="align-center">Kích hoạt</th>
                  <th className="align-right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {gameTypes.map((row) => (
                  <tr key={row.code}>
                    <td>
                      <code className="admin-table-code">{row.code}</code>
                    </td>
                    <td>
                      <span className="admin-table-name">{row.name}</span>
                    </td>
                    <td>
                      <span className="block text-slate-600 truncate" title={row.description}>
                        {row.description || "—"}
                      </span>
                    </td>
                    <td className="align-center">
                      <span className="admin-table-num">{row.defaultRaceTo ?? "—"}</span>
                    </td>
                    <td>
                      <span className="text-xs text-slate-500">
                        {(row.compatibleTableTypes || [])
                          .map((t) => TABLE_TYPE_LABELS[t] || t)
                          .join(", ") || "—"}
                      </span>
                    </td>
                    <td className="align-center">
                      <span className="admin-table-toggle-wrap">
                        <button
                          type="button"
                          role="switch"
                          aria-checked={row.isActive}
                          className="admin-toggle"
                          data-on={row.isActive}
                          onClick={() => handleToggleActive(row)}
                        >
                          <span className="admin-toggle-knob" />
                        </button>
                      </span>
                    </td>
                    <td className="align-right">
                      <div className="admin-table-actions">
                        <button
                          type="button"
                          className="admin-table-action admin-table-action--primary"
                          onClick={() => setDetail(row)}
                        >
                          <Eye size={14} />
                          Chi tiết
                        </button>
                        <button
                          type="button"
                          className="admin-table-action admin-table-action--warning"
                          onClick={() => openEdit(row)}
                        >
                          Sửa
                        </button>
                      </div>
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
        open={!!formMode}
        onClose={closeForm}
        title={formMode === "create" ? "Tạo loại bi" : `Sửa loại bi: ${form.code}`}
        size="lg"
        footer={
          <>
            <AdminButton variant="secondary" onClick={closeForm} disabled={saving}>
              Hủy
            </AdminButton>
            <AdminButton type="submit" form="game-type-form" disabled={saving}>
              {saving ? "Đang lưu…" : formMode === "create" ? "Tạo loại bi" : "Lưu thay đổi"}
            </AdminButton>
          </>
        }
      >
        <GameTypeForm
          mode={formMode}
          form={form}
          errors={formErrors}
          onChange={patchForm}
          onSubmit={handleFormSubmit}
        />
      </AdminModal>

      <AdminModal
        open={!!confirmToggle}
        onClose={() => !saving && setConfirmToggle(null)}
        title="Tắt loại bi?"
        footer={
          <>
            <AdminButton variant="secondary" onClick={() => setConfirmToggle(null)} disabled={saving}>
              Hủy
            </AdminButton>
            <AdminButton
              variant="danger"
              onClick={() => applyPatchActive(confirmToggle, false)}
              disabled={saving}
            >
              Xác nhận tắt
            </AdminButton>
          </>
        }
      >
        Owner sẽ không chọn được &quot;{confirmToggle?.name}&quot; ({confirmToggle?.code}) khi
        tạo giải.
      </AdminModal>

      <AdminModal
        open={!!detail}
        onClose={() => setDetail(null)}
        title="Chi tiết loại bi"
        size="lg"
        footer={
          detail ? (
            <>
              <AdminButton variant="secondary" onClick={() => setDetail(null)}>
                Đóng
              </AdminButton>
              <AdminButton
                onClick={() => {
                  openEdit(detail);
                  setDetail(null);
                }}
              >
                Sửa loại bi
              </AdminButton>
            </>
          ) : null
        }
      >
        <GameTypeDetail item={detail} loading={false} />
      </AdminModal>
    </div>
  );
};

export default GameTypeListPage;
