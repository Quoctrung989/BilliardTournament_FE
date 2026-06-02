import CommonLayout from "../components/layouts/layout/CommonLayout";
import Dashboard from "../pages/Admin/Dashboard";
import Home from "../pages/Home";
import LoginPage from "../pages/Auth/LoginPage";
import RegisterPage from "../pages/Auth/RegisterPage";
import ForgotPasswordPage from "../pages/Auth/ForgotPasswordPage";
import UserManagement from "../pages/Admin/UserManagement";
import Profile from "../pages/Profile";
import StaffManagement from "../pages/Admin/StaffManagement";
import FormatListPage from "../pages/Admin/tournament-config/FormatListPage";
import FormatWizardPage from "../pages/Admin/tournament-config/FormatWizardPage";
import GameTypeListPage from "../pages/Admin/tournament-config/GameTypeListPage";
import ConfigFieldCatalogPage from "../pages/Admin/tournament-config/ConfigFieldCatalogPage";
import StaffDashboard from "../pages/Staff/Dashboard";
import TournamentListPage from "../pages/shared/tournaments/TournamentListPage";
import TournamentWizardPage from "../pages/shared/tournaments/TournamentWizardPage";
import TournamentDetailPage from "../pages/shared/tournaments/TournamentDetailPage";
import { ownerTournamentApi, managerTournamentApi } from "../api/tournamentManagementApi";
import { withAdminPage } from "../components/admin/withAdminPage";
import { withStaffPage } from "../components/staff/withStaffPage";
import { withOwnerPage } from "../components/owner/withOwnerPage";
import { withManagerPage } from "../components/manager/withManagerPage";

const OwnerTournamentHub = () => (
  <TournamentListPage
    api={ownerTournamentApi}
    basePath="/owner/tournaments"
    roleLabel="Owner"
  />
);
const OwnerTournamentWizard = () => (
  <TournamentWizardPage api={ownerTournamentApi} basePath="/owner/tournaments" roleLabel="Owner" />
);
const OwnerTournamentDetail = () => (
  <TournamentDetailPage api={ownerTournamentApi} basePath="/owner/tournaments" />
);

const ManagerTournamentHub = () => (
  <TournamentListPage
    api={managerTournamentApi}
    basePath="/manager/tournaments"
    roleLabel="Manager"
  />
);
const ManagerTournamentWizard = () => (
  <TournamentWizardPage api={managerTournamentApi} basePath="/manager/tournaments" roleLabel="Manager" />
);
const ManagerTournamentDetail = () => (
  <TournamentDetailPage api={managerTournamentApi} basePath="/manager/tournaments" />
);

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
  {
    path: "/owner/tournaments",
    component: withOwnerPage(
      OwnerTournamentHub,
      "Giải đấu",
      "Tạo và quản lý giải từ cấu hình Admin"
    ),
  },
  {
    path: "/owner/tournaments/new",
    component: withOwnerPage(
      OwnerTournamentWizard,
      "Tạo giải đấu",
      "Wizard 3 bước — chọn thể thức & chỉnh config",
      { fullWidth: true }
    ),
  },
  {
    path: "/owner/tournaments/:id/edit",
    component: withOwnerPage(
      OwnerTournamentWizard,
      "Cấu hình giải",
      "Chỉnh config và race-to",
      { fullWidth: true }
    ),
  },
  {
    path: "/owner/tournaments/:id",
    component: withOwnerPage(OwnerTournamentDetail, "Chi tiết giải", "Thông tin và trạng thái giải"),
  },
  {
    path: "/manager/tournaments",
    component: withManagerPage(
      ManagerTournamentHub,
      "Giải đấu",
      "Tạo và quản lý giải từ cấu hình Admin"
    ),
  },
  {
    path: "/manager/tournaments/new",
    component: withManagerPage(
      ManagerTournamentWizard,
      "Tạo giải đấu",
      "Wizard 3 bước — chọn thể thức & chỉnh config",
      { fullWidth: true }
    ),
  },
  {
    path: "/manager/tournaments/:id/edit",
    component: withManagerPage(
      ManagerTournamentWizard,
      "Cấu hình giải",
      "Chỉnh config và race-to",
      { fullWidth: true }
    ),
  },
  {
    path: "/manager/tournaments/:id",
    component: withManagerPage(
      ManagerTournamentDetail,
      "Chi tiết giải",
      "Thông tin và trạng thái giải"
    ),
  },
  { path: "/", component: Home, layout: CommonLayout },
  { path: "/login", component: LoginPage, layout: null },
  { path: "/register", component: RegisterPage, layout: null },
  { path: "/forgot-password", component: ForgotPasswordPage, layout: null },
  { path: "/profile", component: Profile, layout: null },
  { path: "/admin/users", component: UserManagement, layout: null },
  { path: "/admin/staffManagement", component: StaffManagement, layout: null },
];
