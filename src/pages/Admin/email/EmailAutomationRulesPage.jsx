import { useCallback, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "react-toastify";
import { adminEmailApi } from "../../../api/emailApi";
import AdminButton from "../../../components/admin/ui/AdminButton";
import AdminCard from "../../../components/admin/ui/AdminCard";
import AdminModal from "../../../components/admin/ui/AdminModal";
import AdminPagination from "../../../components/admin/ui/AdminPagination";
import {
  EMAIL_EVENT_TYPES,
  EMAIL_RECIPIENT_TYPES,
  EMPTY_EMAIL_RULE_FORM,
} from "../../../constants/emailConfig";
import { getApiErrorMessage } from "../../../utils/apiError";
import { buildListParams, DEFAULT_PAGE_SIZE } from "../../../utils/pagination";

const EmailAutomationRulesPage = () => {
  const [rules, setRules] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_EMAIL_RULE_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await adminEmailApi.listRules(buildListParams({ page, size: pageSize }));
      setRules(result.content);
      setTotalElements(result.totalElements);
      setTotalPages(result.totalPages);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [page, pageSize]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    adminEmailApi
      .listTemplates(buildListParams({ page: 0, size: 100 }))
      .then((r) => setTemplates(r.content))
      .catch(() => setTemplates([]));
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
    setForm(EMPTY_EMAIL_RULE_FORM);
    setFormErrors({});
    setFormOpen(true);
  };

  const validate = () => {
    const errors = {};
    if (!form.code.trim()) errors.code = "Bắt buộc nhập mã quy tắc";
    if (!form.name.trim()) errors.name = "Bắt buộc nhập tên";
    if (!form.templateId) errors.templateId = "Bắt buộc chọn mẫu email";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      await adminEmailApi.createRule({ ...form, templateId: Number(form.templateId) });
      toast.success("Đã tạo quy tắc tự động");
      setFormOpen(false);
      load();
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const toggleEnabled = async (row) => {
    const nextEnabled = !row.isEnabled;
    try {
      await adminEmailApi.setRuleEnabled(row.id, nextEnabled);
      setRules((prev) => prev.map((r) => (r.id === row.id ? { ...r, isEnabled: nextEnabled } : r)));
      toast.success(row.isEnabled ? "Đã tắt quy tắc" : "Đã bật quy tắc");
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  return (
    <div className="space-y-4">
      <AdminCard
        title={`Quy tắc tự động (${totalElements})`}
        action={
          <AdminButton onClick={openCreate}>
            <Plus size={16} className="mr-1" /> Tạo quy tắc
          </AdminButton>
        }
      >
        <div className="overflow-x-auto">
          <table className="admin-table w-full text-sm">
            <thead>
              <tr>
                <th>Mã</th>
                <th>Tên</th>
                <th>Sự kiện</th>
                <th>Mẫu email</th>
                <th>Người nhận</th>
                <th>Trạng thái</th>
                <th className="align-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-6 text-slate-400 dark:text-white/40">
                    Đang tải...
                  </td>
                </tr>
              ) : rules.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-6 text-slate-400 dark:text-white/40">
                    Chưa có quy tắc tự động
                  </td>
                </tr>
              ) : (
                rules.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <code className="admin-table-code" title={row.code}>{row.code}</code>
                    </td>
                    <td>
                      <span className="admin-table-name" title={row.name}>{row.name}</span>
                    </td>
                    <td className="text-xs">{row.eventTypeDisplayName}</td>
                    <td className="text-xs">{row.templateName}</td>
                    <td className="text-xs">{row.recipientTypeDisplayName}</td>
                    <td>
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-medium ${
                          row.isEnabled ? "bg-green-100 text-green-800" : "bg-gray-200 text-gray-700 dark:text-white/75"
                        }`}
                      >
                        {row.isEnabled ? "Đang bật" : "Đang tắt"}
                      </span>
                    </td>
                    <td className="align-right">
                      <div className="admin-table-actions">
                        <AdminButton variant={row.isEnabled ? "danger" : "success"} onClick={() => toggleEnabled(row)}>
                          {row.isEnabled ? "Tắt" : "Bật"}
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
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title="Tạo quy tắc tự động"
        footer={
          <>
            <AdminButton variant="secondary" onClick={() => setFormOpen(false)}>
              Hủy
            </AdminButton>
            <AdminButton type="submit" form="email-rule-form" disabled={saving}>
              {saving ? "Đang lưu..." : "Lưu"}
            </AdminButton>
          </>
        }
      >
        <form id="email-rule-form" onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="admin-label">Mã quy tắc *</label>
            <input
              className="admin-input mt-1 font-mono uppercase"
              placeholder="AUTO_MATCH_COMPLETED"
              value={form.code}
              onChange={(e) => patchForm({ code: e.target.value.toUpperCase() })}
            />
            {formErrors.code && <p className="text-xs text-rose-600 mt-1">{formErrors.code}</p>}
          </div>
          <div>
            <label className="admin-label">Tên hiển thị *</label>
            <input className="admin-input mt-1" value={form.name} onChange={(e) => patchForm({ name: e.target.value })} />
            {formErrors.name && <p className="text-xs text-rose-600 mt-1">{formErrors.name}</p>}
          </div>
          <div>
            <label className="admin-label">Sự kiện</label>
            <select
              className="admin-select mt-1"
              value={form.eventType}
              onChange={(e) => patchForm({ eventType: e.target.value })}
            >
              {EMAIL_EVENT_TYPES.map((ev) => (
                <option key={ev.value} value={ev.value}>
                  {ev.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="admin-label">Mẫu email *</label>
            <select
              className="admin-select mt-1"
              value={form.templateId}
              onChange={(e) => patchForm({ templateId: e.target.value })}
            >
              <option value="">— Chọn mẫu email —</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.code})
                </option>
              ))}
            </select>
            {formErrors.templateId && <p className="text-xs text-rose-600 mt-1">{formErrors.templateId}</p>}
          </div>
          <div>
            <label className="admin-label">Người nhận</label>
            <select
              className="admin-select mt-1"
              value={form.recipientType}
              onChange={(e) => patchForm({ recipientType: e.target.value })}
            >
              {EMAIL_RECIPIENT_TYPES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="admin-label">Trễ (phút)</label>
            <input
              type="number"
              min={0}
              className="admin-input mt-1"
              value={form.delayMinutes}
              onChange={(e) => patchForm({ delayMinutes: Number(e.target.value) })}
            />
          </div>
        </form>
      </AdminModal>
    </div>
  );
};

export default EmailAutomationRulesPage;
