import {
  Braces,
  Calendar,
  CheckSquare,
  Hash,
  Layers,
  List,
  Mail,
  Phone,
  Type,
} from "lucide-react";
import {
  REGISTRATION_DATA_TYPES,
  REGISTRATION_UI_COMPONENTS,
} from "../../../constants/registrationFormConfig";

const DATA_TYPE_LABELS = Object.fromEntries(
  REGISTRATION_DATA_TYPES.map((t) => [t.value, t.label])
);
const UI_LABELS = Object.fromEntries(
  REGISTRATION_UI_COMPONENTS.map((t) => [t.value, t.label])
);

const TYPE_META = {
  STRING:  { icon: Type,        accent: "catalog-detail-accent--string" },
  INT:     { icon: Hash,        accent: "catalog-detail-accent--int" },
  DECIMAL: { icon: Hash,        accent: "catalog-detail-accent--int" },
  BOOLEAN: { icon: CheckSquare, accent: "catalog-detail-accent--boolean" },
  ENUM:    { icon: List,        accent: "catalog-detail-accent--enum" },
  DATE:    { icon: Calendar,    accent: "catalog-detail-accent--string" },
  PHONE:   { icon: Phone,       accent: "catalog-detail-accent--string" },
  EMAIL:   { icon: Mail,        accent: "catalog-detail-accent--string" },
};

const SpecCell = ({ label, value, mono = false }) => (
  <div className="catalog-detail-spec">
    <span className="catalog-detail-spec-label">{label}</span>
    {mono ? (
      <code className="catalog-detail-spec-code">{value}</code>
    ) : (
      <span className="catalog-detail-spec-value">{value}</span>
    )}
  </div>
);

const RegistrationFieldDetail = ({ item, loading }) => {
  if (loading) {
    return (
      <div className="catalog-detail">
        <div className="catalog-detail-hero admin-skeleton" style={{ height: 88 }} />
        <div className="grid grid-cols-2 gap-3">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="admin-skeleton h-16 rounded-xl" />
          ))}
        </div>
        <div className="admin-skeleton h-24 rounded-xl" />
      </div>
    );
  }

  if (!item?.fieldKey) return null;

  const isActive = item.isActive !== false;
  const enumOptions = Array.isArray(item.enumOptions) ? item.enumOptions : [];
  const typeMeta = TYPE_META[item.dataType] || { icon: Braces, accent: "catalog-detail-accent--string" };
  const TypeIcon = typeMeta.icon;

  return (
    <div className="catalog-detail">
      {/* Hero */}
      <div className={`catalog-detail-hero ${typeMeta.accent}`}>
        <div className="catalog-detail-hero-icon">
          <TypeIcon size={22} strokeWidth={2} />
        </div>
        <div className="catalog-detail-hero-body min-w-0">
          <p className="catalog-detail-hero-eyebrow">Field đăng ký</p>
          <h4 className="catalog-detail-hero-title">{item.label || item.fieldKey}</h4>
          <code className="catalog-detail-hero-key">{item.fieldKey}</code>
        </div>
        <span className={`catalog-detail-status ${isActive ? "catalog-detail-status--on" : "catalog-detail-status--off"}`}>
          {isActive ? "Đang bật" : "Đã tắt"}
        </span>
      </div>

      {/* Chips */}
      <div className="catalog-detail-grid">
        <div className="catalog-detail-chip">
          <span className="catalog-detail-chip-label">Kiểu dữ liệu</span>
          <span className="catalog-detail-chip-value">
            {DATA_TYPE_LABELS[item.dataType] || item.dataType || "—"}
          </span>
        </div>
        <div className="catalog-detail-chip">
          <span className="catalog-detail-chip-label">Thành phần UI</span>
          <span className="catalog-detail-chip-value">
            {UI_LABELS[item.uiComponent] || item.uiComponent || "—"}
          </span>
        </div>
        <div className="catalog-detail-chip">
          <span className="catalog-detail-chip-label">Giá trị tối thiểu</span>
          <span className="catalog-detail-chip-value">{item.minValue ?? "—"}</span>
        </div>
        <div className="catalog-detail-chip">
          <span className="catalog-detail-chip-label">Giá trị tối đa</span>
          <span className="catalog-detail-chip-value">{item.maxValue ?? "—"}</span>
        </div>
      </div>

      {/* Mô tả */}
      <div className="catalog-detail-section">
        <div className="catalog-detail-section-head">
          <Layers size={16} />
          <span>Mô tả</span>
        </div>
        <p className="catalog-detail-desc">
          {item.description?.trim() || "Chưa có mô tả cho field này."}
        </p>
      </div>

      {/* Thông số */}
      <div className="catalog-detail-section">
        <div className="catalog-detail-section-head">
          <Braces size={16} />
          <span>Thông số kỹ thuật</span>
        </div>
        <div className="catalog-detail-specs">
          <SpecCell label="Field Key" value={item.fieldKey} mono />
          <SpecCell label="Nhãn hiển thị" value={item.label || "—"} />
          <SpecCell label="Kiểu dữ liệu" value={DATA_TYPE_LABELS[item.dataType] || item.dataType || "—"} />
          <SpecCell label="Thành phần UI" value={UI_LABELS[item.uiComponent] || item.uiComponent || "—"} mono />
          {(item.dataType === "INT" || item.dataType === "DECIMAL") && (
            <>
              <SpecCell label="Min" value={item.minValue != null ? String(item.minValue) : "—"} />
              <SpecCell label="Max" value={item.maxValue != null ? String(item.maxValue) : "—"} />
            </>
          )}
        </div>

        {item.dataType === "ENUM" && (
          <div className="catalog-detail-enum mt-4">
            <p className="catalog-detail-spec-label mb-2">Các giá trị lựa chọn</p>
            {enumOptions.length > 0 ? (
              <ul className="catalog-detail-enum-list">
                {enumOptions.map((opt, idx) => (
                  <li key={opt}>
                    <span className="catalog-detail-enum-index">{idx + 1}</span>
                    <code>{opt}</code>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-400">Chưa khai báo giá trị enum.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default RegistrationFieldDetail;
