const TournamentConfigFieldForm = ({ fields, onChange }) => {
  if (!fields?.length) {
    return (
      <p className="text-sm text-gray-500 py-6 text-center border border-dashed rounded-lg bg-white">
        Chưa có trường cấu hình cho thể thức này
      </p>
    );
  }

  const updateField = (index, patch) => {
    onChange(fields.map((f, i) => (i === index ? { ...f, ...patch } : f)));
  };

  const renderValueInput = (field, index) => {
    const ui = field.uiComponent;
    const value = field.value ?? field.defaultValue ?? "";
    const enumOptions = field.enumOptions || [];

    if (ui === "NUMBER") {
      return (
        <input
          type="number"
          className="admin-input w-full"
          min={field.minValue}
          max={field.maxValue}
          value={value}
          onChange={(e) => updateField(index, { value: e.target.value })}
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
              updateField(index, { value: e.target.checked ? "true" : "false" })
            }
          />
          <span className="text-sm">{checked ? "Bật" : "Tắt"}</span>
        </label>
      );
    }

    if (ui === "SELECT") {
      return (
        <select
          className="admin-select w-full"
          value={value}
          onChange={(e) => updateField(index, { value: e.target.value })}
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
        className="admin-input w-full"
        value={value}
        onChange={(e) => updateField(index, { value: e.target.value })}
      />
    );
  };

  return (
    <div className="space-y-4">
      {fields.map((field, index) => (
        <div
          key={field.fieldKey ?? index}
          className="admin-card p-4 grid gap-2 sm:grid-cols-[1fr_2fr] sm:items-center"
        >
          <div>
            <p className="font-medium text-slate-800">
              {field.label || field.fieldKey}
              {field.isRequired && <span className="text-red-500 ml-1">*</span>}
            </p>
            {field.description && (
              <p className="text-xs text-slate-500 mt-0.5">{field.description}</p>
            )}
            {field.source && (
              <p className="text-[10px] uppercase tracking-wide text-slate-400 mt-1">
                {field.source === "TOURNAMENT" ? "Đã chỉnh" : "Mặc định Admin"}
              </p>
            )}
          </div>
          <div>{renderValueInput(field, index)}</div>
        </div>
      ))}
    </div>
  );
};

export default TournamentConfigFieldForm;
