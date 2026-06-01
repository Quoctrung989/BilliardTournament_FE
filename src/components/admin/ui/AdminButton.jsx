import clsx from "clsx";

const variants = {
  primary: "admin-btn admin-btn-primary",
  secondary: "admin-btn admin-btn-secondary",
  ghost: "admin-btn admin-btn-ghost",
  danger: "admin-btn admin-btn-danger",
  success: "admin-btn admin-btn-success",
};

const AdminButton = ({
  children,
  variant = "primary",
  className = "",
  type = "button",
  disabled,
  ...props
}) => (
  <button
    type={type}
    className={clsx(
      variants[variant],
      className,
      disabled && variant !== "success" && "opacity-50 cursor-not-allowed"
    )}
    disabled={disabled}
    {...props}
  >
    {children}
  </button>
);

export default AdminButton;
