import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Plus } from "lucide-react";
import { toast } from "react-toastify";
import { getRegistrationFieldCatalog } from "../../../api/adminRegistrationFieldApi";
import {
  createRegistrationFormTemplate,
  getRegistrationFormTemplate,
  getRegistrationFormTemplateFields,
  getRegistrationFormTemplatePreview,
  saveRegistrationFormTemplateFields,
  updateRegistrationFormTemplate,
} from "../../../api/adminRegistrationFormTemplateApi";
import DynamicRegistrationTemplateFieldForm from "../../../components/registration-form/DynamicRegistrationTemplateFieldForm";
import RegistrationFormPreviewPanel from "../../../components/registration-form/RegistrationFormPreviewPanel";
import RegistrationFormTemplateStepper from "../../../components/registration-form/RegistrationFormTemplateStepper";
import AdminButton from "../../../components/admin/ui/AdminButton";
import AdminCard from "../../../components/admin/ui/AdminCard";
import { getApiErrorMessage } from "../../../utils/apiError";
import { buildListParams } from "../../../utils/pagination";

const defaultInfo = {
  code: "",
  name: "",
  description: "",
  sortOrder: 0,
  isActive: true,
};

const RegistrationFormTemplateWizardPage = () => {
  const { id: routeId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isNew = location.pathname.endsWith("/new");
  const templateId = isNew ? null : Number(routeId);

  const [step, setStep] = useState(() => {
    const s = Number(searchParams.get("step"));
    return s >= 2 && s <= 3 && templateId ? s : 1;
  });
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [info, setInfo] = useState(defaultInfo);
  const [fields, setFields] = useState([]);
  const [availableFields, setAvailableFields] = useState([]);
  const [catalogPick, setCatalogPick] = useState("");
  const [preview, setPreview] = useState(null);

  const loadTemplate = useCallback(async () => {
    if (!templateId) return;
    setLoading(true);
    try {
      const data = await getRegistrationFormTemplate(templateId);
      setInfo({
        code: data.code || "",
        name: data.name || "",
        description: data.description || "",
        sortOrder: data.sortOrder ?? 0,
        isActive: data.isActive !== false,
      });
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [templateId]);

  const loadFields = useCallback(async () => {
    if (!templateId) return;
    setLoading(true);
    try {
      const data = await getRegistrationFormTemplateFields(templateId);
      setFields(data?.fields || []);
      setAvailableFields(data?.availableFields || []);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [templateId]);

  const loadPreview = useCallback(async () => {
    if (!templateId) return;
    setLoading(true);
    try {
      const data = await getRegistrationFormTemplatePreview(templateId);
      setPreview(data);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [templateId]);

  useEffect(() => {
    const s = Number(searchParams.get("step"));
    if (s >= 1 && s <= 3 && templateId) setStep(s);
  }, [searchParams, templateId]);

  useEffect(() => {
    if (!isNew) loadTemplate();
  }, [isNew, loadTemplate]);

  useEffect(() => {
    if (step === 2 && templateId) loadFields();
  }, [step, templateId, loadFields]);

  useEffect(() => {
    if (step === 3 && templateId) loadPreview();
  }, [step, templateId, loadPreview]);

  const handleSaveStep1 = async () => {
    if (!info.code.trim() || !info.name.trim()) {
      toast.warn("Vui lòng nhập code và tên template");
      return;
    }
    setSaving(true);
    try {
      const body = {
        code: info.code.trim(),
        name: info.name.trim(),
        description: info.description?.trim() || null,
        sortOrder: Number(info.sortOrder) || 0,
        isActive: info.isActive,
      };
      if (isNew) {
        const created = await createRegistrationFormTemplate(body);
        toast.success("Đã tạo template");
        navigate(`/admin/registration-form/templates/${created.id}/edit`, { replace: true });
        setStep(2);
      } else {
        await updateRegistrationFormTemplate(templateId, {
          name: body.name,
          description: body.description,
          sortOrder: body.sortOrder,
        });
        toast.success("Đã cập nhật template");
        setStep(2);
      }
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleAddFromCatalog = async () => {
    if (!catalogPick) return;
    let item = availableFields.find((f) => f.fieldKey === catalogPick);
    if (!item) {
      try {
        const catalog = await getRegistrationFieldCatalog(
          buildListParams({ page: 0, size: 100, isActive: true })
        );
        item = catalog.content.find((f) => f.fieldKey === catalogPick);
      } catch (err) {
        toast.error(getApiErrorMessage(err));
        return;
      }
    }
    if (!item) {
      toast.error("Không tìm thấy field");
      return;
    }
    if (fields.some((f) => f.fieldKey === item.fieldKey)) {
      toast.warn("Field đã có trong template");
      return;
    }
    setFields([
      ...fields,
      {
        fieldKey: item.fieldKey,
        label: item.label,
        description: item.description,
        dataType: item.dataType,
        uiComponent: item.uiComponent,
        enumOptions: item.enumOptions,
        minValue: item.minValue,
        maxValue: item.maxValue,
        isRequired: true,
        sortOrder: fields.length,
      },
    ]);
    setCatalogPick("");
  };

  const handleRemoveField = (index) => {
    setFields(fields.filter((_, i) => i !== index));
  };

  const handleSaveStep2 = async () => {
    if (!templateId) return;
    if (!fields.length) {
      toast.warn("Thêm ít nhất một field");
      return;
    }
    setSaving(true);
    try {
      await saveRegistrationFormTemplateFields(templateId, {
        fields: fields.map((f, index) => ({
          fieldKey: f.fieldKey,
          labelOverride: f.labelOverride || null,
          descriptionOverride: f.descriptionOverride || null,
          placeholder: f.placeholder || null,
          validationRegex: f.validationRegex || null,
          defaultValue: f.defaultValue || null,
          isRequired: f.isRequired !== false,
          sortOrder: f.sortOrder ?? index,
        })),
      });
      toast.success("Đã lưu field template");
      setStep(3);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (loading && step === 1 && !isNew && !info.name) {
    return <p className="text-slate-500 py-12 text-center">Đang tải...</p>;
  }

  return (
    <div>
      <RegistrationFormTemplateStepper currentStep={step} />

      {step === 1 && (
        <AdminCard title="Bước 1 — Thông tin template">
          <div className="grid gap-4 sm:grid-cols-2 max-w-2xl">
            <div>
              <label className="admin-label">Code *</label>
              <input
                className="admin-input w-full"
                value={info.code}
                disabled={!isNew}
                placeholder="SINGLE_PLAYER"
                onChange={(e) => setInfo({ ...info, code: e.target.value.toUpperCase() })}
              />
            </div>
            <div>
              <label className="admin-label">Tên *</label>
              <input
                className="admin-input w-full"
                value={info.name}
                onChange={(e) => setInfo({ ...info, name: e.target.value })}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="admin-label">Mô tả</label>
              <textarea
                className="admin-input w-full min-h-[80px]"
                value={info.description}
                onChange={(e) => setInfo({ ...info, description: e.target.value })}
              />
            </div>
            <div>
              <label className="admin-label">Thứ tự hiển thị</label>
              <input
                type="number"
                min={0}
                className="admin-input w-full"
                value={info.sortOrder}
                onChange={(e) => setInfo({ ...info, sortOrder: e.target.value })}
              />
            </div>
            {isNew && (
              <div className="flex items-end">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={info.isActive}
                    onChange={(e) => setInfo({ ...info, isActive: e.target.checked })}
                  />
                  Kích hoạt ngay
                </label>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <AdminButton variant="primary" onClick={handleSaveStep1} disabled={saving}>
              {isNew ? "Tạo & tiếp tục" : "Lưu & tiếp tục"}
            </AdminButton>
          </div>
        </AdminCard>
      )}

      {step === 2 && (
        <AdminCard title="Bước 2 — Cấu hình field">
          {loading ? (
            <p className="text-slate-500 py-8 text-center">Đang tải...</p>
          ) : (
            <>
              <div className="flex flex-col sm:flex-row gap-2 mb-4 max-w-xl">
                <select
                  className="admin-select flex-1"
                  value={catalogPick}
                  onChange={(e) => setCatalogPick(e.target.value)}
                >
                  <option value="">-- Chọn field từ catalog --</option>
                  {availableFields.map((f) => (
                    <option key={f.fieldKey} value={f.fieldKey}>
                      {f.label} ({f.fieldKey})
                    </option>
                  ))}
                </select>
                <AdminButton variant="secondary" onClick={handleAddFromCatalog}>
                  <Plus size={16} />
                  Thêm field
                </AdminButton>
              </div>
              <DynamicRegistrationTemplateFieldForm
                fields={fields}
                onChange={setFields}
                onRemove={handleRemoveField}
              />
              <div className="flex justify-between gap-2 mt-6">
                <AdminButton variant="secondary" onClick={() => setStep(1)}>
                  Quay lại
                </AdminButton>
                <AdminButton variant="primary" onClick={handleSaveStep2} disabled={saving}>
                  Lưu & preview
                </AdminButton>
              </div>
            </>
          )}
        </AdminCard>
      )}

      {step === 3 && (
        <AdminCard title="Bước 3 — Preview form đăng ký">
          {loading ? (
            <p className="text-slate-500 py-8 text-center">Đang tải preview...</p>
          ) : (
            <>
              <RegistrationFormPreviewPanel preview={preview} />
              <div className="flex flex-wrap justify-between gap-2 mt-6">
                <AdminButton variant="secondary" onClick={() => setStep(2)}>
                  Chỉnh field
                </AdminButton>
                <AdminButton
                  variant="primary"
                  onClick={() => navigate("/admin/registration-form/templates")}
                >
                  Hoàn tất
                </AdminButton>
              </div>
            </>
          )}
        </AdminCard>
      )}
    </div>
  );
};

export default RegistrationFormTemplateWizardPage;
