const DynamicRegistrationTemplateFieldForm = ({ fields, onChange, onRemove }) => {
  if (!fields?.length) {
    return (
      <p className="text-sm text-gray-500 py-6 text-center border border-dashed rounded-lg bg-white">
        Chưa có field — thêm từ catalog bên dưới
      </p>
    );
  }

  const updateField = (index, patch) => {
    onChange(fields.map((f, i) => (i === index ? { ...f, ...patch } : f)));
  };

  return (
    <div className="space-y-4">
      {fields.map((field, index) => (
        <div key={field.fieldKey ?? index} className="admin-card p-4">
          <div className="flex justify-between items-start gap-4 mb-3">
            <div>
              <h4 className="font-semibold text-slate-800">
                {field.labelOverride || field.label || field.fieldKey}
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                <code>{field.fieldKey}</code>
                {" · "}
                {field.dataType} / {field.uiComponent}
              </p>
            </div>
            {onRemove && (
              <button
                type="button"
                className="text-red-500 text-xs hover:underline"
                onClick={() => onRemove(index)}
              >
                Xóa
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 block mb-1">Override label</label>
              <input
                className="admin-input w-full"
                value={field.labelOverride || ""}
                onChange={(e) => updateField(index, { labelOverride: e.target.value })}
                placeholder={field.label}
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Placeholder</label>
              <input
                className="admin-input w-full"
                value={field.placeholder || ""}
                onChange={(e) => updateField(index, { placeholder: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Giá trị mặc định</label>
              <input
                className="admin-input w-full"
                value={field.defaultValue || ""}
                onChange={(e) => updateField(index, { defaultValue: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Validation regex</label>
              <input
                className="admin-input w-full"
                value={field.validationRegex || ""}
                onChange={(e) => updateField(index, { validationRegex: e.target.value })}
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs text-gray-500 block mb-1">Override mô tả</label>
              <textarea
                className="admin-input w-full min-h-[60px]"
                value={field.descriptionOverride || ""}
                onChange={(e) => updateField(index, { descriptionOverride: e.target.value })}
                placeholder={field.description}
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Thứ tự</label>
              <input
                type="number"
                min={0}
                className="admin-input w-full"
                value={field.sortOrder ?? index}
                onChange={(e) => updateField(index, { sortOrder: Number(e.target.value) })}
              />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={field.isRequired !== false}
                  onChange={(e) => updateField(index, { isRequired: e.target.checked })}
                />
                Bắt buộc
              </label>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default DynamicRegistrationTemplateFieldForm;
