import { useCallback, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "react-toastify";
import {
  createRegistrationField,
  getRegistrationFieldCatalog,
  patchRegistrationFieldActive,
  updateRegistrationField,
} from "../../../api/adminRegistrationFieldApi";
import AdminButton from "../../../components/admin/ui/AdminButton";
import AdminCard from "../../../components/admin/ui/AdminCard";
import AdminModal from "../../../components/admin/ui/AdminModal";
import AdminPagination from "../../../components/admin/ui/AdminPagination";
import {
  REGISTRATION_DATA_TYPES,
  REGISTRATION_UI_COMPONENTS,
} from "../../../constants/registrationFormConfig";
import { getApiErrorMessage } from "../../../utils/apiError";
import { buildListParams, DEFAULT_PAGE_SIZE } from "../../../utils/pagination";

const emptyForm = {
  fieldKey: "",
  label: "",
  description: "",
  dataType: "STRING",
  uiComponent: "TEXT",
  enumOptionsText: "",
  minValue: "",
  maxValue: "",
  isActive: true,
};

const RegistrationFieldCatalogPage = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isActiveFilter, setIsActiveFilter] = useState("true");
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getRegistrationFieldCatalog(
        buildListParams({
          page,
          size: pageSize,
          ...(isActiveFilter !== "" ? { isActive: isActiveFilter === "true" } : {}),
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
  }, [page, pageSize, isActiveFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setModal({ mode: "create" });
    setForm(emptyForm);
  };

  const openEdit = (row) => {
    setModal({ mode: "edit", fieldKey: row.fieldKey });
    setForm({
      fieldKey: row.fieldKey,
      label: row.label || "",
      description: row.description || "",
      dataType: row.dataType || "STRING",
      uiComponent: row.uiComponent || "TEXT",
      enumOptionsText: (row.enumOptions || []).join(", "),
      minValue: row.minValue ?? "",
      maxValue: row.maxValue ?? "",
      isActive: row.isActive !== false,
    });
  };

  const buildPayload = () => {
    const enumOptions = form.enumOptionsText
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    return {
      label: form.label.trim(),
      description: form.description?.trim() || null,
      dataType: form.dataType,
      uiComponent: form.uiComponent,
      enumOptions: enumOptions.length ? enumOptions : null,
      minValue: form.minValue === "" ? null : Number(form.minValue),
      maxValue: form.maxValue === "" ? null : Number(form.maxValue),
    };
  };

  const handleSave = async () => {
    if (!form.label.trim()) {
      toast.warn("Vui lòng nhập label");
      return;
    }
    setSaving(true);
    try {
      if (modal.mode === "create") {
        if (!form.fieldKey.trim()) {
          toast.warn("Vui lòng nhập fieldKey");
          return;
        }
        await createRegistrationField({
          fieldKey: form.fieldKey.trim(),
          ...buildPayload(),
          isActive: form.isActive,
        });
        toast.success("Đã tạo field");
      } else {
        await updateRegistrationField(modal.fieldKey, buildPayload());
        toast.success("Đã cập nhật field");
      }
      setModal(null);
      load();
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (row) => {
    try {
      await patchRegistrationFieldActive(row.fieldKey, { isActive: !row.isActive });
      toast.success(row.isActive ? "Đã tắt field" : "Đã bật field");
      load();
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  return (
    <div className="space-y-6">
      <AdminCard padding={false}>
        <div className="p-5 flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b border-slate-100">
          <div className="w-full sm:w-44">
            <label className="admin-label">Trạng thái</label>
            <select
              className="admin-select"
              value={isActiveFilter}
              onChange={(e) => {
                setIsActiveFilter(e.target.value);
                setPage(0);
              }}
            >
              <option value="">Tất cả</option>
              <option value="true">Đang bật</option>
              <option value="false">Đang tắt</option>
            </select>
          </div>
          <AdminButton onClick={openCreate}>
            <Plus size={18} />
            Tạo field
          </AdminButton>
        </div>

        <div className="admin-table-wrap">
          {loading ? (
            <div className="admin-empty">Đang tải...</div>
          ) : items.length === 0 ? (
            <div className="admin-empty">Chưa có field trong catalog.</div>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>fieldKey</th>
                  <th>label</th>
                  <th>dataType</th>
                  <th>uiComponent</th>
                  <th className="align-center">Active</th>
                  <th className="align-right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {items.map((row) => (
                  <tr key={row.fieldKey}>
                    <td>
                      <code className="admin-table-code">{row.fieldKey}</code>
                    </td>
                    <td>
                      <span className="admin-table-name">{row.label}</span>
                    </td>
                    <td>{row.dataType}</td>
                    <td>{row.uiComponent}</td>
                    <td className="align-center">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
                          row.isActive
                            ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {row.isActive ? "Bật" : "Tắt"}
                      </span>
                    </td>
                    <td className="align-right">
                      <div className="admin-table-actions">
                        <button
                          type="button"
                          className="admin-table-action admin-table-action--primary"
                          onClick={() => openEdit(row)}
                        >
                          Sửa
                        </button>
                        <button
                          type="button"
                          className="admin-table-action"
                          onClick={() => handleToggleActive(row)}
                        >
                          {row.isActive ? "Tắt" : "Bật"}
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
        open={!!modal}
        onClose={() => setModal(null)}
        title={modal?.mode === "create" ? "Tạo field catalog" : `Sửa field: ${modal?.fieldKey}`}
        footer={
          <>
            <AdminButton variant="secondary" onClick={() => setModal(null)}>
              Hủy
            </AdminButton>
            <AdminButton onClick={handleSave} disabled={saving}>
              {saving ? "Đang lưu..." : "Lưu"}
            </AdminButton>
          </>
        }
      >
        <div className="space-y-3">
          {modal?.mode === "create" && (
            <div>
              <label className="admin-label">fieldKey *</label>
              <input
                className="admin-input mt-1"
                placeholder="player_full_name"
                value={form.fieldKey}
                onChange={(e) => setForm({ ...form, fieldKey: e.target.value })}
              />
            </div>
          )}
          <div>
            <label className="admin-label">Label *</label>
            <input
              className="admin-input mt-1"
              value={form.label}
              onChange={(e) => setForm({ ...form, label: e.target.value })}
            />
          </div>
          <div>
            <label className="admin-label">Mô tả</label>
            <textarea
              className="admin-input mt-1"
              rows={2}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="admin-label">dataType</label>
              <select
                className="admin-select mt-1"
                value={form.dataType}
                onChange={(e) => setForm({ ...form, dataType: e.target.value })}
              >
                {REGISTRATION_DATA_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="admin-label">uiComponent</label>
              <select
                className="admin-select mt-1"
                value={form.uiComponent}
                onChange={(e) => setForm({ ...form, uiComponent: e.target.value })}
              >
                {REGISTRATION_UI_COMPONENTS.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {form.dataType === "ENUM" && (
            <div>
              <label className="admin-label">enumOptions (phân cách dấu phẩy)</label>
              <input
                className="admin-input mt-1"
                placeholder="A,B,C"
                value={form.enumOptionsText}
                onChange={(e) => setForm({ ...form, enumOptionsText: e.target.value })}
              />
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="admin-label">minValue</label>
              <input
                type="number"
                className="admin-input mt-1"
                value={form.minValue}
                onChange={(e) => setForm({ ...form, minValue: e.target.value })}
              />
            </div>
            <div>
              <label className="admin-label">maxValue</label>
              <input
                type="number"
                className="admin-input mt-1"
                value={form.maxValue}
                onChange={(e) => setForm({ ...form, maxValue: e.target.value })}
              />
            </div>
          </div>
        </div>
      </AdminModal>
    </div>
  );
};

export default RegistrationFieldCatalogPage;
