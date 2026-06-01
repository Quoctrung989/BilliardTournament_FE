/** Snapshot form wizard — chỉ gọi PUT khi dữ liệu thay đổi */

export const serializeInfo = (info) =>
  JSON.stringify({
    code: (info.code || "").trim(),
    name: (info.name || "").trim(),
    description: (info.description || "").trim(),
    handlerKey: (info.handlerKey || "").trim(),
    schemaVersion: info.schemaVersion || "1.0",
    isActive: !!info.isActive,
  });

export const serializeFields = (fields) =>
  JSON.stringify(
    (fields || [])
      .map((f) => ({
        fieldKey: f.fieldKey,
        defaultValue: String(f.defaultValue ?? ""),
        isRequired: !!f.isRequired,
        isVisibleToOwner: f.isVisibleToOwner !== false,
      }))
      .sort((a, b) => (a.fieldKey || "").localeCompare(b.fieldKey || ""))
  );

export const serializeRules = (rules) =>
  JSON.stringify(
    (rules || [])
      .map((r) => ({
        roundKey: r.roundKey || "",
        label: r.label || "",
        bracketPhase: r.bracketPhase || "KNOCKOUT",
        raceTo: Number(r.raceTo) || 1,
        id: r.id ?? null,
      }))
      .sort((a, b) => {
        const ka = a.id ?? a.roundKey;
        const kb = b.id ?? b.roundKey;
        return String(ka).localeCompare(String(kb));
      })
  );

export const isDirty = (baseline, currentSerializer, currentData) => {
  if (baseline == null) return true;
  return baseline !== currentSerializer(currentData);
};
