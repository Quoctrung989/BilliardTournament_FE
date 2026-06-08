export const ADMIN_NAV = [
  {
    id: "overview",
    label: "Tổng quan",
    items: [
      { label: "Dashboard", path: "/admin/dashboard", icon: "layout-dashboard" },
    ],
  },
  {
    id: "accounts",
    label: "Tài khoản",
    items: [
      { label: "Quản lý tài khoản", path: "/admin/accounts", icon: "users" },
    ],
  },
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
      { label: "Catalog trường", path: "/admin/tournament-config/config-field-catalog" },
    ],
  },
];
