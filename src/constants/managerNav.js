export const MANAGER_NAV = [
  {
    id: "overview",
    label: "Tổng quan",
    items: [
      { label: "Dashboard", path: "/manager/dashboard", icon: "layout-dashboard" },
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
    id: "content",
    label: "Nội dung",
    items: [
      { label: "Tin tức & Bài viết", path: "/manager/news", icon: "file-text" },
    ],
  },
];
