export const ADMIN_NAV = [
  {
    id: "overview",
    label: "Tổng quan",
    items: [
      {
        label: "Dashboard",
        path: "/admin/dashboard",
        icon: "layout-dashboard",
      },
    ],
  },
  {
    id: "accounts",
    label: "Tài khoản",
    items: [
      { label: "Quản lý tài khoản", path: "/admin/accounts", icon: "users" },
//     id: "users",
//     label: "Người dùng",
//     items: [{ label: "Quản lý người dùng", path: "/admin", icon: "users" }
    ],
  },
//   {
//     id: "tournaments",
//     label: "Giải đấu",
//     items: [
//       {
//         label: "Danh sách giải",
//         path: "/admin/accountsManagement",
//         icon: "trophy",
//       },
//     ],
//   },
  {
    id: "config",
    label: "Cấu hình hệ thống",
    collapsible: true,
    matchPrefix: "/admin/tournament-config",
    icon: "settings",
    labelNav: "Quản lý cài đặt mặc định",
    children: [
      { label: "Thể thức giải", path: "/admin/tournament-config/formats" },
      { label: "Loại bi", path: "/admin/tournament-config/game-types" },
      {
        label: "Catalog trường",
        path: "/admin/tournament-config/config-field-catalog",
      },
    ],
  },
  {
    id: "registration-form",
    label: "Form đăng ký",
    collapsible: true,
    matchPrefix: "/admin/registration-form",
    icon: "user-cog",
    labelNav: "Quản lý cài đặt form đăng ký",
    children: [
      {
        label: "Catalog field đăng ký",
        path: "/admin/registration-form/field-catalog",
      },
      {
        label: "Template form",
        path: "/admin/registration-form/templates",
      },
    ],
  },
  {
    id: "email",
    label: "Email",
    collapsible: true,
    matchPrefix: "/admin/email",
    icon: "mail",
    labelNav: "Quản lý email",
    children: [
      { label: "Mẫu email", path: "/admin/email/templates" },
      { label: "Quy tắc tự động", path: "/admin/email/automation" },
      { label: "Nhật ký gửi", path: "/admin/email/logs" },
    ],
  },
//   {
//     id: "staff",
//     label: "Nhân viên",
//     items: [
//       {
//         label: "Quản lý nhân viên",
//         path: "/admin/staffManagement",
//         icon: "user-cog",
//       },
//     ],
//   },
];
