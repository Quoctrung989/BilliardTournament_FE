import { useState } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "react-toastify";
import * as authApi from "../../api/authApi";
import { getApiErrorMessage } from "../../utils/apiError";
import {
  EMPTY_PASSWORD_FORM,
  validatePasswordForm,
} from "./passwordFormUtils";

const PasswordField = ({
  label,
  name,
  value,
  error,
  show,
  onToggle,
  onChange,
  disabled,
}) => (
  <div className="profile-password-field">
    <label className="profile-password-label" htmlFor={name}>
      {label}
    </label>
    <div className="profile-password-input-wrap">
      <input
        id={name}
        type={show ? "text" : "password"}
        className={`profile-password-input${error ? " profile-password-input--error" : ""}`}
        value={value}
        onChange={(e) => onChange(name, e.target.value)}
        disabled={disabled}
        autoComplete={name === "oldPassword" ? "current-password" : "new-password"}
        placeholder="••••••••"
      />
      <button
        type="button"
        className="profile-password-toggle"
        onClick={onToggle}
        tabIndex={-1}
        aria-label={show ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
      >
        {show ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
    {error && <p className="profile-password-error">{error}</p>}
  </div>
);

const ProfileChangePassword = ({ open, onClose, disabled = false }) => {
  const [form, setForm] = useState(EMPTY_PASSWORD_FORM);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [show, setShow] = useState({
    oldPassword: false,
    newPassword: false,
    confirmPassword: false,
  });

  const patch = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[name];
      delete next.server;
      return next;
    });
  };

  const handleClose = () => {
    if (saving) return;
    setForm(EMPTY_PASSWORD_FORM);
    setErrors({});
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { body, errors: validationErrors } = validatePasswordForm(form);
    if (validationErrors) {
      setErrors(validationErrors);
      return;
    }

    setSaving(true);
    try {
      const { data } = await authApi.changePassword(body);
      if (data?.success === false) {
        throw new Error(data.message || "Đổi mật khẩu thất bại.");
      }
      toast.success(data?.message || "Đổi mật khẩu thành công");
      setForm(EMPTY_PASSWORD_FORM);
      setErrors({});
      onClose();
    } catch (err) {
      const message = getApiErrorMessage(err);
      setErrors({ server: message });
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={`profile-password-panel${open ? " profile-password-panel--open" : ""}`}>
      <form onSubmit={handleSubmit} className="profile-password-form">
        <PasswordField
          label="Mật khẩu hiện tại"
          name="oldPassword"
          value={form.oldPassword}
          error={errors.oldPassword}
          show={show.oldPassword}
          onToggle={() => setShow((s) => ({ ...s, oldPassword: !s.oldPassword }))}
          onChange={patch}
          disabled={saving || disabled || !open}
        />

        <PasswordField
          label="Mật khẩu mới"
          name="newPassword"
          value={form.newPassword}
          error={errors.newPassword}
          show={show.newPassword}
          onToggle={() => setShow((s) => ({ ...s, newPassword: !s.newPassword }))}
          onChange={patch}
          disabled={saving || disabled || !open}
        />

        <PasswordField
          label="Xác nhận mật khẩu mới"
          name="confirmPassword"
          value={form.confirmPassword}
          error={errors.confirmPassword}
          show={show.confirmPassword}
          onToggle={() =>
            setShow((s) => ({ ...s, confirmPassword: !s.confirmPassword }))
          }
          onChange={patch}
          disabled={saving || disabled || !open}
        />

        {errors.server && (
          <p className="profile-password-error profile-password-error--server" role="alert">
            {errors.server}
          </p>
        )}

        <div className="profile-password-actions">
          <button
            type="button"
            className="profile-password-btn profile-password-btn--ghost"
            onClick={handleClose}
            disabled={saving}
          >
            Hủy
          </button>
          <button
            type="submit"
            className="profile-password-btn profile-password-btn--primary"
            disabled={saving || disabled || !open}
          >
            {saving && <Loader2 size={15} className="animate-spin" />}
            Cập nhật mật khẩu
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProfileChangePassword;
