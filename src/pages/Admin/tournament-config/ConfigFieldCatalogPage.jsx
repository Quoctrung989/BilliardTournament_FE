import { useCallback, useEffect, useState } from "react";
import { Eye, Pencil, Plus } from "lucide-react";
import { toast } from "react-toastify";
import {
  createCatalogItem,
  getCatalog,
  getCatalogItem,
  patchCatalogItemActive,
  updateCatalogItem,
} from "../../../api/adminConfigFieldApi";
import ConfigFieldCatalogForm from "../../../components/admin/tournament-config/ConfigFieldCatalogForm";
import ConfigFieldCatalogDetail from "../../../components/admin/tournament-config/ConfigFieldCatalogDetail";
import AdminButton from "../../../components/admin/ui/AdminButton";
import AdminCard from "../../../components/admin/ui/AdminCard";
import AdminModal from "../../../components/admin/ui/AdminModal";
import AdminPagination from "../../../components/admin/ui/AdminPagination";
import { CATALOG_DATA_TYPE_LABELS, CATALOG_FIELD_SCOPES, CATALOG_SCOPE_LABELS, CATALOG_UI_LABELS } from "../../../constants/configFieldCatalog";
import { getApiErrorMessage } from "../../../utils/apiError";
import { DEFAULT_PAGE_SIZE } from "../../../utils/pagination";

