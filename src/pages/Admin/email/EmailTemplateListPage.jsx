import { useCallback, useEffect, useRef, useState } from "react";
import { Eye, Plus } from "lucide-react";
import { toast } from "react-toastify";
import { adminEmailApi } from "../../../api/emailApi";
import AdminButton from "../../../components/admin/ui/AdminButton";
import AdminCard from "../../../components/admin/ui/AdminCard";
import AdminModal from "../../../components/admin/ui/AdminModal";
import AdminPagination from "../../../components/admin/ui/AdminPagination";
import {
  EMAIL_TEMPLATE_CATEGORIES,
  EMPTY_EMAIL_TEMPLATE_FORM,
} from "../../../constants/emailConfig";
import { getApiErrorMessage } from "../../../utils/apiError";
import { buildListParams, DEFAULT_PAGE_SIZE } from "../../../utils/pagination";

const rowToEditForm = (row) => ({
  code: row.code,
  name: row.name || "",
  description: row.description || "",
  category: row.category,
  subjectTemplate: row.subjectTemplate || "",
  bodyHtmlTemplate: row.bodyHtmlTemplate || "",
  availableVariables: row.availableVariables || [],
});

const EmailTemplateListPage = () => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [categoryFilter, setCategoryFilter] = useState("");

  const [variables, setVariables] = useState([]);
  const [formMode, setFormMode] = useState(null); // "create" | "edit" | null
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_EMAIL_TEMPLATE_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const bodyRef = useRef(null);
  const subjectRef = useRef(null);
  const [focusedField, setFocusedField] = useState("bodyHtmlTemplate");

  const [preview, setPreview] = useState(null); // { subject, bodyHtml }
  const [previewLoading, setPreviewLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await adminEmailApi.listTemplates(
        buildListParams({ page, size: pageSize, category: categoryFilter || undefined })
      );
      setTemplates(result.content);
      setTotalElements(result.totalElements);
      setTotalPages(result.totalPages);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, categoryFilter]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    adminEmailApi.listVariables().then(setVariables).catch(() => setVariables([]));
  }, []);

  const patchForm = (updates) => {
    setForm((f) => ({ ...f, ...updates }));
    setFormErrors((e) => {
      const next = { ...e };
      Object.keys(updates).forEach((k) => delete next[k]);
      return next;
    });
  };

  const openCreate = () => {
    setForm(EMPTY_EMAIL_TEMPLATE_FORM);
    setFormErrors({});
    setEditingId(null);
    setFormMode("create");
  };

  const openEdit = (row) => {
    setForm(rowToEditForm(row));
    setFormErrors({});
    setEditingId(row.id);
    setFormMode("edit");
  };

  const validate = () => {
    const errors = {};
    if (!form.code.trim()) errors.code = "Bắt buộc nhập mã mẫu";
    if (!form.name.trim()) errors.name = "Bắt buộc nhập tên";
    if (!form.subjectTemplate.trim()) errors.subjectTemplate = "Bắt buộc nhập tiêu đề";
    if (!form.bodyHtmlTemplate.trim()) errors.bodyHtmlTemplate = "Bắt buộc nhập nội dung";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const insertVariable = (key) => {
    const placeholder = `{{${key}}}`;
    const field = focusedField === "subjectTemplate" ? subjectRef : bodyRef;
    const el = field.current;
    const currentValue = form[focusedField] || "";
    if (el && typeof el.selectionStart === "number") {
      const start = el.selectionStart;
      const end = el.selectionEnd;
      const next = currentValue.slice(0, start) + placeholder + currentValue.slice(end);
      patchForm({ [focusedField]: next });
      requestAnimationFrame(() => {
        el.focus();
        el.selectionStart = el.selectionEnd = start + placeholder.length;
      });
    } else {
      patchForm({ [focusedField]: currentValue + placeholder });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      if (formMode === "create") {
        await adminEmailApi.createTemplate(form);
        toast.success("Đã tạo mẫu email");
        setFormMode(null);
        load(); // mẫu mới — cần tải lại để đúng vị trí/tổng số trang
      } else {
        await adminEmailApi.updateTemplate(editingId, form);
        const categoryDisplayName =
          EMAIL_TEMPLATE_CATEGORIES.find((c) => c.value === form.category)?.label || form.category;
        setTemplates((prev) =>
          prev.map((t) => (t.id === editingId ? { ...t, ...form, categoryDisplayName } : t))
        );
        toast.success("Đã cập nhật mẫu email");
        setFormMode(null);
      }
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (row) => {
    const nextActive = !row.isActive;
    try {
      await adminEmailApi.setTemplateActive(row.id, nextActive);
      setTemplates((prev) => prev.map((t) => (t.id === row.id ? { ...t, isActive: nextActive } : t)));
      toast.success(row.isActive ? "Đã tắt mẫu email" : "Đã bật mẫu email");
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  const openPreview = async (row) => {
    setPreview({ loading: true });
    setPreviewLoading(true);
    try {
      const rendered = await adminEmailApi.previewTemplate(row.id, {});
      setPreview(rendered);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
      setPreview(null);
    } finally {
      setPreviewLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <AdminCard
        title={`Mẫu email (${totalElements})`}
        action={
          <AdminButton onClick={openCreate}>
            <Plus size={16} className="mr-1" /> Tạo mẫu email
          </AdminButton>
        }
      >
        <div className="admin-toolbar flex flex-wrap gap-2 mb-4">
          <select
            className="admin-select w-auto"
            value={categoryFilter}
            onChange={(e) => {
              setPage(0);
              setCategoryFilter(e.target.value);
            }}
          >
            <option value="">Tất cả danh mục</option>
            {EMAIL_TEMPLATE_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="admin-table w-full text-sm">
            <thead>
              <tr>
                <th>Mã</th>
                <th>Tên</th>
                <th>Danh mục</th>
                <th>Trạng thái</th>
                <th className="align-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-6 text-slate-400">
                    Đang tải...
                  </td>
                </tr>
              ) : templates.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-6 text-slate-400">
                    Chưa có mẫu email
                  </td>
                </tr>
              ) : (
                templates.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <code className="admin-table-code" title={row.code}>{row.code}</code>
                    </td>
                    <td>
                      <span className="admin-table-name" title={row.name}>{row.name}</span>
                    </td>
                    <td>{row.categoryDisplayName}</td>
                    <td>
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-medium ${
                          row.isActive ? "bg-green-100 text-green-800" : "bg-gray-200 text-gray-700"
                        }`}
                      >
                        {row.isActive ? "Hoạt động" : "Tắt"}
                      </span>
                    </td>
                    <td className="align-right">
                      <div className="admin-table-actions">
                        <AdminButton variant="ghost" className="!px-2" onClick={() => openPreview(row)}>
                          <Eye size={16} />
                        </AdminButton>
                        <AdminButton variant="secondary" onClick={() => openEdit(row)}>
                          Sửa
                        </AdminButton>
                        <AdminButton variant={row.isActive ? "danger" : "success"} onClick={() => toggleActive(row)}>
                          {row.isActive ? "Tắt" : "Bật"}
                        </AdminButton>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <AdminPagination
          page={page}
          totalPages={totalPages}
          totalElements={totalElements}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={(s) => {
            setPageSize(s);
            setPage(0);
          }}
        />
      </AdminCard>

      <AdminModal
        open={!!formMode}
        onClose={() => setFormMode(null)}
        title={formMode === "create" ? "Tạo mẫu email" : "Sửa mẫu email"}
        size="lg"
        footer={
          <>
            <AdminButton variant="secondary" onClick={() => setFormMode(null)}>
              Hủy
            </AdminButton>
            <AdminButton type="submit" form="email-template-form" disabled={saving}>
              {saving ? "Đang lưu..." : "Lưu"}
            </AdminButton>
          </>
        }
      >
        <form id="email-template-form" onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="admin-label">Mã mẫu *</label>
              <input
                className="admin-input mt-1 font-mono uppercase"
                placeholder="REGISTRATION_APPROVED"
                value={form.code}
                onChange={(e) => patchForm({ code: e.target.value.toUpperCase() })}
              />
              {formErrors.code && <p className="text-xs text-rose-600 mt-1">{formErrors.code}</p>}
            </div>
            <div>
              <label className="admin-label">Danh mục</label>
              <select
                className="admin-select mt-1"
                value={form.category}
                onChange={(e) => patchForm({ category: e.target.value })}
              >
                {EMAIL_TEMPLATE_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="admin-label">Tên hiển thị *</label>
              <input
                className="admin-input mt-1"
                value={form.name}
                onChange={(e) => patchForm({ name: e.target.value })}
              />
              {formErrors.name && <p className="text-xs text-rose-600 mt-1">{formErrors.name}</p>}
            </div>
            <div className="sm:col-span-2">
              <label className="admin-label">Mô tả</label>
              <textarea
                className="admin-input mt-1"
                rows={2}
                value={form.description}
                onChange={(e) => patchForm({ description: e.target.value })}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="admin-label">Tiêu đề email *</label>
              <input
                ref={subjectRef}
                className="admin-input mt-1"
                value={form.subjectTemplate}
                onFocus={() => setFocusedField("subjectTemplate")}
                onChange={(e) => patchForm({ subjectTemplate: e.target.value })}
              />
              {formErrors.subjectTemplate && (
                <p className="text-xs text-rose-600 mt-1">{formErrors.subjectTemplate}</p>
              )}
            </div>
            <div className="sm:col-span-2">
              <label className="admin-label">Nội dung HTML *</label>
              <textarea
                ref={bodyRef}
                className="admin-input mt-1 font-mono text-xs"
                rows={10}
                value={form.bodyHtmlTemplate}
                onFocus={() => setFocusedField("bodyHtmlTemplate")}
                onChange={(e) => patchForm({ bodyHtmlTemplate: e.target.value })}
              />
              {formErrors.bodyHtmlTemplate && (
                <p className="text-xs text-rose-600 mt-1">{formErrors.bodyHtmlTemplate}</p>
              )}
            </div>
            <div className="sm:col-span-2">
              <label className="admin-label">
                Chèn biến vào {focusedField === "subjectTemplate" ? "tiêu đề" : "nội dung"} (click để chèn tại vị trí con trỏ)
              </label>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {variables.map((v) => (
                  <button
                    key={v.key}
                    type="button"
                    title={v.description}
                    onClick={() => insertVariable(v.key)}
                    className="px-2 py-1 rounded-md bg-indigo-50 text-indigo-700 text-xs font-mono hover:bg-indigo-100"
                  >
                    {`{{${v.key}}}`}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </form>
      </AdminModal>

      <AdminModal
        open={!!preview}
        onClose={() => setPreview(null)}
        title="Xem trước email"
        size="lg"
        footer={
          <AdminButton variant="secondary" onClick={() => setPreview(null)}>
            Đóng
          </AdminButton>
        }
      >
        {previewLoading || !preview ? (
          <p className="text-slate-400 text-sm">Đang render...</p>
        ) : (
          <div className="space-y-3">
            <div>
              <p className="admin-label">Tiêu đề</p>
              <p className="font-medium">{preview.subject}</p>
            </div>
            <div>
              <p className="admin-label mb-1">Nội dung</p>
              <div
                className="border border-slate-200 rounded-lg p-4 bg-white"
                dangerouslySetInnerHTML={{ __html: preview.bodyHtml }}
              />
            </div>
          </div>
        )}
      </AdminModal>
    </div>
  );
};

export default EmailTemplateListPage;
