import { Braces, Layers, MapPin } from "lucide-react";
import { ACCOUNT_ROLE_LABELS, ACCOUNT_STATUS_LABELS } from "../../../constants/accountConfig";

const STATUS_ACCENT = {
  ACTIVE:   "catalog-detail-accent--boolean",
  LOCKED:   "catalog-detail-accent--string",
  INACTIVE: "catalog-detail-accent--string",
  PENDING:  "catalog-detail-accent--int",
};

const STATUS_CLASS = {
  ACTIVE:   "catalog-detail-status--on",
  LOCKED:   "catalog-detail-status--off",
  INACTIVE: "catalog-detail-status--off",
  PENDING:  "catalog-detail-status--off",
};

const ROLE_COLOR = {
  ADMIN:   "text-violet-700",
  OWNER:   "text-indigo-700",
  MANAGER: "text-sky-700",
  STAFF:   "text-cyan-700",
  PLAYER:  "text-slate-600",
};

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
  try { return new Date(value).toLocaleDateString("vi-VN"); }
  catch { return value; }
};

const AvatarHero = ({ row }) => {
  const name = row.fullName || row.displayName || row.email || "?";
  const initial = name.charAt(0).toUpperCase();
  if (row.avatarUrl) {
    return (
      <img
        src={row.avatarUrl}
        alt=""
        className="h-11 w-11 rounded-full object-cover ring-2 ring-white shadow flex-shrink-0"
      />
    );
  }
  return (
    <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 text-base font-bold flex-shrink-0">
      {initial}
    </span>
  );
};

const AccountDetail = ({ item, loading }) => {
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

  if (!item) return null;

  const status = item.status || "INACTIVE";
  const role   = item.role   || "PLAYER";
  const isActive = status === "ACTIVE";

  return (
    <div className="catalog-detail">
      {/* Hero */}
      <div className={`catalog-detail-hero ${STATUS_ACCENT[status] || "catalog-detail-accent--string"}`}>
        <AvatarHero row={item} />
        <div className="catalog-detail-hero-body min-w-0">
          <p className="catalog-detail-hero-eyebrow">
            {ACCOUNT_ROLE_LABELS[role] || role}
          </p>
          <h4 className="catalog-detail-hero-title">
            {item.fullName || item.displayName || item.email}
          </h4>
          <code className="catalog-detail-hero-key">{item.email}</code>
        </div>
        <span className={`catalog-detail-status ${STATUS_CLASS[status] || "catalog-detail-status--off"}`}>
          {ACCOUNT_STATUS_LABELS[status] || status}
        </span>
      </div>

      {/* Chips */}
      <div className="catalog-detail-grid">
        <div className="catalog-detail-chip">
          <span className="catalog-detail-chip-label">Vai trò</span>
          <span className={`catalog-detail-chip-value ${ROLE_COLOR[role] || ""}`}>
            {ACCOUNT_ROLE_LABELS[role] || role}
          </span>
        </div>
        <div className="catalog-detail-chip">
          <span className="catalog-detail-chip-label">Trạng thái</span>
          <span className={`catalog-detail-chip-value ${isActive ? "text-emerald-700" : "text-rose-700"}`}>
            {ACCOUNT_STATUS_LABELS[status] || status}
          </span>
        </div>
        <div className="catalog-detail-chip">
          <span className="catalog-detail-chip-label">Số điện thoại</span>
          <span className="catalog-detail-chip-value">{item.phone || "—"}</span>
        </div>
        <div className="catalog-detail-chip">
          <span className="catalog-detail-chip-label">Giới tính</span>
          <span className="catalog-detail-chip-value">
            {item.gender === "MALE" ? "Nam" : item.gender === "FEMALE" ? "Nữ" : item.gender || "—"}
          </span>
        </div>
      </div>

      {/* Thông tin */}
      <div className="catalog-detail-section">
        <div className="catalog-detail-section-head">
          <Braces size={16} />
          <span>Thông tin tài khoản</span>
        </div>
        <div className="catalog-detail-specs">
          <SpecCell label="Email" value={item.email} mono />
          <SpecCell label="Tên hiển thị" value={item.displayName} />
          <SpecCell label="Họ tên" value={item.fullName} />
          <SpecCell label="Ngày sinh" value={formatDate(item.dateOfBirth)} />
          {item.profileCompleted != null && (
            <SpecCell
              label="Hồ sơ"
              value={item.profileCompleted ? "Đã hoàn tất" : "Chưa hoàn tất"}
            />
          )}
        </div>
      </div>

      {/* Phân quyền chi nhánh */}
      {(role === "MANAGER" || (role === "STAFF" && item.branchName)) && (
        <div className="catalog-detail-section">
          <div className="catalog-detail-section-head">
            <MapPin size={16} />
            <span>Phân quyền chi nhánh</span>
          </div>
          {role === "MANAGER" ? (
            item.manageAllBranches ? (
              <p className="catalog-detail-desc">Quản lý toàn chuỗi (tất cả chi nhánh).</p>
            ) : (
              <p className="catalog-detail-desc">
                Quản lý theo chi nhánh cụ thể — {(item.branchIds || []).length} chi nhánh được gán.
              </p>
            )
          ) : (
            <p className="catalog-detail-desc">Làm việc tại chi nhánh: <strong>{item.branchName}</strong></p>
          )}
        </div>
      )}

      {/* Bio */}
      {item.bio && (
        <div className="catalog-detail-section">
          <div className="catalog-detail-section-head">
            <Layers size={16} />
            <span>Giới thiệu</span>
          </div>
          <p className="catalog-detail-desc">{item.bio}</p>
        </div>
      )}
    </div>
  );
};

export default AccountDetail;
