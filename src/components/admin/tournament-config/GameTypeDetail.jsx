import { CircleDot, Layers, Settings2 } from "lucide-react";
import { TABLE_TYPE_LABELS } from "../../../constants/gameTypeConfig";

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

const formatTableTypes = (types) => {
  if (!Array.isArray(types) || types.length === 0) return "—";
  return types.map((t) => TABLE_TYPE_LABELS[t] || t).join(", ");
};

const GameTypeDetail = ({ item, loading }) => {
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

  if (!item?.code) return null;

  const isActive = item.isActive !== false;

  return (
    <div className="catalog-detail">
      <div className="catalog-detail-hero catalog-detail-accent--enum">
        <div className="catalog-detail-hero-icon">
          <CircleDot size={22} strokeWidth={2} />
        </div>
        <div className="catalog-detail-hero-body min-w-0">
          <p className="catalog-detail-hero-eyebrow">Loại bi</p>
          <h4 className="catalog-detail-hero-title">{item.name || item.code}</h4>
          <code className="catalog-detail-hero-key">{item.code}</code>
        </div>
        <span
          className={`catalog-detail-status ${isActive ? "catalog-detail-status--on" : "catalog-detail-status--off"}`}
        >
          {isActive ? "Đang bật" : "Đã tắt"}
        </span>
      </div>

      <div className="catalog-detail-grid">
        <div className="catalog-detail-chip">
          <span className="catalog-detail-chip-label">Số ván thắng mặc định</span>
          <span className="catalog-detail-chip-value">{item.defaultRaceTo ?? "—"}</span>
        </div>
        <div className="catalog-detail-chip">
          <span className="catalog-detail-chip-label">Loại bàn</span>
          <span className="catalog-detail-chip-value text-sm leading-snug">
            {formatTableTypes(item.compatibleTableTypes)}
          </span>
        </div>
        <div className="catalog-detail-chip">
          <span className="catalog-detail-chip-label">Số loại bàn</span>
          <span className="catalog-detail-chip-value">
            {(item.compatibleTableTypes || []).length || 0}
          </span>
        </div>
        <div className="catalog-detail-chip">
          <span className="catalog-detail-chip-label">Owner chọn giải</span>
          <span
            className={`catalog-detail-chip-value ${isActive ? "text-emerald-700" : "text-amber-700"}`}
          >
            {isActive ? "Có thể chọn" : "Đã ẩn"}
          </span>
        </div>
      </div>

      <div className="catalog-detail-section">
        <div className="catalog-detail-section-head">
          <Layers size={16} />
          <span>Mô tả</span>
        </div>
        <p className="catalog-detail-desc">
          {item.description?.trim() || "Chưa có mô tả cho loại bi này."}
        </p>
      </div>

      <div className="catalog-detail-section">
        <div className="catalog-detail-section-head">
          <Settings2 size={16} />
          <span>Thông tin cấu hình</span>
        </div>
        <div className="catalog-detail-specs">
          <SpecCell label="Mã loại bi" value={item.code} mono />
          <SpecCell label="Tên hiển thị" value={item.name || "—"} />
          <SpecCell label="Số ván thắng mặc định" value={item.defaultRaceTo ?? "—"} />
          <SpecCell label="Trạng thái" value={isActive ? "Đang bật" : "Đã tắt"} />
        </div>

        {(item.compatibleTableTypes || []).length > 0 && (
          <div className="catalog-detail-enum mt-4">
            <p className="catalog-detail-spec-label mb-2">Loại bàn tương thích</p>
            <ul className="catalog-detail-enum-list">
              {item.compatibleTableTypes.map((t, idx) => (
                <li key={t}>
                  <span className="catalog-detail-enum-index">{idx + 1}</span>
                  <span>
                    <strong>{TABLE_TYPE_LABELS[t] || t}</strong>
                    <code className="ml-2 text-xs text-slate-500">{t}</code>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default GameTypeDetail;
