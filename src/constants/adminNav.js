export const ADMIN_NAV = [
  {
    id: "overview",
    label: "Tổng quan",
    items: [
      { label: "Dashboard", path: "/admin/dashboard", icon: "layout-dashboard" },
    ],
  },
  {
    id: "users",
    label: "Người dùng",
    items: [
      { label: "Quản lý người dùng", path: "/admin", icon: "users" },
    ],
  },
  {
    id: "tournaments",
    label: "Giải đấu",
    items: [
      { label: "Danh sách giải", path: "/admin/accountsManagement", icon: "trophy" },
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
  {
    id: "staff",
    label: "Nhân viên",
    items: [
      { label: "Quản lý nhân viên", path: "/admin/accountsManagement", icon: "user-cog" },
    ],
  },
];
