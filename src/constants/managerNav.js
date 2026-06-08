export const MANAGER_NAV = [
  {
    id: "overview",
    label: "Tổng quan",
    items: [
      { label: "Giải đấu", path: "/manager/tournaments", icon: "trophy" },
    ],
  },
  {
    id: "employees",
    label: "Nhân sự",
    items: [
      { label: "Quản lý nhân viên", path: "/manager/employees", icon: "users" },
    ],
  },
  {
    id: "tournaments",
    label: "Quản lý giải",
    items: [
      { label: "Tạo giải mới", path: "/manager/tournaments/new", icon: "layout-dashboard" },
    ],
  },
];
