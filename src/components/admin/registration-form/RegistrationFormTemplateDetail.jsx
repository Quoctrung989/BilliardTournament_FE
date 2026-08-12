import { Braces, CheckCircle, FileText, Layers, XCircle } from "lucide-react";

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

const RegistrationFormTemplateDetail = ({ item, loading }) => {
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

  if (!item?.id) return null;

  const isActive = item.isActive !== false;
  const isReady = item.isReady === true;

  return (
    <div className="catalog-detail">
      {/* Hero */}
      <div className="catalog-detail-hero catalog-detail-accent--enum">
        <div className="catalog-detail-hero-icon">
          <FileText size={22} strokeWidth={2} />
        </div>
        <div className="catalog-detail-hero-body min-w-0">
          <p className="catalog-detail-hero-eyebrow">Template form đăng ký</p>
          <h4 className="catalog-detail-hero-title">{item.name || item.code}</h4>
          <code className="catalog-detail-hero-key">{item.code}</code>
        </div>
        <span className={`catalog-detail-status ${isActive ? "catalog-detail-status--on" : "catalog-detail-status--off"}`}>
          {isActive ? "Đang bật" : "Đã tắt"}
        </span>
      </div>

      {/* Chips */}
      <div className="catalog-detail-grid">
        <div className="catalog-detail-chip">
          <span className="catalog-detail-chip-label">Số field</span>
          <span className="catalog-detail-chip-value">{item.fieldCount ?? 0}</span>
        </div>
        <div className="catalog-detail-chip">
          <span className="catalog-detail-chip-label">Trạng thái sẵn sàng</span>
          <span className={`catalog-detail-chip-value flex items-center gap-1 ${isReady ? "text-emerald-700" : "text-amber-700"}`}>
            {isReady
              ? <><CheckCircle size={14} /> Đủ field</>
              : <><XCircle size={14} /> Thiếu field</>}
          </span>
        </div>
        <div className="catalog-detail-chip">
          <span className="catalog-detail-chip-label">Owner dùng được</span>
          <span className={`catalog-detail-chip-value ${isActive && isReady ? "text-emerald-700" : "text-amber-700"}`}>
            {isActive && isReady ? "Có thể chọn" : "Chưa sẵn sàng"}
          </span>
        </div>
        <div className="catalog-detail-chip">
          <span className="catalog-detail-chip-label">Kích hoạt</span>
          <span className={`catalog-detail-chip-value ${isActive ? "text-emerald-700" : "text-slate-500 dark:text-white/60"}`}>
            {isActive ? "Đang bật" : "Đã tắt"}
          </span>
        </div>
      </div>

      {/* Thông số */}
      <div className="catalog-detail-section">
        <div className="catalog-detail-section-head">
          <Braces size={16} />
          <span>Thông tin template</span>
        </div>
        <div className="catalog-detail-specs">
          <SpecCell label="Mã template" value={item.code} mono />
          <SpecCell label="Tên hiển thị" value={item.name || "—"} />
          <SpecCell label="Số field cấu hình" value={item.fieldCount ?? 0} />
          <SpecCell label="Trạng thái" value={isReady ? "Sẵn sàng" : "Thiếu field"} />
        </div>
      </div>

      {item.description && (
        <div className="catalog-detail-section">
          <div className="catalog-detail-section-head">
            <Layers size={16} />
            <span>Mô tả</span>
          </div>
          <p className="catalog-detail-desc">{item.description}</p>
        </div>
      )}
    </div>
  );
};

export default RegistrationFormTemplateDetail;
