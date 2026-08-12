const RegistrationDynamicForm = ({ fields, values, onChange, disabled }) => {
  if (!fields?.length) {
    return <p className="text-sm text-slate-500 dark:text-white/60">Form đăng ký chưa được cấu hình.</p>;
  }

  const setValue = (fieldKey, value) => {
    onChange({ ...values, [fieldKey]: value });
  };

  const renderInput = (field) => {
    const value = values[field.fieldKey] ?? field.defaultValue ?? "";
    const ui = field.uiComponent;
    const enumOptions = field.enumOptions || [];

    if (ui === "TEXTAREA") {
      return (
        <textarea
          className="admin-input w-full min-h-[80px]"
          value={value}
          disabled={disabled}
          placeholder={field.placeholder || ""}
          onChange={(e) => setValue(field.fieldKey, e.target.value)}
        />
      );
    }
    if (ui === "NUMBER") {
      return (
        <input
          type="number"
          className="admin-input w-full"
          value={value}
          disabled={disabled}
          min={field.minValue ?? undefined}
          max={field.maxValue ?? undefined}
          placeholder={field.placeholder || ""}
          onChange={(e) => setValue(field.fieldKey, e.target.value)}
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
            disabled={disabled}
            onChange={(e) => setValue(field.fieldKey, e.target.checked ? "true" : "false")}
          />
          <span className="text-sm">{checked ? "Có" : "Không"}</span>
        </label>
      );
    }
    if (ui === "SELECT" || ui === "RADIO") {
      return (
        <select
          className="admin-select w-full"
          value={value}
          disabled={disabled}
          onChange={(e) => setValue(field.fieldKey, e.target.value)}
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
    if (ui === "DATE_PICKER") {
      return (
        <input
          type="date"
          className="admin-input w-full"
          value={value}
          disabled={disabled}
          onChange={(e) => setValue(field.fieldKey, e.target.value)}
        />
      );
    }
    if (ui === "EMAIL_INPUT") {
      return (
        <input
          type="email"
          className="admin-input w-full"
          value={value}
          disabled={disabled}
          placeholder={field.placeholder || "email@example.com"}
          onChange={(e) => setValue(field.fieldKey, e.target.value)}
        />
      );
    }
    if (ui === "PHONE_INPUT") {
      return (
        <input
          type="tel"
          className="admin-input w-full"
          value={value}
          disabled={disabled}
          placeholder={field.placeholder || "09xxxxxxxx"}
          onChange={(e) => setValue(field.fieldKey, e.target.value)}
        />
      );
    }
    return (
      <input
        type="text"
        className="admin-input w-full"
        value={value}
        disabled={disabled}
        placeholder={field.placeholder || ""}
        onChange={(e) => setValue(field.fieldKey, e.target.value)}
      />
    );
  };

  return (
    <div className="space-y-4">
      {fields.map((field) => (
        <div key={field.fieldKey}>
          <label className="admin-label flex items-center gap-1">
            {field.label}
            {field.isRequired && <span className="text-red-500">*</span>}
          </label>
          {field.description && (
            <p className="text-xs text-slate-500 dark:text-white/60 mb-1">{field.description}</p>
          )}
          {renderInput(field)}
        </div>
      ))}
    </div>
  );
};

export default RegistrationDynamicForm;
