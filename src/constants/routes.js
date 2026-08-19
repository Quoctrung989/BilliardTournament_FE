import CommonLayout from "../components/layouts/CommonLayout";
import EventPage from "../pages/Event";
import EventDetailPage from "../pages/Event/EventDetailPage";
import BranchListPage from "../pages/Branch";
import RankingsPage from "../pages/Rankings";
import BranchDetailPage from "../pages/Branch/BranchDetailPage";
import Dashboard from "../pages/Admin/Dashboard";
import Home from "../pages/Home";
import LoginPage from "../pages/Auth/LoginPage";
import RegisterPage from "../pages/Auth/RegisterPage";
import ForgotPasswordPage from "../pages/Auth/ForgotPasswordPage";
import Profile from "../pages/Profile";
import AdminAccountListPage from "../pages/Admin/accounts/AccountListPage";
import OwnerEmployeeListPage from "../pages/Owner/employees/EmployeeListPage";
import ManagerStaffListPage from "../pages/Manager/employees/StaffListPage";
import OwnerBranchListPage from "../pages/Owner/branches/BranchListPage";
import OwnerTableListPage from "../pages/Owner/tables/TableListPage";
import ManagerBranchListPage from "../pages/Manager/branches/BranchListPage";
import StaffProfile from "../pages/Manager/StaffProfile";
import FormatListPage from "../pages/Admin/tournament-config/FormatListPage";
import FormatWizardPage from "../pages/Admin/tournament-config/FormatWizardPage";
import GameTypeListPage from "../pages/Admin/tournament-config/GameTypeListPage";
import ConfigFieldCatalogPage from "../pages/Admin/tournament-config/ConfigFieldCatalogPage";
import RegistrationFieldCatalogPage from "../pages/Admin/registration-form/RegistrationFieldCatalogPage";
import RegistrationFormTemplateListPage from "../pages/Admin/registration-form/RegistrationFormTemplateListPage";
import RegistrationFormTemplateWizardPage from "../pages/Admin/registration-form/RegistrationFormTemplateWizardPage";
import StaffMatchListPage from "../pages/Staff/Matches/StaffMatchListPage";
import StaffScoringPage from "../pages/Staff/Matches/StaffScoringPage";
import ManagerLiveDashboardPage from "../pages/Manager/LiveDashboard/ManagerLiveDashboardPage";
import TournamentLiveTvPage from "../pages/Live/TournamentLiveTvPage";
import StaffRoute from "../components/guards/StaffRoute";
import TournamentListPage from "../pages/shared/tournaments/TournamentListPage";
import TournamentWizardPage from "../pages/shared/tournaments/TournamentWizardPage";
import TournamentDetailPage from "../pages/shared/tournaments/TournamentDetailPage";
import TournamentRegistrationListPage from "../pages/shared/registrations/TournamentRegistrationListPage";
import TournamentRegisterPage from "../pages/Player/TournamentRegisterPage";
import MyRegistrationsPage from "../pages/Player/MyRegistrationsPage";
import PlayerTournamentDetailPage from "../pages/Player/PlayerTournamentDetailPage";
import PaymentSuccessPage from "../pages/Payment/PaymentSuccessPage";
import MyPaymentsPage from "../pages/Payment/MyPaymentsPage";
import ParticipantListPage from "../pages/shared/participants/ParticipantListPage";
import TournamentFinancePage from "../pages/shared/tournaments/TournamentFinancePage";
import DrawPage from "../pages/shared/matches/DrawPage";
import PlayerMatchSchedulePage from "../pages/Player/PlayerMatchSchedulePage";
import DashboardPage from "../pages/shared/DashboardPage";
import NewsListPage from "../pages/News/NewsListPage";
import ArticleDetailPage from "../pages/News/ArticleDetailPage";
import PlayerProfilePage from "../pages/Event/PlayerProfilePage";
import NewsCMSPage from "../pages/shared/news/NewsCMSPage";
import ArticleEditorPage from "../pages/shared/news/ArticleEditorPage";
import NewsTaxonomyPage from "../pages/shared/news/NewsTaxonomyPage";
import EmailTemplateListPage from "../pages/Admin/email/EmailTemplateListPage";
import EmailAutomationRulesPage from "../pages/Admin/email/EmailAutomationRulesPage";
import EmailLogListPage from "../pages/Admin/email/EmailLogListPage";
import EmailLayoutSettingsPage from "../pages/Admin/email/EmailLayoutSettingsPage";
import TournamentNotificationsPage from "../pages/shared/tournaments/TournamentNotificationsPage";
import FacebookPostsStatsPage from "../pages/shared/facebook/FacebookPostsStatsPage";
import FacebookPostDetailPage from "../pages/shared/facebook/FacebookPostDetailPage";
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
import { ownerEmailApi, managerEmailApi } from "../api/emailApi";
import { getOwnerStats, getManagerStats } from "../api/dashboardApi";
import { ownerAnalyticsApi, managerAnalyticsApi } from "../api/analyticsApi";
import { ownerBranchApi, managerBranchApi } from "../api/branchApi";
import StatisticsPage from "../pages/shared/StatisticsPage";
import TransactionsPage from "../pages/shared/TransactionsPage";
import { ownerMatchApi, managerMatchApi } from "../api/matchApi";
import { withAdminPage } from "../components/admin/withAdminPage";
import { withStaffPage } from "../components/staff/withStaffPage";
import { withOwnerPage } from "../components/owner/withOwnerPage";
import { withManagerPage } from "../components/manager/withManagerPage";

