const DynamicConfigFieldForm = ({ fields, onChange, onRemove }) => {
  if (!fields?.length) {
    return (
      <p className="text-sm text-gray-500 py-6 text-center border border-dashed rounded-lg bg-white dark:bg-[#161a22]">
        Chưa có config — dùng Bootstrap hoặc cấu hình thủ công
      </p>
    );
  }

  const updateField = (index, patch) => {
    const next = fields.map((f, i) => (i === index ? { ...f, ...patch } : f));
    onChange(next);
  };

  const renderValueInput = (field, index) => {
    const ui = field.uiComponent || field.catalog?.uiComponent;
    const value = field.defaultValue ?? "";
    const enumOptions = field.enumOptions || field.catalog?.enumOptions || [];

    if (ui === "NUMBER") {
      return (
        <input
          type="number"
          className="border rounded px-2 py-1 text-sm w-full"
          min={field.minValue ?? field.catalog?.minValue}
          max={field.maxValue ?? field.catalog?.maxValue}
          value={value}
          onChange={(e) => updateField(index, { defaultValue: e.target.value })}
        />
      );
    }

    if (ui === "CHECKBOX") {
      const checked = String(value) === "true";
      return (
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) =>
              updateField(index, { defaultValue: e.target.checked ? "true" : "false" })
            }
          />
          <span className="text-sm">{checked ? "Bật" : "Tắt"}</span>
        </label>
      );
    }

    if (ui === "SELECT") {
      return (
        <select
          className="border rounded px-2 py-1 text-sm w-full"
          value={value}
          onChange={(e) => updateField(index, { defaultValue: e.target.value })}
        >
          <option value="">-- Chọn --</option>
          {enumOptions.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      );
    }

    return (
      <input
        type="text"
        className="border rounded px-2 py-1 text-sm w-full"
        value={value}
        onChange={(e) => updateField(index, { defaultValue: e.target.value })}
      />
    );
  };

  return (
    <div className="space-y-4">
      {fields.map((field, index) => (
        <div
          key={field.id ?? field.fieldKey ?? index}
          className="admin-card p-4"
        >
          <div className="flex justify-between items-start gap-4 mb-3">
            <div>
              <h4 className="font-semibold text-slate-800 dark:text-white/85">
                {field.label || field.fieldKey}
              </h4>
              {(field.description || field.catalog?.description) && (
                <p className="text-xs text-gray-500 mt-1">
                  {field.description || field.catalog?.description}
                </p>
              )}
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="text-xs text-gray-500 block mb-1">Giá trị mặc định</label>
              {renderValueInput(field, index)}
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={!!field.isRequired}
                  onChange={(e) => updateField(index, { isRequired: e.target.checked })}
                />
                Bắt buộc
              </label>
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={field.isVisibleToOwner !== false}
                  onChange={(e) =>
                    updateField(index, { isVisibleToOwner: e.target.checked })
                  }
                />
                Hiển thị cho Owner
              </label>
            </div>
            <div className="text-xs text-gray-400 flex items-end">
              Key: {field.fieldKey}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default DynamicConfigFieldForm;
