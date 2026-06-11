import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { Loader2 } from "lucide-react";
import { createPlayerProfile, getProfile, updateProfile } from "../../api/profileApi";
import { uploadImage } from "../../api/storageApi";
import { pickAvatarObjectKey } from "./profileAvatarUtils";
import { useAuthStore } from "../../store/authStore";
import {
  ACCEPTED_AVATAR_TYPES,
  EMPTY_PROFILE_FORM,
} from "../../constants/profileConfig";
import {
  getApiErrorCode,
  getApiErrorMessage,
} from "../../utils/apiError";
import { isPlayerUser } from "../../utils/auth";
import ProfileAvatarPanel from "./ProfileAvatarPanel";
import ProfileForm from "./ProfileForm";
import { profileToForm, validateProfileForm } from "./profileFormUtils";
import "./profile.scss";

const MAX_AVATAR_SIZE = 5 * 1024 * 1024;

const Profile = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, authReady } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState("edit");
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState(EMPTY_PROFILE_FORM);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const avatarRefreshGuard = useRef(false);

  const isPlayer = isPlayerUser(user);
  const email = profile?.email || user?.email || "";
  const displayName = form.displayName || form.fullName;

  const applyProfileData = useCallback((data, emailFallback = "") => {
    setProfile({ ...data, email: data.email || emailFallback });
    setForm(profileToForm(data));
  }, []);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getProfile();
      applyProfileData(data, user?.email || "");
      setMode("edit");
    } catch (err) {
      const status = err?.response?.status;
      const code = getApiErrorCode(err);

      if (status === 404 || code === "PROFILE_002") {
        setProfile(null);
        setForm({ ...EMPTY_PROFILE_FORM, fullName: user?.fullName || "" });
        setMode(isPlayerUser(user) ? "create" : "empty");
      } else if (status === 401) {
        navigate("/login", { state: { from: { pathname: "/profile" } }, replace: true });
      } else {
        toast.error(getApiErrorMessage(err));
        setMode("error");
      }
    } finally {
      setLoading(false);
    }
  }, [applyProfileData, navigate, user]);

  useEffect(() => {
    if (!authReady) return;
    if (!isAuthenticated) {
      navigate("/login", { state: { from: { pathname: "/profile" } }, replace: true });
      return;
    }
    loadProfile();
  }, [authReady, isAuthenticated, loadProfile, navigate]);

  const patchForm = (patch) => {
    setForm((prev) => ({ ...prev, ...patch }));
    setErrors((prev) => {
      const next = { ...prev };
      Object.keys(patch).forEach((key) => delete next[key]);
      return next;
    });
  };

  const persistAvatar = async (nextForm) => {
    const currentMode = mode === "create" ? "create" : "edit";
    const { body, errors: validationErrors } = validateProfileForm(nextForm, {
      mode: currentMode,
      isPlayer,
    });

    if (validationErrors) {
      setErrors(validationErrors);
      if (!nextForm.fullName?.trim()) {
        toast.warn("Nhập họ và tên rồi lưu hồ sơ để ghi ảnh đại diện.");
      } else {
        toast.warn("Vui lòng sửa lỗi trong form trước khi lưu ảnh.");
      }
      return false;
    }

    if (!body.avatarUrl) {
      toast.error("Không có objectKey ảnh để lưu.");
      return false;
    }

    let data;
    if (mode === "create") {
      data = await createPlayerProfile(body);
      setMode("edit");
      toast.success("Đã tạo hồ sơ và lưu ảnh đại diện");
    } else {
      data = await updateProfile(body);
      toast.success("Đã cập nhật ảnh đại diện");
    }

    applyProfileData(data, email);
    setErrors({});
    return true;
  };

  const handleAvatarSelect = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (!ACCEPTED_AVATAR_TYPES.includes(file.type)) {
      toast.warn("Chỉ chấp nhận ảnh JPEG, PNG, WebP hoặc GIF.");
      return;
    }
    if (file.size > MAX_AVATAR_SIZE) {
      toast.warn("Ảnh tối đa 5MB.");
      return;
    }

    setUploading(true);
    try {
      const uploadData = await uploadImage(file, "avatars");
      const objectKey = pickAvatarObjectKey(uploadData);
      const previewUrl = uploadData?.url || "";

      if (!objectKey) {
        toast.error("Không nhận được objectKey từ máy chủ.");
        return;
      }

      const nextForm = {
        ...form,
        avatarObjectKey: objectKey,
        avatarPreviewUrl: previewUrl,
      };
      patchForm({
        avatarObjectKey: objectKey,
        avatarPreviewUrl: previewUrl,
      });

      if (mode === "create" && !nextForm.fullName?.trim()) {
        toast.success("Tải ảnh thành công. Nhập họ tên và nhấn lưu hồ sơ.");
        return;
      }

      await persistAvatar(nextForm);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    avatarRefreshGuard.current = false;
  }, [form.avatarPreviewUrl]);

  const handleAvatarError = async () => {
    if (avatarRefreshGuard.current || mode === "create") return;

    avatarRefreshGuard.current = true;
    try {
      const data = await getProfile();
      const preview = data?.avatarUrl;
      if (preview) {
        patchForm({ avatarPreviewUrl: preview });
        avatarRefreshGuard.current = false;
      }
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const currentMode = mode === "create" ? "create" : "edit";
    const { body, errors: validationErrors } = validateProfileForm(form, {
      mode: currentMode,
      isPlayer,
    });

    if (validationErrors) {
      setErrors(validationErrors);
      return;
    }

    setSaving(true);
    try {
      let data;
      if (mode === "create") {
        data = await createPlayerProfile(body);
        toast.success("Đã tạo hồ sơ");
        setMode("edit");
      } else {
        data = await updateProfile(body);
        toast.success("Cập nhật hồ sơ thành công");
      }
      applyProfileData(data, email);
      setErrors({});
    } catch (err) {
      const code = getApiErrorCode(err);
      if (code === "PROFILE_001" || err?.response?.status === 409) {
        toast.info("Hồ sơ đã tồn tại, đang tải lại...");
        await loadProfile();
      } else if (code === "PROFILE_003" || err?.response?.status === 403) {
        toast.error("Chỉ tài khoản cơ thủ mới có thể tạo hồ sơ.");
      } else {
        toast.error(getApiErrorMessage(err));
      }
    } finally {
      setSaving(false);
    }
  };

  if (!authReady || (loading && mode !== "empty")) {
    return (
      <div className="profile-page profile-page--center">
        <Loader2 className="animate-spin text-[#0c1527]" size={36} />
      </div>
    );
  }

  const showForm = mode === "create" || mode === "edit";
  const tabTitle = mode === "create" ? "Tạo hồ sơ" : "Thông tin hồ sơ";

  return (
    <div className="profile-page">
      <div className="profile-page-inner">
        <div className="profile-prefs-card">
          <div className="profile-prefs-tab">
            <span className="profile-prefs-tab-line" aria-hidden />
            <span className="profile-prefs-tab-text">{tabTitle}</span>
          </div>

          <div className="profile-prefs-body">
            {mode === "error" && (
              <div className="profile-prefs-empty">
                <p>Không thể tải hồ sơ.</p>
                <button type="button" onClick={loadProfile} className="profile-btn-save">
                  Thử lại
                </button>
              </div>
            )}

            {mode === "empty" && !isPlayer && (
              <p className="profile-prefs-empty">
                Tài khoản này không hỗ trợ tạo hồ sơ cơ thủ.
              </p>
            )}

            {showForm && (
              <>
                {mode === "create" && (
                  <p className="profile-prefs-lead">
                    Điền thông tin bên dưới và nhấn lưu để hoàn tất hồ sơ của bạn.
                  </p>
                )}

                <div className="profile-layout">
                  <ProfileAvatarPanel
                    avatarPreviewUrl={form.avatarPreviewUrl}
                    displayName={displayName}
                    uploading={uploading}
                    disabled={saving}
                    onAvatarSelect={handleAvatarSelect}
                    onAvatarError={handleAvatarError}
                  />

                  <div className="profile-main">
                    <ProfileForm
                      form={form}
                      errors={errors}
                      email={email}
                      mode={mode}
                      isPlayer={isPlayer}
                      saving={saving}
                      uploading={uploading}
                      onChange={patchForm}
                      onSubmit={handleSubmit}
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
