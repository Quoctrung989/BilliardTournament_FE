import { useState } from "react";
import { Camera, ChevronDown, ImagePlus, Loader2, Shield } from "lucide-react";
import { ACCEPTED_AVATAR_TYPES } from "../../constants/profileConfig";
import ProfileChangePassword from "./ProfileChangePassword";

const getInitials = (name) => {
  if (!name?.trim()) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

const ProfileAvatarPanel = ({
  avatarPreviewUrl,
  displayName,
  uploading = false,
  disabled = false,
  onAvatarSelect,
  onAvatarError,
}) => {
  const [passwordOpen, setPasswordOpen] = useState(false);
  const initials = getInitials(displayName);

  return (
    <div className="profile-aside">
      <div className="profile-avatar-card">
        <div className="profile-avatar-card__orb profile-avatar-card__orb--1" aria-hidden />
        <div className="profile-avatar-card__orb profile-avatar-card__orb--2" aria-hidden />

        <div className="profile-aside-avatar-wrap">
          <div className="profile-aside-avatar-frame">
            {avatarPreviewUrl ? (
              <img
                src={avatarPreviewUrl}
                alt=""
                className="profile-aside-avatar"
                onError={onAvatarError}
              />
            ) : (
              <div className="profile-aside-avatar profile-aside-avatar--empty">
                <span className="profile-aside-avatar-initials">{initials}</span>
              </div>
            )}
          </div>

          <label
            className={`profile-avatar-upload${uploading || disabled ? " profile-avatar-upload--disabled" : ""}`}
            title="Tải ảnh đại diện"
          >
            <span className="profile-avatar-upload__backdrop" />
            <span className="profile-avatar-upload__content">
              {uploading ? (
                <>
                  <Loader2 size={22} className="animate-spin" />
                  <span>Đang tải...</span>
                </>
              ) : (
                <>
                  <Camera size={22} />
                  <span>Đổi ảnh</span>
                </>
              )}
            </span>
            <input
              type="file"
              accept={ACCEPTED_AVATAR_TYPES.join(",")}
              className="hidden"
              disabled={uploading || disabled}
              onChange={onAvatarSelect}
            />
          </label>
        </div>

        <div className="profile-avatar-meta">
          {displayName && <p className="profile-aside-name">{displayName}</p>}
          <span className="profile-avatar-role">
            <ImagePlus size={13} aria-hidden />
            Ảnh đại diện
          </span>
          <p className="profile-aside-hint">Vuông · JPEG, PNG, WebP, GIF · tối đa 5MB</p>
        </div>
      </div>

      <div className={`profile-security-card${passwordOpen ? " profile-security-card--open" : ""}`}>
        <button
          type="button"
          className="profile-security-card__header"
          onClick={() => setPasswordOpen((v) => !v)}
          disabled={disabled}
          aria-expanded={passwordOpen}
        >
          <span className="profile-security-card__icon" aria-hidden>
            <Shield size={18} />
          </span>
          <span className="profile-security-card__text">
            <span className="profile-security-card__title">Bảo mật tài khoản</span>
            <span className="profile-security-card__desc">Đổi mật khẩu đăng nhập</span>
          </span>
          <ChevronDown
            size={18}
            className={`profile-security-card__chevron${passwordOpen ? " profile-security-card__chevron--open" : ""}`}
            aria-hidden
          />
        </button>

        <ProfileChangePassword
          open={passwordOpen}
          onClose={() => setPasswordOpen(false)}
          disabled={disabled}
        />
      </div>
    </div>
  );
};

export default ProfileAvatarPanel;
