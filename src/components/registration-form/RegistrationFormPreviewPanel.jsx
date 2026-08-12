const RegistrationFormPreviewPanel = ({ preview, emptyMessage }) => {
  if (!preview?.fields?.length) {
    return (
      <p className="text-sm text-slate-500 dark:text-white/60 py-8 text-center border border-dashed rounded-lg">
        {emptyMessage || "Chưa có field để preview."}
      </p>
    );
  }

  const renderPreviewInput = (field) => {
    const ui = field.uiComponent;
    const enumOptions = field.enumOptions || [];

    if (ui === "TEXTAREA") {
      return <textarea className="admin-input w-full min-h-[72px]" disabled placeholder={field.placeholder || ""} />;
    }
    if (ui === "NUMBER") {
      return <input type="number" className="admin-input w-full" disabled placeholder={field.placeholder || ""} />;
    }
    if (ui === "CHECKBOX") {
      return (
        <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-white/70">
          <input type="checkbox" disabled />
          {field.defaultValue === "true" ? "Đã chọn" : "Chưa chọn"}
        </label>
      );
    }
    if (ui === "SELECT" || ui === "RADIO") {
      return (
        <select className="admin-select w-full" disabled defaultValue="">
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
      return <input type="date" className="admin-input w-full" disabled />;
    }
    if (ui === "EMAIL_INPUT") {
      return <input type="email" className="admin-input w-full" disabled placeholder={field.placeholder || "email@..."} />;
    }
    if (ui === "PHONE_INPUT") {
      return <input type="tel" className="admin-input w-full" disabled placeholder={field.placeholder || "09..."} />;
    }
    return <input type="text" className="admin-input w-full" disabled placeholder={field.placeholder || ""} />;
  };

  return (
    <div className="space-y-4">
      {(preview.templateName || preview.tournamentName) && (
        <div className="mb-2">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white/85">
            {preview.tournamentName || preview.templateName}
          </h3>
          {(preview.templateDescription || preview.participantType) && (
            <p className="text-sm text-slate-500 dark:text-white/60 mt-1">
              {[preview.templateDescription, preview.participantType].filter(Boolean).join(" · ")}
            </p>
          )}
        </div>
      )}
      {preview.fields.map((field) => (
        <div key={field.fieldKey} className="admin-card p-4">
          <label className="admin-label flex items-center gap-1">
            {field.label}
            {field.isRequired && <span className="text-red-500">*</span>}
          </label>
          {field.description && (
            <p className="text-xs text-slate-500 dark:text-white/60 mb-2">{field.description}</p>
          )}
          {renderPreviewInput(field)}
          {field.defaultValue && field.uiComponent !== "CHECKBOX" && (
            <p className="text-xs text-slate-400 dark:text-white/40 mt-1">Mặc định: {field.defaultValue}</p>
          )}
        </div>
      ))}
    </div>
  );
};

export default RegistrationFormPreviewPanel;
