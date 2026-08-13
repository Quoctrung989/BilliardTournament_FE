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

    // bracket_size là giá trị DẪN XUẤT — backend luôn trả về số cơ thủ đang thực sự có mặt
    // trong giải. Cho sửa sẽ gây hiểu nhầm: nhập gì cũng bị ghi đè ở lần tải lại kế tiếp.
    if (field.fieldKey === "bracket_size") {
      return (
        <div className="pt-1">
          <span className="text-lg font-bold text-slate-900">{value || 0}</span>
          <span className="ml-1.5 text-sm text-slate-500">người</span>
          <p className="text-xs text-slate-400 mt-1">
            Tự động theo số cơ thủ hiện có trong giải, không chỉnh tay được.
          </p>
        </div>
      );
    }

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
        <div className="flex items-center gap-2.5 pt-1">
          <button
            type="button"
            role="switch"
            aria-checked={checked}
            data-on={String(checked)}
            onClick={() => updateField(index, { value: checked ? "false" : "true" })}
            className="admin-toggle flex-shrink-0"
          >
            <span className="admin-toggle-knob" />
          </button>
          <span className={`text-sm font-medium ${checked ? "text-green-700" : "text-slate-400"}`}>
            {checked ? "Kích hoạt" : "Tắt"}
          </span>
        </div>
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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {fields.map((field, index) => (
        <div key={field.fieldKey ?? index} className="admin-card p-4">
          <div className="mb-3">
            <div className="flex items-start justify-between gap-2">
              <p className="font-medium text-slate-800 text-sm leading-snug">
                {field.label || field.fieldKey}
                {field.isRequired && <span className="text-red-500 ml-1">*</span>}
              </p>
              {field.source && (
                <span className="flex-shrink-0 text-[10px] uppercase tracking-wide text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                  {field.source === "TOURNAMENT" ? "Đã chỉnh" : "Mặc định"}
                </span>
              )}
            </div>
            {field.description && (
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">{field.description}</p>
            )}
          </div>
          <div>{renderValueInput(field, index)}</div>
        </div>
      ))}
    </div>
  );
};

export default TournamentConfigFieldForm;