const OwnerTournamentHub = () => (
  <TournamentListPage
    api={ownerTournamentApi}
    branchApi={ownerBranchApi}
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
const OwnerTournamentLive = () => (
  <ManagerLiveDashboardPage
    api={ownerMatchApi}
    basePath="/owner/tournaments"
  />
);

const ManagerTournamentHub = () => (
  <TournamentListPage
    api={managerTournamentApi}
    branchApi={managerBranchApi}
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
const ManagerTournamentLive = () => (
  <ManagerLiveDashboardPage />
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

const OwnerTournamentFinance = () => (
  <TournamentFinancePage api={ownerTournamentApi} basePath="/owner/tournaments" />
);
const ManagerTournamentFinance = () => (
  <TournamentFinancePage api={managerTournamentApi} basePath="/manager/tournaments" />
);

const OwnerDashboard = () => (
  <DashboardPage statsLoader={getOwnerStats} basePath="/owner" title="Owner — Tổng quan" />
);
const OwnerStatistics = () => (
  <StatisticsPage analyticsApi={ownerAnalyticsApi} branchApi={ownerBranchApi} title="Owner — Thống kê & Phân tích" />
);
const OwnerTransactions = () => (
  <TransactionsPage analyticsApi={ownerAnalyticsApi} title="Owner — Quản lý giao dịch" />
);
const ManagerDashboard = () => (
  <DashboardPage statsLoader={getManagerStats} basePath="/manager" title="Manager — Tổng quan" />
);
const ManagerStatistics = () => (
  <StatisticsPage analyticsApi={managerAnalyticsApi} branchApi={managerBranchApi} title="Manager — Thống kê & Phân tích" />
);
const ManagerTransactions = () => (
  <TransactionsPage analyticsApi={managerAnalyticsApi} title="Manager — Quản lý giao dịch" />
);

const OwnerDrawPage = () => (
  <DrawPage api={ownerMatchApi} basePath="/owner/tournaments" />
);
const ManagerDrawPage = () => (
  <DrawPage api={managerMatchApi} basePath="/manager/tournaments" />
);

const OwnerTournamentNotifications = () => (
  <TournamentNotificationsPage api={ownerEmailApi} basePath="/owner/tournaments" />
);
const ManagerTournamentNotifications = () => (
  <TournamentNotificationsPage api={managerEmailApi} basePath="/manager/tournaments" />
);

const OwnerNewsCMS = () => (
  <NewsCMSPage api={ownerNewsCmsApi} editorPath="/owner/news" taxonomyPath="/owner/news/categories" />
);
const ManagerNewsCMS = () => (
  <NewsCMSPage api={managerNewsCmsApi} editorPath="/manager/news" taxonomyPath="/manager/news/categories" />
);
const OwnerArticleEditor = () => (
  <ArticleEditorPage api={ownerNewsCmsApi} basePath="/owner/news" />
);
const ManagerArticleEditor = () => (
  <ArticleEditorPage api={managerNewsCmsApi} basePath="/manager/news" />
);
const OwnerNewsTaxonomy = () => <NewsTaxonomyPage api={ownerNewsCmsApi} />;
const ManagerNewsTaxonomy = () => <NewsTaxonomyPage api={managerNewsCmsApi} />;

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

const PlayerMatchSchedule = () => (
  <PlayerRoute>
    <CommonLayout>
      <PlayerMatchSchedulePage />
    </CommonLayout>
  </PlayerRoute>
);

/* PaymentSuccessPage không cần PlayerRoute — PayOS redirect về đây kể cả khi chưa đăng nhập */
const PaymentReturn = () => (
  <CommonLayout>
    <PaymentSuccessPage />
  </CommonLayout>
);

const StaffScoringRoute = () => (
  <StaffRoute>
    <StaffScoringPage />
  </StaffRoute>
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
    path: "/staff/matches",
    component: withStaffPage(StaffMatchListPage, "Trận của tôi", {
      fullWidth: true,
      hideBreadcrumb: true,
      hideSearch: true,
      hideTitles: true,
      contentClassName: "!pt-6 !px-5 sm:!px-8",
    }),
  },
  {
    path: "/staff/matches/:matchId",
    component: StaffScoringRoute,
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
      "Tạo và cập nhật định nghĩa field cấu hình giải",
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
    path: "/admin/email/templates",
    component: withAdminPage(EmailTemplateListPage, "Mẫu email", "Tạo và quản lý mẫu email dùng chung"),
  },
  {
    path: "/admin/email/automation",
    component: withAdminPage(EmailAutomationRulesPage, "Quy tắc tự động", "Cấu hình email tự động theo sự kiện"),
  },
  {
    path: "/admin/email/logs",
    component: withAdminPage(EmailLogListPage, "Nhật ký email", "Lịch sử gửi email toàn hệ thống", { fullWidth: true }),
  },
  {
    path: "/admin/email/layout",
    component: withAdminPage(
      EmailLayoutSettingsPage,
      "Khung email",
      "Chỉnh header/footer chung áp dụng cho mọi email gửi ra",
      { fullWidth: true },
    ),
  },
  {
    path: "/owner/dashboard",
    component: withOwnerPage(OwnerDashboard, "Tổng quan", "Thống kê giải đấu và doanh thu"),
  },
  {
    path: "/owner/analytics",
    component: withOwnerPage(
      OwnerStatistics,
      "Thống kê & Phân tích",
      "Doanh thu, hiệu suất giải đấu, bảng xếp hạng cơ thủ và xuất báo cáo",
      { fullWidth: true }
    ),
  },
  {
    path: "/owner/transactions",
    component: withOwnerPage(
      OwnerTransactions,
      "Quản lý giao dịch",
      "Tra cứu và quản lý toàn bộ giao dịch thanh toán",
      { fullWidth: true }
    ),
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
    path: "/owner/branches",
    component: withOwnerPage(
      OwnerBranchListPage,
      "Chi nhánh",
      "Tạo và quản lý các chi nhánh trong chuỗi"
    ),
  },
  {
    path: "/owner/tables",
    component: withOwnerPage(
      OwnerTableListPage,
      "Quản lý bàn",
      "Danh mục bàn dùng chung cho chuỗi"
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
    path: "/owner/tournaments/:id/live",
    component: withOwnerPage(
      OwnerTournamentLive,
      "Dashboard trực tiếp",
      "Theo dõi tỉ số realtime theo dải bàn",
      { fullWidth: true }
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
    path: "/owner/tournaments/:id/finance",
    component: withOwnerPage(OwnerTournamentFinance, "Thu chi giải đấu", "Ghi nhận khoản thu/chi ngoài tiền đăng ký"),
  },
  {
    path: "/owner/tournaments/:id/draw",
    component: withOwnerPage(OwnerDrawPage, "Bốc thăm & Lịch đấu", "Sinh bracket và quản lý trận đấu", { fullWidth: true }),
  },
  {
    path: "/owner/tournaments/:id/notifications",
    component: withOwnerPage(OwnerTournamentNotifications, "Thông báo", "Gửi email và cấu hình tự động cho giải đấu", { fullWidth: true }),
  },
  {
    path: "/owner/news",
    component: withOwnerPage(OwnerNewsCMS, "Tin tức & Bài viết", "Quản lý nội dung"),
  },
  {
    path: "/owner/news/categories",
    component: withOwnerPage(OwnerNewsTaxonomy, "Danh mục & Thẻ", "Quản lý danh mục và thẻ bài viết"),
  },
  {
    path: "/owner/news/:id",
    component: withOwnerPage(OwnerArticleEditor, "Bài viết", "Tạo / sửa bài viết", { fullWidth: true }),
  },
  {
    path: "/owner/facebook-posts",
    component: withOwnerPage(
      () => <FacebookPostsStatsPage basePath="/owner/facebook-posts" />,
      "Thống kê Facebook",
      "Bài đăng giải đấu và lượt tương tác trên Page",
      { fullWidth: true }
    ),
  },
  {
    path: "/owner/facebook-posts/:postId",
    component: withOwnerPage(
      () => <FacebookPostDetailPage basePath="/owner/facebook-posts" />,
      "Chi tiết bài Facebook",
      "Nội dung đầy đủ và thống kê tương tác",
      { fullWidth: true }
    ),
  },
  {
    path: "/manager/dashboard",
    component: withManagerPage(ManagerDashboard, "Tổng quan", "Thống kê giải đấu"),
  },
  {
    path: "/manager/analytics",
    component: withManagerPage(
      ManagerStatistics,
      "Thống kê & Phân tích",
      "Doanh thu, hiệu suất giải đấu, bảng xếp hạng cơ thủ và xuất báo cáo",
      { fullWidth: true }
    ),
  },
  {
    path: "/manager/transactions",
    component: withManagerPage(
      ManagerTransactions,
      "Quản lý giao dịch",
      "Tra cứu và quản lý toàn bộ giao dịch thanh toán",
      { fullWidth: true }
    ),
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
    path: "/manager/branches",
    component: withManagerPage(
      ManagerBranchListPage,
      "Chi nhánh",
      "Các chi nhánh bạn được phân quyền quản lý"
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
    path: "/manager/tournaments/:id/live",
    component: withManagerPage(
      ManagerTournamentLive,
      "Dashboard trực tiếp",
      "Theo dõi tỉ số realtime theo dải bàn",
      { fullWidth: true }
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
    path: "/manager/tournaments/:id/finance",
    component: withManagerPage(ManagerTournamentFinance, "Thu chi giải đấu", "Ghi nhận khoản thu/chi ngoài tiền đăng ký"),
  },
  {
    path: "/manager/tournaments/:id/draw",
    component: withManagerPage(ManagerDrawPage, "Bốc thăm & Lịch đấu", "Sinh bracket và quản lý trận đấu", { fullWidth: true }),
  },
  {
    path: "/manager/tournaments/:id/notifications",
    component: withManagerPage(ManagerTournamentNotifications, "Thông báo", "Gửi email và cấu hình tự động cho giải đấu", { fullWidth: true }),
  },
  {
    path: "/manager/news",
    component: withManagerPage(ManagerNewsCMS, "Tin tức & Bài viết", "Quản lý nội dung"),
  },
  {
    path: "/manager/news/categories",
    component: withManagerPage(ManagerNewsTaxonomy, "Danh mục & Thẻ", "Quản lý danh mục và thẻ bài viết"),
  },
  {
    path: "/manager/news/:id",
    component: withManagerPage(ManagerArticleEditor, "Bài viết", "Tạo / sửa bài viết", { fullWidth: true }),
  },
  {
    path: "/manager/facebook-posts",
    component: withManagerPage(
      () => <FacebookPostsStatsPage basePath="/manager/facebook-posts" />,
      "Thống kê Facebook",
      "Bài đăng giải đấu và lượt tương tác trên Page",
      { fullWidth: true }
    ),
  },
  {
    path: "/manager/facebook-posts/:postId",
    component: withManagerPage(
      () => <FacebookPostDetailPage basePath="/manager/facebook-posts" />,
      "Chi tiết bài Facebook",
      "Nội dung đầy đủ và thống kê tương tác",
      { fullWidth: true }
    ),
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
    path: "/player/matches",
    component: PlayerMatchSchedule,
  },
  {
    path: "/payment/success",
    component: PaymentReturn,
  },
  {
    path: "/payment/cancel",
    component: PaymentReturn,
  },
  {
    path: "/live/tournament/:id",
    component: TournamentLiveTvPage,
  },
  { path: "/news", component: NewsListPage, layout: CommonLayout },
  { path: "/news/:slug", component: ArticleDetailPage, layout: CommonLayout },
  { path: "/event", component: EventPage, layout: CommonLayout },
  { path: "/event/players/user/:userId", component: PlayerProfilePage, layout: CommonLayout },
  { path: "/event/players/:participantId", component: PlayerProfilePage, layout: CommonLayout },
  { path: "/event/:id", component: EventDetailPage, layout: CommonLayout },
  { path: "/branches", component: BranchListPage, layout: CommonLayout },
  { path: "/branches/:id", component: BranchDetailPage, layout: CommonLayout },
  { path: "/rankings", component: RankingsPage, layout: CommonLayout },
  { path: "/", component: Home, layout: CommonLayout },
  { path: "/login", component: LoginPage, layout: null },
  { path: "/register", component: RegisterPage, layout: null },
  { path: "/forgot-password", component: ForgotPasswordPage, layout: null },
  { path: "/profile", component: Profile, layout: CommonLayout },
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