const ConfigFieldCatalogPage = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [scope, setScope] = useState("");
  const [activeFilter, setActiveFilter] = useState("");

  const [formMode, setFormMode] = useState(null);
  const [editItem, setEditItem] = useState(null);
  const [saving, setSaving] = useState(false);

  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [confirmToggle, setConfirmToggle] = useState(null);

  const loadCatalog = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getCatalog({
        page,
        size: pageSize,
        ...(scope ? { scope } : {}),
        ...(activeFilter === "true"
          ? { isActive: true }
          : activeFilter === "false"
            ? { isActive: false }
            : {}),
      });
      setItems(result.content);
      setTotalElements(result.totalElements);
      setTotalPages(result.totalPages);
      if (result.page !== page) setPage(result.page);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, scope, activeFilter]);

  useEffect(() => {
    loadCatalog();
  }, [loadCatalog]);

  const openCreate = () => {
    setEditItem(null);
    setFormMode("create");
  };

  const openEdit = async (fieldKey) => {
    setSaving(false);
    setFormMode("edit");
    setEditItem({ fieldKey });
    try {
      const data = await getCatalogItem(fieldKey);
      setEditItem(data);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
      setFormMode(null);
      setEditItem(null);
    }
  };

  const closeForm = () => {
    setFormMode(null);
    setEditItem(null);
    setSaving(false);
  };

  const handleFormSubmit = async (body) => {
    setSaving(true);
    try {
      if (formMode === "create") {
        await createCatalogItem(body);
        toast.success("Đã tạo field catalog");
        closeForm();
        loadCatalog(); // field mới — cần tải lại để đúng vị trí/tổng số trang
      } else {
        const fieldKey = editItem.fieldKey;
        await updateCatalogItem(fieldKey, body);
        setItems((prev) => prev.map((it) => (it.fieldKey === fieldKey ? { ...it, ...body } : it)));
        toast.success("Đã cập nhật field catalog");
        closeForm();
      }
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const openDetail = async (fieldKey) => {
    setDetail({ fieldKey });
    setDetailLoading(true);
    try {
      const data = await getCatalogItem(fieldKey);
      setDetail(data);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
      setDetail(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetail = () => {
    setDetail(null);
    setDetailLoading(false);
  };

  const handleEditFromDetail = (fieldKey) => {
    closeDetail();
    openEdit(fieldKey);
  };

  const handleToggleActive = (row) => {
    if (!row.isActive) {
      applyToggleActive(row.fieldKey, true);
      return;
    }
    setConfirmToggle(row);
  };

  const applyToggleActive = async (fieldKey, isActive) => {
    try {
      await patchCatalogItemActive(fieldKey, { isActive });
      setItems((prev) => prev.map((it) => (it.fieldKey === fieldKey ? { ...it, isActive } : it)));
      toast.success(isActive ? "Đã kích hoạt trường" : "Đã tắt trường");
      setConfirmToggle(null);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  return (
    <div className="space-y-6">
      <p className="text-sm text-slate-600 dark:text-white/70">
        Định nghĩa trường cấu hình dùng trong wizard thể thức / giải đấu. Mỗi{" "}
        <strong>kiểu dữ liệu</strong> khớp một <strong>thành phần UI</strong> cố định.
      </p>

      <AdminCard padding={false}>
        <div className="p-5 flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b border-slate-100 dark:border-white/10">
          <div className="flex flex-wrap gap-4 flex-1">
            <div className="w-full sm:w-44">
              <label className="admin-label">Phạm vi</label>
              <select
                className="admin-select"
                value={scope}
                onChange={(e) => {
                  setScope(e.target.value);
                  setPage(0);
                }}
              >
                <option value="">Tất cả phạm vi</option>
                {CATALOG_FIELD_SCOPES.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="w-full sm:w-40">
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
          </div>
          <AdminButton onClick={openCreate} className="shrink-0">
            <Plus size={18} />
            Tạo trường mới
          </AdminButton>
        </div>

        <div className="admin-table-wrap">
          {loading ? (
            <div className="admin-empty">Đang tải danh sách...</div>
          ) : items.length === 0 ? (
            <div className="admin-empty">Không có trường phù hợp bộ lọc.</div>
          ) : (
            <table className="admin-table">
              <colgroup>
                <col style={{ width: "22%" }} />
                <col style={{ width: "20%" }} />
                <col style={{ width: "10%" }} />
                <col style={{ width: "10%" }} />
                <col style={{ width: "12%" }} />
                <col style={{ width: "8%" }} />
                <col style={{ width: "18%" }} />
              </colgroup>
              <thead>
                <tr>
                  <th>Mã trường</th>
                  <th>Nhãn</th>
                  <th>Kiểu dữ liệu</th>
                  <th>Thành phần UI</th>
                  <th>Phạm vi</th>
                  <th className="align-center">Kích hoạt</th>
                  <th className="align-right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {items.map((row) => {
                  const scope = row.fieldScope || row.scope;
                  return (
                    <tr key={row.fieldKey}>
                      <td>
                        <code className="admin-table-code">{row.fieldKey}</code>
                      </td>
                      <td>
                        <span className="admin-table-name">{row.label}</span>
                      </td>
                      <td>
                        <span className="text-slate-600 dark:text-white/70 text-sm">
                          {CATALOG_DATA_TYPE_LABELS[row.dataType] || row.dataType || "—"}
                        </span>
                      </td>
                      <td>
                        <span className="text-slate-600 dark:text-white/70 text-sm">
                          {CATALOG_UI_LABELS[row.uiComponent] || row.uiComponent}
                        </span>
                      </td>
                      <td>
                        <span className="text-slate-500 dark:text-white/60 text-sm">
                          {CATALOG_SCOPE_LABELS[scope] || scope}
                        </span>
                      </td>
                      <td className="align-center">
                        <span className="admin-table-toggle-wrap">
                          <button
                            type="button"
                            role="switch"
                            aria-checked={row.isActive !== false}
                            className="admin-toggle"
                            data-on={row.isActive !== false}
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
                            onClick={() => openDetail(row.fieldKey)}
                          >
                            <Eye size={14} />
                            Chi tiết
                          </button>
                          <button
                            type="button"
                            className="admin-table-action admin-table-action--warning"
                            onClick={() => openEdit(row.fieldKey)}
                          >
                            <Pencil size={14} />
                            Sửa
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
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
        title={formMode === "create" ? "Thêm trường cấu hình" : `Sửa trường: ${editItem?.fieldKey || ""}`}
        size="lg"
        footer={
          <>
            <AdminButton variant="secondary" onClick={closeForm} disabled={saving}>
              Hủy
            </AdminButton>
            <AdminButton
              type="submit"
              form="catalog-field-form"
              disabled={saving || (formMode === "edit" && !editItem?.label)}
            >
              {saving ? "Đang lưu…" : formMode === "create" ? "Tạo trường" : "Lưu thay đổi"}
            </AdminButton>
          </>
        }
      >
        {formMode === "edit" && editItem && !editItem.label ? (
          <p className="text-slate-400 dark:text-white/40 animate-pulse">Đang tải thông tin trường…</p>
        ) : (
          <ConfigFieldCatalogForm
            mode={formMode}
            initialItem={formMode === "edit" ? editItem : null}
            onSubmit={handleFormSubmit}
          />
        )}
      </AdminModal>

      <AdminModal
        open={!!detail}
        onClose={closeDetail}
        title="Chi tiết trường cấu hình"
        size="lg"
        footer={
          !detailLoading && detail?.fieldKey ? (
            <>
              <AdminButton variant="secondary" onClick={closeDetail}>
                Đóng
              </AdminButton>
              <AdminButton onClick={() => handleEditFromDetail(detail.fieldKey)}>
                <Pencil size={16} />
                Sửa trường
              </AdminButton>
            </>
          ) : null
        }
      >
        <ConfigFieldCatalogDetail item={detail} loading={detailLoading} />
      </AdminModal>

      <AdminModal
        open={!!confirmToggle}
        onClose={() => setConfirmToggle(null)}
        title="Tắt trường cấu hình?"
        footer={
          <>
            <AdminButton variant="secondary" onClick={() => setConfirmToggle(null)}>
              Hủy
            </AdminButton>
            <AdminButton
              variant="danger"
              onClick={() => applyToggleActive(confirmToggle.fieldKey, false)}
            >
              Xác nhận tắt
            </AdminButton>
          </>
        }
      >
        Trường <strong>{confirmToggle?.label}</strong> ({confirmToggle?.fieldKey}) sẽ không hiển thị
        trong wizard cấu hình.
      </AdminModal>
    </div>
  );
};

export default ConfigFieldCatalogPage;
