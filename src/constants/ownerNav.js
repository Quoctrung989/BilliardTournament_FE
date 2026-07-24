export const OWNER_NAV = [
  {
    id: "overview",
    label: "Tổng quan",
    items: [
      { label: "Dashboard", path: "/owner/dashboard", icon: "layout-dashboard" },
      { label: "Giải đấu", path: "/owner/tournaments", icon: "trophy" },
      { label: "Chi nhánh", path: "/owner/branches", icon: "map-pin" },
    ],
  },
  {
    id: "employees",
    label: "Nhân sự",
    items: [
      { label: "Quản lý nhân viên", path: "/owner/employees", icon: "users" },
    ],
  },
  {
    id: "content",
    label: "Nội dung",
    items: [
      { label: "Tin tức & Bài viết", path: "/owner/news", icon: "file-text" },
      { label: "Danh mục & Thẻ", path: "/owner/news/categories", icon: "tags" },
      { label: "Thống kê Facebook", path: "/owner/facebook-posts", icon: "share-2" },
    ],
  },
];
