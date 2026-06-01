import CommonLayout from "../components/layouts/layout/CommonLayout";
import Dashboard from "../pages/Admin/Dashboard";
import Home from "../pages/Home";
import LoginPage from "../pages/Auth/LoginPage";
import RegisterPage from "../pages/Auth/RegisterPage";
import ForgotPasswordPage from "../pages/Auth/ForgotPasswordPage";
import FormatListPage from "../pages/Admin/tournament-config/FormatListPage";
import FormatWizardPage from "../pages/Admin/tournament-config/FormatWizardPage";
import GameTypeListPage from "../pages/Admin/tournament-config/GameTypeListPage";
import ConfigFieldCatalogPage from "../pages/Admin/tournament-config/ConfigFieldCatalogPage";
import StaffDashboard from "../pages/Staff/Dashboard";
import { withAdminPage } from "../components/admin/withAdminPage";
import { withStaffPage } from "../components/staff/withStaffPage";

export const ROUTES = [
  {
    path: "/admin/dashboard",
    component: withAdminPage(Dashboard, "Dashboard", "Tổng quan hệ thống giải bi-a"),
  },
  {
    path: "/staff/dashboard",
    component: withStaffPage(StaffDashboard, "Nhân viên — Tổng quan"),
  },
  {
    path: "/admin/tournament-config/formats",
    component: withAdminPage(
      FormatListPage,
      "Thể thức giải",
      "Thiết lập mặc định trước khi Owner tạo giải"
    ),
  },
  {
    path: "/admin/tournament-config/formats/new",
    component: withAdminPage(
      FormatWizardPage,
      "Tạo thể thức giải",
      "Wizard 4 bước — thiết lập mặc định",
      { fullWidth: true }
    ),
  },
  {
    path: "/admin/tournament-config/formats/:code/edit",
    component: withAdminPage(
      FormatWizardPage,
      "Sửa thể thức giải",
      "Wizard 4 bước — cập nhật cấu hình",
      { fullWidth: true }
    ),
  },
  {
    path: "/admin/tournament-config/game-types",
    component: withAdminPage(GameTypeListPage, "Loại bi", "Cấu hình loại bi mặc định"),
  },
  {
    path: "/admin/tournament-config/config-field-catalog",
    component: withAdminPage(
      ConfigFieldCatalogPage,
      "Catalog trường",
      "Chỉ xem — không chỉnh sửa trên UI"
    ),
  },
  { path: "/", component: Home, layout: CommonLayout },
  { path: "/login", component: LoginPage, layout: null },
  { path: "/register", component: RegisterPage, layout: null },
  { path: "/forgot-password", component: ForgotPasswordPage, layout: null },
];
