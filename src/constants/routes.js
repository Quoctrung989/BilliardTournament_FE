import CommonLayout from "../components/layouts/CommonLayout";
import EventPage from "../pages/Event";
import EventDetailPage from "../pages/Event/EventDetailPage";
import Dashboard from "../pages/Admin/Dashboard";
import Home from "../pages/Home";
import LoginPage from "../pages/Auth/LoginPage";
import RegisterPage from "../pages/Auth/RegisterPage";
import ForgotPasswordPage from "../pages/Auth/ForgotPasswordPage";
import Profile from "../pages/Profile";
import AdminAccountListPage from "../pages/Admin/accounts/AccountListPage";
import OwnerEmployeeListPage from "../pages/Owner/employees/EmployeeListPage";
import ManagerStaffListPage from "../pages/Manager/employees/StaffListPage";
import StaffProfile from "../pages/Manager/StaffProfile";
import StaffManagement from "../pages/Admin/StaffManagement";
import FormatListPage from "../pages/Admin/tournament-config/FormatListPage";
import FormatWizardPage from "../pages/Admin/tournament-config/FormatWizardPage";
import GameTypeListPage from "../pages/Admin/tournament-config/GameTypeListPage";
import ConfigFieldCatalogPage from "../pages/Admin/tournament-config/ConfigFieldCatalogPage";
import RegistrationFieldCatalogPage from "../pages/Admin/registration-form/RegistrationFieldCatalogPage";
import RegistrationFormTemplateListPage from "../pages/Admin/registration-form/RegistrationFormTemplateListPage";
import RegistrationFormTemplateWizardPage from "../pages/Admin/registration-form/RegistrationFormTemplateWizardPage";
import StaffDashboard from "../pages/Staff/Dashboard";
import TournamentListPage from "../pages/shared/tournaments/TournamentListPage";
import TournamentWizardPage from "../pages/shared/tournaments/TournamentWizardPage";
import TournamentDetailPage from "../pages/shared/tournaments/TournamentDetailPage";
import TournamentRegistrationListPage from "../pages/shared/registrations/TournamentRegistrationListPage";
import TournamentRegisterPage from "../pages/Player/TournamentRegisterPage";
import MyRegistrationsPage from "../pages/Player/MyRegistrationsPage";
import PlayerTournamentListPage from "../pages/Player/PlayerTournamentListPage";
import PlayerTournamentDetailPage from "../pages/Player/PlayerTournamentDetailPage";
import PaymentSuccessPage from "../pages/Payment/PaymentSuccessPage";
import MyPaymentsPage from "../pages/Payment/MyPaymentsPage";
import ParticipantListPage from "../pages/shared/participants/ParticipantListPage";
import DashboardPage from "../pages/shared/DashboardPage";
import NewsListPage from "../pages/News/NewsListPage";
import ArticleDetailPage from "../pages/News/ArticleDetailPage";
import NewsCMSPage from "../pages/shared/news/NewsCMSPage";
import ArticleEditorPage from "../pages/shared/news/ArticleEditorPage";
import PlayerRoute from "../components/guards/PlayerRoute";
import {
  ownerTournamentApi,
  managerTournamentApi,
} from "../api/tournamentManagementApi";
import {
  ownerParticipantApi,
  managerParticipantApi,
} from "../api/participantApi";
import {
  ownerNewsCmsApi,
  managerNewsCmsApi,
} from "../api/newsApi";
import { getOwnerStats, getManagerStats } from "../api/dashboardApi";
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
  <TournamentWizardPage
    api={ownerTournamentApi}
    basePath="/owner/tournaments"
    roleLabel="Owner"
  />
);
const OwnerTournamentDetail = () => (
  <TournamentDetailPage
    api={ownerTournamentApi}
    basePath="/owner/tournaments"
  />
);

const ManagerTournamentHub = () => (
  <TournamentListPage
    api={managerTournamentApi}
    basePath="/manager/tournaments"
    roleLabel="Manager"
  />
);
const ManagerTournamentWizard = () => (
  <TournamentWizardPage
    api={managerTournamentApi}
    basePath="/manager/tournaments"
    roleLabel="Manager"
  />
);
const ManagerTournamentDetail = () => (
  <TournamentDetailPage
    api={managerTournamentApi}
    basePath="/manager/tournaments"
  />
);

const OwnerTournamentRegistrations = () => (
  <TournamentRegistrationListPage
    api={ownerTournamentApi}
    basePath="/owner/tournaments"
  />
);

const ManagerTournamentRegistrations = () => (
  <TournamentRegistrationListPage
    api={managerTournamentApi}
    basePath="/manager/tournaments"
  />
);

const OwnerParticipantList = () => (
  <ParticipantListPage api={ownerParticipantApi} basePath="/owner/tournaments" />
);
const ManagerParticipantList = () => (
  <ParticipantListPage api={managerParticipantApi} basePath="/manager/tournaments" />
);

