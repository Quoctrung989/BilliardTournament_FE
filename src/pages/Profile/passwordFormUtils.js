export const EMPTY_PASSWORD_FORM = {
  oldPassword: "",
  newPassword: "",
  confirmPassword: "",
};

export const validatePasswordForm = (form) => {
  const errors = {};

  if (!form.oldPassword?.trim()) {
    errors.oldPassword = "Mật khẩu hiện tại không được để trống";
  }

  if (!form.newPassword?.trim()) {
    errors.newPassword = "Mật khẩu mới không được để trống";
  } else if (form.newPassword.length < 6 || form.newPassword.length > 100) {
    errors.newPassword = "Mật khẩu phải từ 6-100 ký tự";
  } else if (form.newPassword === form.oldPassword) {
    errors.newPassword = "Mật khẩu mới phải khác mật khẩu hiện tại";
  }

  if (!form.confirmPassword?.trim()) {
    errors.confirmPassword = "Vui lòng xác nhận mật khẩu mới";
  } else if (form.newPassword !== form.confirmPassword) {
    errors.confirmPassword = "Mật khẩu xác nhận không khớp";
  }

  if (Object.keys(errors).length > 0) {
    return { errors };
  }

  return {
    body: {
      oldPassword: form.oldPassword,
      newPassword: form.newPassword,
    },
    errors: null,
  };
};
