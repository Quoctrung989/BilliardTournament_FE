import { useEffect, useState } from "react";
import {
  CATALOG_DATA_TYPES,
  CATALOG_FIELD_SCOPES,
  CATALOG_UI_LABELS,
  FIELD_KEY_PATTERN,
  UI_COMPONENT_BY_DATA_TYPE,
} from "../../../constants/configFieldCatalog";

const EMPTY_FORM = {
  fieldKey: "",
  label: "",
  description: "",
  dataType: "BOOLEAN",
  fieldScope: "COMMON",
  uiComponent: "CHECKBOX",
  enumOptionsText: "",
  minValue: "",
  maxValue: "",
  isActive: true,
};

const enumOptionsToText = (options) => {
  if (!Array.isArray(options) || options.length === 0) return "";
  return options.join("\n");
};

const parseEnumOptions = (text) =>
  text
    .split(/[\n,]/)
    .map((s) => s.trim())
    .filter(Boolean);

export const catalogItemToForm = (item) => ({
  fieldKey: item?.fieldKey || "",
  label: item?.label || "",
  description: item?.description || "",
  dataType: item?.dataType || "BOOLEAN",
  fieldScope: item?.fieldScope || item?.scope || "COMMON",
  uiComponent:
    item?.uiComponent || UI_COMPONENT_BY_DATA_TYPE[item?.dataType] || "CHECKBOX",
  enumOptionsText: enumOptionsToText(item?.enumOptions),
  minValue: item?.minValue != null ? String(item.minValue) : "",
  maxValue: item?.maxValue != null ? String(item.maxValue) : "",
  isActive: item?.isActive !== false,
});

export const buildCatalogPayload = (form, { isEdit = false } = {}) => {
  const errors = {};

  if (!isEdit) {
    const key = form.fieldKey.trim();
    if (!key) errors.fieldKey = "Mã trường là bắt buộc";
    else if (!FIELD_KEY_PATTERN.test(key)) {
      errors.fieldKey = "Định dạng snake_case (vd. is_show_tournament)";
    }
  }

  if (!form.label.trim()) errors.label = "Nhãn hiển thị là bắt buộc";

  const expectedUi = UI_COMPONENT_BY_DATA_TYPE[form.dataType];
  if (form.uiComponent !== expectedUi) {
    errors.uiComponent = `Thành phần UI phải là ${CATALOG_UI_LABELS[expectedUi] || expectedUi}`;
  }

  if (form.dataType === "ENUM") {
    const opts = parseEnumOptions(form.enumOptionsText);
    if (opts.length === 0) errors.enumOptionsText = "Bắt buộc nhập ít nhất một giá trị chọn";
  }

  if (form.dataType === "INT") {
    const min = form.minValue !== "" ? Number(form.minValue) : null;
    const max = form.maxValue !== "" ? Number(form.maxValue) : null;
    if (form.minValue !== "" && Number.isNaN(min)) errors.minValue = "Giá trị tối thiểu không hợp lệ";
    if (form.maxValue !== "" && Number.isNaN(max)) errors.maxValue = "Giá trị tối đa không hợp lệ";
    if (min != null && max != null && min > max) errors.maxValue = "Tối đa phải ≥ tối thiểu";
  }

  if (Object.keys(errors).length > 0) return { errors };

  const body = {
    label: form.label.trim(),
    dataType: form.dataType,
    fieldScope: form.fieldScope,
    uiComponent: form.uiComponent,
    isActive: form.isActive,
  };

  if (!isEdit) body.fieldKey = form.fieldKey.trim();
  if (form.description.trim()) body.description = form.description.trim();

  if (form.dataType === "ENUM") {
    body.enumOptions = parseEnumOptions(form.enumOptionsText);
  }

  if (form.dataType === "INT") {
    if (form.minValue !== "") body.minValue = Number(form.minValue);
    if (form.maxValue !== "") body.maxValue = Number(form.maxValue);
  }

  return { body, errors: null };
};

