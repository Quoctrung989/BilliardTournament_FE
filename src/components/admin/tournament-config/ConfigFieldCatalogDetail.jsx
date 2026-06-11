import {
  Braces,
  CheckSquare,
  Hash,
  Layers,
  List,
  Type,
} from "lucide-react";
import {
  CATALOG_DATA_TYPE_LABELS,
  CATALOG_SCOPE_LABELS,
  CATALOG_UI_LABELS,
  UI_COMPONENT_BY_DATA_TYPE,
} from "../../../constants/configFieldCatalog";

const TYPE_META = {
  BOOLEAN: { icon: CheckSquare, accent: "catalog-detail-accent--boolean" },
  INT: { icon: Hash, accent: "catalog-detail-accent--int" },
  ENUM: { icon: List, accent: "catalog-detail-accent--enum" },
  STRING: { icon: Type, accent: "catalog-detail-accent--string" },
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

const ConfigFieldCatalogDetail = ({ item, loading }) => {
  if (loading) {
    return (
      <div className="catalog-detail catalog-detail--loading">
        <div className="catalog-detail-hero admin-skeleton" />
        <div className="grid grid-cols-2 gap-3">
          <div className="admin-skeleton h-16 rounded-xl" />
          <div className="admin-skeleton h-16 rounded-xl" />
          <div className="admin-skeleton h-16 rounded-xl" />
          <div className="admin-skeleton h-16 rounded-xl" />
        </div>
        <div className="admin-skeleton h-28 rounded-xl" />
      </div>
    );
  }

  if (!item?.fieldKey) return null;

  const scope = item.fieldScope || item.scope;
  const isActive = item.isActive !== false;
  const enumOptions = Array.isArray(item.enumOptions) ? item.enumOptions : [];
  const typeMeta = TYPE_META[item.dataType] || { icon: Braces, accent: "catalog-detail-accent--string" };
  const TypeIcon = typeMeta.icon;
  const mappedUi = UI_COMPONENT_BY_DATA_TYPE[item.dataType];

  return (
    <div className="catalog-detail">
      <div className={`catalog-detail-hero ${typeMeta.accent}`}>
        <div className="catalog-detail-hero-icon">
          <TypeIcon size={22} strokeWidth={2} />
        </div>
        <div className="catalog-detail-hero-body min-w-0">
          <p className="catalog-detail-hero-eyebrow">Trường cấu hình</p>
          <h4 className="catalog-detail-hero-title">{item.label || item.fieldKey}</h4>
          <code className="catalog-detail-hero-key">{item.fieldKey}</code>
        </div>
        <span
          className={`catalog-detail-status ${isActive ? "catalog-detail-status--on" : "catalog-detail-status--off"}`}
        >
          {isActive ? "Đang bật" : "Đã tắt"}
        </span>
      </div>

      <div className="catalog-detail-grid">
        <div className="catalog-detail-chip">
          <span className="catalog-detail-chip-label">Kiểu dữ liệu</span>
          <span className="catalog-detail-chip-value">
            {CATALOG_DATA_TYPE_LABELS[item.dataType] || item.dataType || "—"}
          </span>
        </div>
        <div className="catalog-detail-chip">
          <span className="catalog-detail-chip-label">Thành phần UI</span>
          <span className="catalog-detail-chip-value">
            {CATALOG_UI_LABELS[item.uiComponent] || item.uiComponent || "—"}
          </span>
        </div>
        <div className="catalog-detail-chip">
          <span className="catalog-detail-chip-label">Phạm vi áp dụng</span>
          <span className="catalog-detail-chip-value">
            {CATALOG_SCOPE_LABELS[scope] || scope || "—"}
          </span>
        </div>
        <div className="catalog-detail-chip">
          <span className="catalog-detail-chip-label">Kiểm tra BE</span>
          <span
            className={`catalog-detail-chip-value ${
              mappedUi === item.uiComponent ? "text-emerald-700" : "text-amber-700"
            }`}
          >
            {mappedUi === item.uiComponent
              ? "Hợp lệ"
              : `Cần ${CATALOG_UI_LABELS[mappedUi] || mappedUi || "—"}`}
          </span>
        </div>
      </div>

      <div className="catalog-detail-section">
        <div className="catalog-detail-section-head">
          <Layers size={16} />
          <span>Mô tả & gợi ý</span>
        </div>
        <p className="catalog-detail-desc">
          {item.description?.trim() || "Chưa có mô tả cho trường này."}
        </p>
      </div>

      <div className="catalog-detail-section">
        <div className="catalog-detail-section-head">
          <Braces size={16} />
          <span>Thông số kỹ thuật</span>
        </div>
        <div className="catalog-detail-specs">
          <SpecCell
            label="Kiểu dữ liệu"
            value={CATALOG_DATA_TYPE_LABELS[item.dataType] || item.dataType || "—"}
          />
          <SpecCell
            label="Thành phần UI"
            value={CATALOG_UI_LABELS[item.uiComponent] || item.uiComponent || "—"}
            mono
          />
          <SpecCell
            label="Phạm vi"
            value={CATALOG_SCOPE_LABELS[scope] || scope || "—"}
          />
          <SpecCell label="Mã trường" value={item.fieldKey} mono />

          {item.dataType === "INT" && (
            <>
              <SpecCell
                label="Giá trị tối thiểu"
                value={item.minValue != null ? String(item.minValue) : "—"}
              />
              <SpecCell
                label="Giá trị tối đa"
                value={item.maxValue != null ? String(item.maxValue) : "—"}
              />
            </>
          )}
        </div>

        {item.dataType === "ENUM" && (
          <div className="catalog-detail-enum mt-4">
            <p className="catalog-detail-spec-label mb-2">Các giá trị chọn</p>
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

export default ConfigFieldCatalogDetail;
