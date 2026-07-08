import { Loader2 } from "lucide-react";
import { GENDER_OPTIONS } from "../../constants/accountConfig";
import { BILLIARD_RANK_OPTIONS } from "../../constants/profileConfig";

const Field = ({ label, required, error, hint, children, className = "" }) => (
  <div className={className}>
    <label className="profile-field-label">
      {label}
      {required && <span className="required"> *</span>}
    </label>
    {children}
    {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    {hint && !error && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
  </div>
);

const ProfileForm = ({
  form,
  errors = {},
  email,
  mode = "edit",
  isPlayer = true,
  saving = false,
  uploading = false,
  onChange,
  onSubmit,
}) => {
  const isCreate = mode === "create";
  const todayStr = new Date().toISOString().slice(0, 10);
  const inputCls = (hasError) =>
    `profile-input${hasError ? " profile-input--error" : ""}`;

  return (
    <form onSubmit={onSubmit} className="profile-main-form">
      <div className="profile-form-section">
        {/* <h3 className="profile-form-section-title">Tài khoản</h3> */}
        {/* <p className="profile-form-section-desc">
          Thông tin đăng nhập và liên hệ dùng cho giải đấu và xác minh danh tính.
        </p> */}
        <div className="profile-form-grid">
          <Field label="Email" hint="Không thể thay đổi" className="profile-form-grid__full">
            <input
              className="profile-input profile-input--readonly"
              value={email || ""}
              readOnly
            />
          </Field>

          <Field label="Họ và tên" required error={errors.fullName}>
            <input
              className={inputCls(errors.fullName)}
              value={form.fullName}
              onChange={(e) => onChange({ fullName: e.target.value })}
              placeholder="Nguyễn Văn A"
              disabled={saving}
            />
          </Field>

          <Field label="Tên hiển thị">
            <input
              className={inputCls(false)}
              value={form.displayName}
              onChange={(e) => onChange({ displayName: e.target.value })}
              placeholder="Tên trên giải đấu"
              disabled={saving}
            />
          </Field>

          {isCreate ? (
            <Field label="Ngày sinh" error={errors.dateOfBirth}>
              <input
                type="date"
                max={todayStr}
                className={inputCls(errors.dateOfBirth)}
                value={form.dateOfBirth}
                onChange={(e) => onChange({ dateOfBirth: e.target.value })}
                disabled={saving}
              />
            </Field>
          ) : (
            <Field label="Số điện thoại" error={errors.phone} hint="03/05/07/08/09 + 8 số">
              <input
                className={inputCls(errors.phone)}
                value={form.phone}
                onChange={(e) => onChange({ phone: e.target.value })}
                placeholder="0912345678"
                disabled={saving}
              />
            </Field>
          )}

          {!isCreate && (
            <Field label="Ngày sinh" error={errors.dateOfBirth}>
              <input
                type="date"
                max={todayStr}
                className={inputCls(errors.dateOfBirth)}
                value={form.dateOfBirth}
                onChange={(e) => onChange({ dateOfBirth: e.target.value })}
                disabled={saving}
              />
            </Field>
          )}

          <Field label="Giới tính">
            <select
              className={inputCls(false)}
              value={form.gender}
              onChange={(e) => onChange({ gender: e.target.value })}
              disabled={saving}
            >
              {GENDER_OPTIONS.map((o) => (
                <option key={o.value || "empty"} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </Field>

          {isPlayer && (
            <Field label="Hạng cơ thủ">
              <select
                className={inputCls(false)}
                value={form.billiardRank}
                onChange={(e) => onChange({ billiardRank: e.target.value })}
                disabled={saving}
              >
                {BILLIARD_RANK_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </Field>
          )}
        </div>
      </div>

      <div className="profile-form-section">
        <h3 className="profile-form-section-title">Giới thiệu</h3>
        <p className="profile-form-section-desc">
          Mô tả ngắn về bản thân, kinh nghiệm chơi bida hoặc thành tích của bạn.
        </p>
        <Field label="Mô tả bản thân">
          <textarea
            className={`${inputCls(false)} min-h-[72px] resize-y`}
            value={form.bio}
            onChange={(e) => onChange({ bio: e.target.value })}
            placeholder="Mô tả ngắn về bản thân..."
            disabled={saving}
            rows={2}
          />
        </Field>
      </div>

      <div className="profile-form-actions">
        <button
          type="submit"
          disabled={saving || uploading}
          className="profile-btn-save min-w-[160px]"
        >
          {saving && <Loader2 size={15} className="animate-spin" />}
          {isCreate ? "Ghi lại hồ sơ" : "Lưu hồ sơ"}
        </button>
      </div>
    </form>
  );
};

export default ProfileForm;