const ConfigFieldCatalogForm = ({ mode = "create", initialItem, onSubmit, formId = "catalog-field-form" }) => {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});

  const isEdit = mode === "edit";

  useEffect(() => {
    setForm(initialItem ? catalogItemToForm(initialItem) : EMPTY_FORM);
    setErrors({});
  }, [initialItem, mode]);

  const patch = (updates) => {
    setForm((f) => {
      const next = { ...f, ...updates };
      if (updates.dataType) {
        next.uiComponent = UI_COMPONENT_BY_DATA_TYPE[updates.dataType];
        if (updates.dataType !== "ENUM") next.enumOptionsText = "";
        if (updates.dataType !== "INT") {
          next.minValue = "";
          next.maxValue = "";
        }
      }
      return next;
    });
    setErrors((e) => {
      const next = { ...e };
      Object.keys(updates).forEach((k) => delete next[k]);
      return next;
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const { body, errors: validationErrors } = buildCatalogPayload(form, { isEdit });
    if (validationErrors) {
      setErrors(validationErrors);
      return;
    }
    onSubmit(body);
  };

  return (
    <form id={formId} onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className="admin-label">Mã trường *</label>
          <input
            className="admin-input mt-1 font-mono text-sm"
            placeholder="is_show_tournament"
            value={form.fieldKey}
            disabled={isEdit}
            onChange={(e) => patch({ fieldKey: e.target.value })}
          />
          {errors.fieldKey && (
            <p className="text-xs text-rose-600 mt-1">{errors.fieldKey}</p>
          )}
          {!isEdit && (
            <p className="text-xs text-slate-500 dark:text-white/60 mt-1">Chữ thường, số, gạch dưới — không đổi sau khi tạo.</p>
          )}
        </div>

        <div className="sm:col-span-2">
          <label className="admin-label">Nhãn hiển thị *</label>
          <input
            className="admin-input mt-1"
            value={form.label}
            onChange={(e) => patch({ label: e.target.value })}
          />
          {errors.label && <p className="text-xs text-rose-600 mt-1">{errors.label}</p>}
        </div>

        <div className="sm:col-span-2">
          <label className="admin-label">Mô tả</label>
          <textarea
            rows={2}
            className="admin-input mt-1"
            value={form.description}
            onChange={(e) => patch({ description: e.target.value })}
          />
        </div>

        <div>
          <label className="admin-label">Kiểu dữ liệu *</label>
          <select
            className="admin-select mt-1"
            value={form.dataType}
            onChange={(e) => patch({ dataType: e.target.value })}
          >
            {CATALOG_DATA_TYPES.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="admin-label">Phạm vi áp dụng *</label>
          <select
            className="admin-select mt-1"
            value={form.fieldScope}
            onChange={(e) => patch({ fieldScope: e.target.value })}
          >
            {CATALOG_FIELD_SCOPES.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="admin-label">Thành phần UI *</label>
          <input
            className="admin-input mt-1 bg-slate-50 dark:bg-white/5"
            value={CATALOG_UI_LABELS[form.uiComponent] || form.uiComponent}
            readOnly
          />
          {errors.uiComponent && (
            <p className="text-xs text-rose-600 mt-1">{errors.uiComponent}</p>
          )}
        </div>

        <div className="flex items-end">
          <label className="flex items-center gap-2 text-sm pb-2">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => patch({ isActive: e.target.checked })}
            />
            Kích hoạt ngay
          </label>
        </div>

        {form.dataType === "ENUM" && (
          <div className="sm:col-span-2">
            <label className="admin-label">Các giá trị chọn *</label>
            <textarea
              rows={3}
              className="admin-input mt-1 font-mono text-sm"
              placeholder={"ALTERNATE_BREAK\nWINNER_BREAK"}
              value={form.enumOptionsText}
              onChange={(e) => patch({ enumOptionsText: e.target.value })}
            />
            {errors.enumOptionsText && (
              <p className="text-xs text-rose-600 mt-1">{errors.enumOptionsText}</p>
            )}
            <p className="text-xs text-slate-500 dark:text-white/60 mt-1">Mỗi dòng một giá trị, hoặc cách nhau bởi dấu phẩy.</p>
          </div>
        )}

        {form.dataType === "INT" && (
          <>
            <div>
              <label className="admin-label">Giá trị tối thiểu</label>
              <input
                type="number"
                className="admin-input mt-1"
                value={form.minValue}
                onChange={(e) => patch({ minValue: e.target.value })}
              />
              {errors.minValue && (
                <p className="text-xs text-rose-600 mt-1">{errors.minValue}</p>
              )}
            </div>
            <div>
              <label className="admin-label">Giá trị tối đa</label>
              <input
                type="number"
                className="admin-input mt-1"
                value={form.maxValue}
                onChange={(e) => patch({ maxValue: e.target.value })}
              />
              {errors.maxValue && (
                <p className="text-xs text-rose-600 mt-1">{errors.maxValue}</p>
              )}
            </div>
          </>
        )}
      </div>
    </form>
  );
};

export default ConfigFieldCatalogForm;