const OwnerDashboard = () => (
  <DashboardPage statsLoader={getOwnerStats} basePath="/owner" title="Owner — Tổng quan" />
);
const ManagerDashboard = () => (
  <DashboardPage statsLoader={getManagerStats} basePath="/manager" title="Manager — Tổng quan" />
);

const OwnerNewsCMS = () => (
  <NewsCMSPage api={ownerNewsCmsApi} editorPath="/owner/news" />
);
const ManagerNewsCMS = () => (
  <NewsCMSPage api={managerNewsCmsApi} editorPath="/manager/news" />
);
const OwnerArticleEditor = () => (
  <ArticleEditorPage api={ownerNewsCmsApi} basePath="/owner/news" />
);
const ManagerArticleEditor = () => (
  <ArticleEditorPage api={managerNewsCmsApi} basePath="/manager/news" />
);

const PlayerTournamentRegister = () => (
  <PlayerRoute>
    <CommonLayout>
      <TournamentRegisterPage />
    </CommonLayout>
  </PlayerRoute>
);

const PlayerMyRegistrations = () => (
  <PlayerRoute>
    <CommonLayout>
      <MyRegistrationsPage />
    </CommonLayout>
  </PlayerRoute>
);

const PlayerTournamentList = () => (
  <PlayerRoute>
    <CommonLayout>
      <PlayerTournamentListPage />
    </CommonLayout>
  </PlayerRoute>
);

const PlayerTournamentDetail = () => (
  <PlayerRoute>
    <CommonLayout>
      <PlayerTournamentDetailPage />
    </CommonLayout>
  </PlayerRoute>
);

const PlayerMyPayments = () => (
  <PlayerRoute>
    <CommonLayout>
      <MyPaymentsPage />
    </CommonLayout>
  </PlayerRoute>
);

/* PaymentSuccessPage không cần PlayerRoute — PayOS redirect về đây kể cả khi chưa đăng nhập */
const PaymentReturn = () => (
  <CommonLayout>
    <PaymentSuccessPage />
  </CommonLayout>
);

