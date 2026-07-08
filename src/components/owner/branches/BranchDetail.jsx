import { Image as ImageIcon, Layers, MapPin, Phone } from "lucide-react";
import { BRANCH_STATUS_LABELS } from "../../../constants/branchConfig";

const SpecCell = ({ label, value, mono = false }) => (
  <div className="catalog-detail-spec">
    <span className="catalog-detail-spec-label">{label}</span>
    {mono ? (
      <code className="catalog-detail-spec-code">{value}</code>
    ) : (
      <span className="catalog-detail-spec-value">{value ?? "—"}</span>
    )}
  </div>
);

const formatDate = (value) => {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleDateString("vi-VN");
  } catch {
    return value;
  }
};

const BranchDetail = ({ item, loading }) => {
  if (loading) {
    return (
      <div className="catalog-detail catalog-detail--loading">
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

  if (!item) return null;

  const isActive = item.status === "ACTIVE";
  const images = item.images || [];

  return (
    <div className="catalog-detail">
      {/* Hero */}
      <div className={`catalog-detail-hero ${isActive ? "catalog-detail-accent--boolean" : "catalog-detail-accent--string"}`}>
        <div className="catalog-detail-hero-icon">
          <MapPin size={22} strokeWidth={2} />
        </div>
        <div className="catalog-detail-hero-body min-w-0">
          <p className="catalog-detail-hero-eyebrow">Chi nhánh</p>
          <h4 className="catalog-detail-hero-title">{item.name}</h4>
          <code className="catalog-detail-hero-key">{item.address}</code>
        </div>
        <span className={`catalog-detail-status ${isActive ? "catalog-detail-status--on" : "catalog-detail-status--off"}`}>
          {BRANCH_STATUS_LABELS[item.status] ?? item.status}
        </span>
      </div>

      {/* Chips */}
      <div className="catalog-detail-grid">
        <div className="catalog-detail-chip">
          <span className="catalog-detail-chip-label">Trạng thái</span>
          <span className={`catalog-detail-chip-value ${isActive ? "text-emerald-700" : "text-rose-700"}`}>
            {BRANCH_STATUS_LABELS[item.status] ?? item.status}
          </span>
        </div>
        <div className="catalog-detail-chip">
          <span className="catalog-detail-chip-label">Số điện thoại</span>
          <span className="catalog-detail-chip-value">{item.phone || "—"}</span>
        </div>
        <div className="catalog-detail-chip">
          <span className="catalog-detail-chip-label">Số ảnh</span>
          <span className="catalog-detail-chip-value">{images.length}</span>
        </div>
        <div className="catalog-detail-chip">
          <span className="catalog-detail-chip-label">Ngày tạo</span>
          <span className="catalog-detail-chip-value">{formatDate(item.createdAt)}</span>
        </div>
      </div>

      {/* Thông tin */}
      <div className="catalog-detail-section">
        <div className="catalog-detail-section-head">
          <Phone size={16} />
          <span>Thông tin liên hệ</span>
        </div>
        <div className="catalog-detail-specs">
          <SpecCell label="Địa chỉ" value={item.address} />
          <SpecCell label="Số điện thoại" value={item.phone || "—"} />
        </div>
      </div>

      {/* Mô tả */}
      {item.description && (
        <div className="catalog-detail-section">
          <div className="catalog-detail-section-head">
            <Layers size={16} />
            <span>Mô tả</span>
          </div>
          <p className="catalog-detail-desc">{item.description}</p>
        </div>
      )}

      {/* Hình ảnh */}
      <div className="catalog-detail-section">
        <div className="catalog-detail-section-head">
          <ImageIcon size={16} />
          <span>Hình ảnh</span>
        </div>
        {images.length === 0 ? (
          <p className="catalog-detail-desc">Chưa có ảnh cho chi nhánh này.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {images.map((img) => (
              <img
                key={img.key}
                src={img.url}
                alt=""
                className="h-24 w-24 rounded-lg object-cover border border-slate-200"
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BranchDetail;