export const ROUTES = [
  {
    path: "/admin/dashboard",
    component: withAdminPage(
      Dashboard,
      "Dashboard",
      "Tổng quan hệ thống giải bi-a",
    ),
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
      "Thiết lập mặc định trước khi Owner tạo giải",
    ),
  },
  {
    path: "/admin/tournament-config/formats/new",
    component: withAdminPage(
      FormatWizardPage,
      "Tạo thể thức giải",
      "Wizard 4 bước — thiết lập mặc định",
      { fullWidth: true },
    ),
  },
  {
    path: "/admin/tournament-config/formats/:code/edit",
    component: withAdminPage(
      FormatWizardPage,
      "Sửa thể thức giải",
      "Wizard 4 bước — cập nhật cấu hình",
      { fullWidth: true },
    ),
  },
  {
    path: "/admin/tournament-config/game-types",
    component: withAdminPage(
      GameTypeListPage,
      "Loại bi",
      "Cấu hình loại bi mặc định",
    ),
  },
  {
    path: "/admin/tournament-config/config-field-catalog",
    component: withAdminPage(
      ConfigFieldCatalogPage,
      "Catalog trường",
      "Chỉ xem — không chỉnh sửa trên UI",
    ),
  },
  {
    path: "/admin/registration-form/field-catalog",
    component: withAdminPage(
      RegistrationFieldCatalogPage,
      "Catalog field đăng ký",
      "Định nghĩa loại field cho form đăng ký giải",
    ),
  },
  {
    path: "/admin/registration-form/templates",
    component: withAdminPage(
      RegistrationFormTemplateListPage,
      "Template form đăng ký",
      "Tạo và quản lý form đăng ký cho giải đấu",
    ),
  },
  {
    path: "/admin/registration-form/templates/new",
    component: withAdminPage(
      RegistrationFormTemplateWizardPage,
      "Tạo template form đăng ký",
      "Wizard 3 bước — metadata, field, preview",
      { fullWidth: true },
    ),
  },
  {
    path: "/admin/registration-form/templates/:id/edit",
    component: withAdminPage(
      RegistrationFormTemplateWizardPage,
      "Sửa template form đăng ký",
      "Wizard 3 bước — cập nhật template",
      { fullWidth: true },
    ),
  },
  {
    path: "/owner/dashboard",
    component: withOwnerPage(OwnerDashboard, "Tổng quan", "Thống kê giải đấu và doanh thu"),
  },
  {
    path: "/owner/employees",
    component: withOwnerPage(
      OwnerEmployeeListPage,
      "Quản lý nhân viên",
      "Tạo và quản lý Manager, Staff"
    ),
  },
  {
    path: "/owner/tournaments",
    component: withOwnerPage(
      OwnerTournamentHub,
      "Giải đấu",
      "Tạo và quản lý giải từ cấu hình Admin",
    ),
  },
  {
    path: "/owner/tournaments/new",
    component: withOwnerPage(
      OwnerTournamentWizard,
      "Tạo giải đấu",
      "Wizard 3 bước — chọn thể thức & chỉnh config",
      { fullWidth: true },
    ),
  },
  {
    path: "/owner/tournaments/:id/edit",
    component: withOwnerPage(
      OwnerTournamentWizard,
      "Cấu hình giải",
      "Chỉnh config và race-to",
      { fullWidth: true },
    ),
  },
  {
    path: "/owner/tournaments/:id",
    component: withOwnerPage(
      OwnerTournamentDetail,
      "Chi tiết giải",
      "Thông tin và trạng thái giải",
    ),
  },
  {
    path: "/owner/tournaments/:id/registrations",
    component: withOwnerPage(
      OwnerTournamentRegistrations,
      "Đăng ký giải đấu",
      "Duyệt và quản lý đăng ký",
    ),
  },
  {
    path: "/owner/tournaments/:id/participants",
    component: withOwnerPage(OwnerParticipantList, "Người tham gia", "Thêm thủ công hoặc import Excel", { fullWidth: true }),
  },
  {
    path: "/owner/news",
    component: withOwnerPage(OwnerNewsCMS, "Tin tức & Bài viết", "Quản lý nội dung"),
  },
  {
    path: "/owner/news/:id",
    component: withOwnerPage(OwnerArticleEditor, "Bài viết", "Tạo / sửa bài viết", { fullWidth: true }),
  },
  {
    path: "/manager/dashboard",
    component: withManagerPage(ManagerDashboard, "Tổng quan", "Thống kê giải đấu"),
  },
  {
    path: "/manager/employees",
    component: withManagerPage(
      ManagerStaffListPage,
      "Quản lý nhân viên",
      "Tạo và quản lý Staff"
    ),
  },
  {
    path: "/manager/tournaments",
    component: withManagerPage(
      ManagerTournamentHub,
      "Giải đấu",
      "Tạo và quản lý giải từ cấu hình Admin",
    ),
  },
  {
    path: "/manager/tournaments/new",
    component: withManagerPage(
      ManagerTournamentWizard,
      "Tạo giải đấu",
      "Wizard 3 bước — chọn thể thức & chỉnh config",
      { fullWidth: true },
    ),
  },
  {
    path: "/manager/tournaments/:id/edit",
    component: withManagerPage(
      ManagerTournamentWizard,
      "Cấu hình giải",
      "Chỉnh config và race-to",
      { fullWidth: true },
    ),
  },
  {
    path: "/manager/tournaments/:id",
    component: withManagerPage(
      ManagerTournamentDetail,
      "Chi tiết giải",
      "Thông tin và trạng thái giải",
    ),
  },
  {
    path: "/manager/tournaments/:id/registrations",
    component: withManagerPage(
      ManagerTournamentRegistrations,
      "Đăng ký giải đấu",
      "Duyệt và quản lý đăng ký",
    ),
  },
  {
    path: "/manager/tournaments/:id/participants",
    component: withManagerPage(ManagerParticipantList, "Người tham gia", "Thêm thủ công hoặc import Excel", { fullWidth: true }),
  },
  {
    path: "/manager/news",
    component: withManagerPage(ManagerNewsCMS, "Tin tức & Bài viết", "Quản lý nội dung"),
  },
  {
    path: "/manager/news/:id",
    component: withManagerPage(ManagerArticleEditor, "Bài viết", "Tạo / sửa bài viết", { fullWidth: true }),
  },
  {
    path: "/player/tournaments",
    component: PlayerTournamentList,
  },
  {
    path: "/player/tournaments/:id",
    component: PlayerTournamentDetail,
  },
  {
    path: "/player/tournaments/:id/register",
    component: PlayerTournamentRegister,
  },
  {
    path: "/player/registrations",
    component: PlayerMyRegistrations,
  },
  {
    path: "/player/payments",
    component: PlayerMyPayments,
  },
  {
    path: "/payment/success",
    component: PaymentReturn,
  },
  { path: "/news", component: NewsListPage, layout: CommonLayout },
  { path: "/news/:slug", component: ArticleDetailPage, layout: CommonLayout },
  { path: "/event", component: EventPage, layout: CommonLayout },
  { path: "/event/:id", component: EventDetailPage, layout: CommonLayout },
  { path: "/", component: Home, layout: CommonLayout },
  { path: "/login", component: LoginPage, layout: null },
  { path: "/register", component: RegisterPage, layout: null },
  { path: "/forgot-password", component: ForgotPasswordPage, layout: null },
  { path: "/profile", component: Profile, layout: null },
  { path: "/staffProfile/:slug", component: StaffProfile, layout: null },
  {
    path: "/admin/accounts", 
    component: withAdminPage(
      AdminAccountListPage,
      "Quản lý tài khoản",
      "Danh sách tài khoản — tạo Owner, vô hiệu hóa user",
//     path: "/admin/users",
//     component: withAdminPage(
//       UserManagement,
//       "Quản lý người dùng",
//       "Danh sách tài khoản trong hệ thống",
    ),
  },
//   {
//     path: "/manager/staffManagement",
//     component: withManagerPage(
//       StaffManagement,
//       "Quản lý nhân viên",
//       "Danh sách nhân viên trong hệ thống",
//     ),
//   },
];
