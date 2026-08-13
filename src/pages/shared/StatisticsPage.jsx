import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";
import {
  DollarSign, Trophy, Users, TrendingUp, Download, Crown, Repeat,
  ThumbsUp, MessageCircle, Share2, Eye, Search, FileSpreadsheet,
  AlertTriangle, Info, Bookmark, X, UserX, Wallet, CheckCircle2,
} from "lucide-react";
import AdminCard from "../../components/admin/ui/AdminCard";
import AdminStatCard from "../../components/admin/ui/AdminStatCard";
import AdminButton from "../../components/admin/ui/AdminButton";
import AdminModal from "../../components/admin/ui/AdminModal";
import ChartOrEmpty from "../../components/admin/ui/ChartOrEmpty";
import TransactionTable from "../../components/admin/ui/TransactionTable";
import { getApiErrorMessage } from "../../utils/apiError";
import { formatVND } from "../../utils/helpers";
import { useThemeStore } from "../../store/themeStore";
import { RANGE_PRESETS, resolveRange } from "../../utils/dateRangePresets";
import {
  hasCounts, shortMoney, donutOptions, areaTrendOptions, columnTrendOptions,
  barByStatusOptions, barByAmountOptions,
} from "../../utils/chartHelpers";

const GRANULARITY_OPTIONS = [
  { value: "day", label: "Theo ngày" },
  { value: "week", label: "Theo tuần" },
  { value: "month", label: "Theo tháng" },
];

const RANK_MEDAL = ["🥇", "🥈", "🥉"];

/** Khớp enum TournamentStatus ở BE — dùng cho bộ lọc trạng thái giải đấu. */
const TOURNAMENT_STATUS_OPTIONS = [
  { value: "DRAFT", label: "Nháp" },
  { value: "OPEN_FOR_REGISTRATION", label: "Mở đăng ký" },
  { value: "REGISTRATION_CLOSED", label: "Đóng đăng ký" },
  { value: "DRAW_PREVIEW", label: "Xem trước bốc thăm" },
  { value: "DRAW_DONE", label: "Đã bốc thăm" },
  { value: "FINAL_BRACKET_READY", label: "Sẵn sàng chung kết" },
  { value: "IN_PROGRESS", label: "Đang diễn ra" },
  { value: "COMPLETED", label: "Hoàn thành" },
  { value: "CANCELLED", label: "Đã hủy" },
];

const PLAYER_SORT_OPTIONS = [
  { value: "PRIZE", label: "Tiền thưởng" },
  { value: "POINTS", label: "Điểm" },
  { value: "TOURNAMENTS", label: "Số giải đã chơi" },
  { value: "SPEND", label: "Chi tiêu" },
  { value: "WINS", label: "Trận thắng" },
  { value: "MATCHES", label: "Trận đã đấu" },
  { value: "RECENCY", label: "Hoạt động gần nhất" },
];

const PLAYER_SEGMENT_TABS = [
  { value: "ALL", label: "Tất cả" },
  { value: "NEW", label: "Mới" },
  { value: "RETURNING", label: "Quay lại" },
  { value: "CHAMPION", label: "Vô địch" },
  { value: "AT_RISK", label: "Rủi ro" },
];

/** Whitelist dimension/metric phải khớp enum AnalyticsDimension/AnalyticsMetric ở BE — xem AnalyticsServiceImpl. */
const DIMENSIONS = [
  { value: "TIME", label: "Thời gian" },
  { value: "BRANCH", label: "Chi nhánh" },
  { value: "TOURNAMENT", label: "Giải đấu" },
  { value: "TOURNAMENT_STATUS", label: "Trạng thái giải đấu" },
  { value: "GAME_TYPE", label: "Loại bi" },
  { value: "PAYMENT_METHOD", label: "Phương thức thanh toán", factKindOnly: "PAYMENT" },
  { value: "PAYMENT_STATUS", label: "Trạng thái thanh toán", factKindOnly: "PAYMENT" },
  { value: "REGISTRATION_STATUS", label: "Trạng thái đăng ký", factKindOnly: "REGISTRATION" },
  { value: "NEW_VS_RETURNING", label: "Mới / Quay lại", factKindOnly: "REGISTRATION" },
];
const DIMENSION_BY_VALUE = Object.fromEntries(DIMENSIONS.map((d) => [d.value, d]));

const METRICS = [
  { value: "REVENUE", label: "Doanh thu", factKind: "PAYMENT", money: true },
  { value: "REFUND_AMOUNT", label: "Hoàn / hủy / thất bại", factKind: "PAYMENT", money: true },
  { value: "TRANSACTION_COUNT", label: "Số giao dịch", factKind: "PAYMENT" },
  { value: "AVG_TRANSACTION_VALUE", label: "Giá trị TB / giao dịch", factKind: "PAYMENT", money: true },
  { value: "PAYMENT_SUCCESS_RATE", label: "Tỷ lệ thanh toán thành công", factKind: "PAYMENT", pct: true },
  { value: "TOURNAMENT_COUNT", label: "Số giải đấu", factKind: "TOURNAMENT" },
  { value: "AVG_FILL_RATE", label: "Tỷ lệ lấp đầy TB", factKind: "TOURNAMENT", pct: true },
  { value: "COMPLETION_RATE", label: "Tỷ lệ hoàn thành trận", factKind: "TOURNAMENT", pct: true },
  { value: "PRIZE_POOL", label: "Tổng tiền thưởng", factKind: "TOURNAMENT", money: true },
  { value: "NET_PROFIT", label: "Lợi nhuận ròng", factKind: "TOURNAMENT", money: true },
  { value: "REGISTRATION_COUNT", label: "Số lượt đăng ký", factKind: "REGISTRATION" },
  { value: "APPROVAL_RATE", label: "Tỷ lệ duyệt", factKind: "REGISTRATION", pct: true },
  { value: "UNIQUE_PLAYERS", label: "Người chơi duy nhất", factKind: "REGISTRATION" },
  { value: "NEW_PLAYERS", label: "Người chơi mới", factKind: "REGISTRATION" },
  { value: "RETURNING_PLAYERS", label: "Người chơi quay lại", factKind: "REGISTRATION" },
];
const METRIC_BY_VALUE = Object.fromEntries(METRICS.map((m) => [m.value, m]));

const EXPLORE_PRESETS = [
  { name: "Doanh thu theo thời gian", dims: ["TIME"], metrics: ["REVENUE"], chart: "line" },
  { name: "So sánh chi nhánh", dims: ["BRANCH"], metrics: ["REVENUE"], chart: "bar" },
  { name: "Hiệu suất theo loại bi", dims: ["GAME_TYPE"], metrics: ["TOURNAMENT_COUNT", "AVG_FILL_RATE"], chart: "table" },
  { name: "Phương thức thanh toán", dims: ["PAYMENT_METHOD"], metrics: ["REVENUE", "TRANSACTION_COUNT"], chart: "donut" },
  { name: "Người chơi mới & quay lại", dims: ["NEW_VS_RETURNING"], metrics: ["UNIQUE_PLAYERS"], chart: "donut" },
];

const formatMetricValue = (meta, v) => {
  if (v == null) return "—";
  if (meta?.money) return formatVND(v);
  if (meta?.pct) return `${Math.round(Number(v))}%`;
  return Number(v).toLocaleString("vi-VN");
};

const StatisticsPage = ({ analyticsApi, branchApi, title }) => {
  const isDark = useThemeStore((s) => s.theme === "dark");
  const [activeTab, setActiveTab] = useState("overview");
  const [preset, setPreset] = useState("30d");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [granularityOverride, setGranularityOverride] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const hasLoadedRef = useRef(false);
  const [exporting, setExporting] = useState(false);

  const [overview, setOverview] = useState(null);
  const [revenue, setRevenue] = useState(null);
  const [tournaments, setTournaments] = useState([]);
  const [social, setSocial] = useState(null);
  const [funnel, setFunnel] = useState(null);
  const [gameTypes, setGameTypes] = useState([]);
  const [playerGrowth, setPlayerGrowth] = useState(null);

  const [detailId, setDetailId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailExporting, setDetailExporting] = useState(false);
  const [tournamentSearch, setTournamentSearch] = useState("");
  const [playerDetailId, setPlayerDetailId] = useState(null);

  // ── filters dùng chung Overview + Explore ──
  const [branches, setBranches] = useState([]);
  const [branchId, setBranchId] = useState("");
  const [gameTypeFilter, setGameTypeFilter] = useState([]);
  const [statusFilter, setStatusFilter] = useState([]);
  const filters = useMemo(() => ({
    branchId: branchId || undefined,
    gameTypes: gameTypeFilter.length ? gameTypeFilter : undefined,
    statuses: statusFilter.length ? statusFilter : undefined,
  }), [branchId, gameTypeFilter, statusFilter]);

  useEffect(() => {
    if (!branchApi) return;
    branchApi.listBranches({ status: "ACTIVE", size: 100 })
      .then((result) => setBranches(result?.content || []))
      .catch(() => { /* không chặn trang nếu tải chi nhánh lỗi — filter chi nhánh chỉ ẩn đi */ });
  }, [branchApi]);

  const baseRange = useMemo(() => resolveRange(preset, customFrom, customTo), [preset, customFrom, customTo]);
  const granularity = granularityOverride || baseRange.granularity;
  const range = useMemo(() => ({ ...baseRange, granularity }), [baseRange, granularity]);

  const handlePresetChange = (value) => {
    setPreset(value);
    setGranularityOverride(null);
  };

  const load = useCallback(async () => {
    if (hasLoadedRef.current) setRefreshing(true); else setLoading(true);
    try {
      const { from, to, granularity: g } = range;
      const [ov, rev, tour, soc, fun, gt, growth] = await Promise.all([
        analyticsApi.getOverview(from, to, filters),
        analyticsApi.getRevenue(from, to, g, filters),
        analyticsApi.getTournaments(from, to, filters),
        analyticsApi.getSocial(from, to),
        analyticsApi.getFunnel(from, to, g, filters),
        analyticsApi.getGameTypes(from, to),
        analyticsApi.getPlayerGrowth(from, to, g, filters),
      ]);
      setOverview(ov);
      setRevenue(rev);
      setTournaments(Array.isArray(tour) ? tour : []);
      setSocial(soc);
      setFunnel(fun);
      setGameTypes(Array.isArray(gt) ? gt : []);
      setPlayerGrowth(growth);
      hasLoadedRef.current = true;
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [analyticsApi, range, filters]);

  useEffect(() => { load(); }, [load]);

  const handleExport = async () => {
    setExporting(true);
    try {
      await analyticsApi.downloadReport(range.from, range.to);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setExporting(false);
    }
  };

  const openTournamentDetail = async (id) => {
    setDetailId(id);
    setDetail(null);
    setDetailLoading(true);
    try {
      const d = await analyticsApi.getTournamentDetail(id);
      setDetail(d);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
      setDetailId(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleExportTournament = async () => {
    if (!detailId) return;
    setDetailExporting(true);
    try {
      await analyticsApi.downloadTournamentReport(detailId);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setDetailExporting(false);
    }
  };

  const kpis = overview ? [
    {
      icon: DollarSign, accent: "emerald", label: "Tổng doanh thu",
      value: formatVND(overview.totalRevenue || 0),
      trend: overview.revenueGrowthPct != null ? overview.revenueGrowthPct : undefined,
    },
    {
      icon: Trophy, accent: "indigo", label: "Tổng giải đấu",
      value: overview.totalTournaments,
      hint: overview.topTournamentName ? `Nổi bật: ${overview.topTournamentName}` : undefined,
    },
    {
      icon: TrendingUp, accent: "cyan", label: "Tỷ lệ lấp đầy TB",
      value: `${Math.round(overview.avgFillRatePct || 0)}%`,
      hint: "Trên tổng số giải trong kỳ",
    },
    {
      icon: Users, accent: "amber", label: "Người chơi (duy nhất)",
      value: overview.totalUniquePlayers,
      hint: "Đăng ký trong kỳ",
    },
    {
      icon: Repeat, accent: "cyan", label: "Tỷ lệ khách quay lại",
      value: `${Math.round(overview.periodReturnRatePct || 0)}%`,
      hint: "% người chơi hoạt động ở kỳ trước cũng quay lại kỳ này",
    },
    {
      icon: Crown, accent: "indigo", label: "Giải đấu quán quân",
      value: overview.topTournamentName || "—",
      hint: overview.topTournamentRevenue ? formatVND(overview.topTournamentRevenue) : undefined,
    },
  ] : [];

  const kpis2 = overview ? [
    { icon: Wallet, accent: "emerald", label: "ARPU (DT / người chơi)", value: formatVND(overview.arpu || 0) },
    { icon: CheckCircle2, accent: "cyan", label: "Tỷ lệ thanh toán thành công", value: `${Math.round(overview.paymentSuccessRatePct || 0)}%` },
    { icon: UserX, accent: "amber", label: "Người chơi rủi ro rời bỏ", value: overview.atRiskPlayerCount ?? 0, hint: "Không hoạt động > 90 ngày" },
  ] : [];

  const gameTypeBarItems = gameTypes.map((g) => ({ label: g.label, amount: g.totalRevenue }));
  const gameTypeOptions = gameTypes.map((g) => ({ value: g.code, label: g.label }));
  const approvalDenominator = (funnel?.approved || 0) + (funnel?.rejected || 0);
  const approvalRatePct = approvalDenominator > 0 ? Math.round((funnel.approved / approvalDenominator) * 100) : null;

  const filteredTournaments = tournamentSearch.trim()
    ? tournaments.filter((t) => t.name.toLowerCase().includes(tournamentSearch.trim().toLowerCase()))
    : tournaments;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            {title}
            {refreshing && <span className="text-xs font-normal text-indigo-500 animate-pulse">Đang cập nhật...</span>}
          </h1>
          <p className="text-sm text-slate-500 dark:text-white/60">Phân tích chi tiết doanh thu, giải đấu, cơ thủ và truyền thông</p>
        </div>
        <AdminButton variant="secondary" onClick={handleExport} disabled={exporting || loading}>
          <Download size={14} className={exporting ? "animate-pulse" : ""} />
          {exporting ? "Đang xuất..." : "Xuất báo cáo Excel"}
        </AdminButton>
      </div>

      <div className="flex gap-1 border-b border-slate-200 dark:border-white/10">
        {[{ value: "overview", label: "Tổng quan" }, { value: "explore", label: "Khám phá" }].map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => setActiveTab(t.value)}
            className={`px-4 py-2 text-sm font-semibold border-b-2 -mb-px transition-colors ${
              activeTab === t.value ? "border-indigo-600 text-indigo-700" : "border-transparent text-slate-500 dark:text-white/60 hover:text-slate-700 dark:hover:text-white/75"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {RANGE_PRESETS.map((p) => (
          <button
            key={p.value}
            type="button"
            onClick={() => handlePresetChange(p.value)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              preset === p.value
                ? "bg-indigo-600 text-white"
                : "bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-white/70 hover:bg-slate-200 dark:hover:bg-white/10"
            }`}
          >
            {p.label}
          </button>
        ))}
        {preset === "custom" && (
          <div className="flex items-center gap-2 ml-1">
            <input type="date" className="admin-input w-auto" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} />
            <span className="text-slate-400 dark:text-white/40 text-xs">đến</span>
            <input type="date" className="admin-input w-auto" value={customTo} onChange={(e) => setCustomTo(e.target.value)} />
          </div>
        )}
        {activeTab === "overview" && (
          <select
            className="admin-select w-auto ml-auto"
            value={granularity}
            onChange={(e) => setGranularityOverride(e.target.value)}
          >
            {GRANULARITY_OPTIONS.map((g) => (
              <option key={g.value} value={g.value}>{g.label}</option>
            ))}
          </select>
        )}
      </div>

      <FilterBar
        branches={branches}
        gameTypeOptions={gameTypeOptions}
        branchId={branchId} setBranchId={setBranchId}
        gameTypeFilter={gameTypeFilter} setGameTypeFilter={setGameTypeFilter}
        statusFilter={statusFilter} setStatusFilter={setStatusFilter}
      />

      {activeTab === "explore" ? (
        <ExploreTab analyticsApi={analyticsApi} range={range} filters={filters} />
      ) : loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="admin-card h-32 animate-pulse bg-slate-100 dark:bg-white/10" />
          ))}
        </div>
      ) : (
        <div className={`space-y-6 transition-opacity ${refreshing ? "opacity-60 pointer-events-none" : ""}`}>
          <InsightsChips analyticsApi={analyticsApi} range={range} branchId={filters.branchId} />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {kpis.map((c) => <AdminStatCard key={c.label} {...c} />)}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {kpis2.map((c) => <AdminStatCard key={c.label} {...c} />)}
          </div>

          <AdminCard
            title="Hiệu suất giải đấu — bấm vào 1 dòng để xem chi tiết"
            action={
              <div className="relative">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-white/40 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Tìm giải đấu..."
                  className="admin-input w-56 pl-8"
                  value={tournamentSearch}
                  onChange={(e) => setTournamentSearch(e.target.value)}
                />
              </div>
            }
          >
            {tournaments.length === 0 ? (
              <p className="text-sm text-slate-400 dark:text-white/40 text-center py-6">Chưa có giải đấu nào trong kỳ này.</p>
            ) : filteredTournaments.length === 0 ? (
              <p className="text-sm text-slate-400 dark:text-white/40 text-center py-6">Không tìm thấy giải đấu nào khớp "{tournamentSearch}".</p>
            ) : (
              <div className="admin-table-wrap">
                <table className="admin-table w-full text-sm">
                  <thead>
                    <tr>
                      <th>Tên giải đấu</th>
                      <th>Chi nhánh</th>
                      <th>VĐV</th>
                      <th>Lấp đầy</th>
                      <th>Doanh thu</th>
                      <th>Lợi nhuận</th>
                      <th>Hoàn thành</th>
                      <th>Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTournaments.map((t) => (
                      <tr key={t.id} className="cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5" onClick={() => openTournamentDetail(t.id)}>
                        <td className="font-medium text-indigo-700">{t.name}</td>
                        <td className="text-xs text-slate-500 dark:text-white/60">{t.branchName}</td>
                        <td className="text-xs">{t.participants}/{t.maxParticipants ?? "—"}</td>
                        <td className="text-xs">{t.fillRatePct != null ? `${Math.round(t.fillRatePct)}%` : "—"}</td>
                        <td className="text-xs font-semibold text-emerald-700">{formatVND(t.revenue || 0)}</td>
                        <td className={`text-xs font-semibold ${Number(t.netProfit) < 0 ? "text-rose-600" : "text-emerald-700"}`}>
                          {formatVND(t.netProfit || 0)}
                        </td>
                        <td className="text-xs">{t.completionRatePct != null ? `${Math.round(t.completionRatePct)}%` : "—"}</td>
                        <td className="text-xs">{t.statusLabel}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </AdminCard>

          <MonthlyReportCard analyticsApi={analyticsApi} isDark={isDark} />

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <AdminCard title="Xu hướng doanh thu" padding={false}>
              <div className="px-2 pb-2">
                <ChartOrEmpty
                  hasData={revenue?.trend?.some((p) => Number(p.amount) > 0)}
                  options={areaTrendOptions(revenue?.trend || [], "Doanh thu", "#4f46e5", "amount", shortMoney, isDark)}
                />
              </div>
            </AdminCard>
            <AdminCard title="Doanh thu theo phương thức thanh toán" padding={false}>
              <div className="px-2 pb-2">
                <ChartOrEmpty
                  hasData={hasCounts(revenue?.byPaymentMethod)}
                  options={donutOptions(revenue?.byPaymentMethod || [], "Giao dịch", isDark)}
                />
              </div>
            </AdminCard>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <AdminCard
              title="Phễu đăng ký"
              padding={false}
              action={approvalRatePct != null && (
                <span className="text-xs font-semibold text-emerald-700 pr-1">Tỷ lệ duyệt: {approvalRatePct}%</span>
              )}
            >
              <div className="px-2 pb-2">
                <ChartOrEmpty
                  hasData={hasCounts(funnel?.byStatus)}
                  options={donutOptions(funnel?.byStatus || [], "Đăng ký", isDark)}
                />
              </div>
            </AdminCard>
            <AdminCard title="Người chơi mới theo kỳ" padding={false}>
              <div className="px-2 pb-2">
                <ChartOrEmpty
                  hasData={playerGrowth?.newPlayersTrend?.some((p) => p.count > 0)}
                  options={columnTrendOptions(playerGrowth?.newPlayersTrend || [], "Người chơi mới", "#8b5cf6", isDark)}
                />
              </div>
            </AdminCard>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <AdminCard title="Doanh thu theo loại bi" padding={false}>
              <div className="px-2 pb-2">
                <ChartOrEmpty
                  hasData={gameTypeBarItems.some((g) => Number(g.amount) > 0)}
                  options={barByAmountOptions(gameTypeBarItems, "Doanh thu", "#f59e0b", isDark)}
                />
              </div>
            </AdminCard>
            {overview?.branchCount > 1 && (
              <AdminCard title="Doanh thu theo chi nhánh" padding={false}>
                <div className="px-2 pb-2">
                  <ChartOrEmpty
                    hasData={(revenue?.byBranch || []).some((b) => Number(b.amount) > 0)}
                    options={barByAmountOptions(revenue?.byBranch || [], "Doanh thu", "#06b6d4", isDark)}
                  />
                </div>
              </AdminCard>
            )}
          </div>

          <PlayerLeaderboardCard analyticsApi={analyticsApi} range={range} filters={filters} onSelectPlayer={setPlayerDetailId} />

          <RetentionLoyaltyCard analyticsApi={analyticsApi} range={range} filters={filters} isDark={isDark} />

          <AdminCard title="Hiệu quả truyền thông Facebook">
            {social && social.totalPosts > 0 ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <StatMini icon={ThumbsUp} label="Lượt thích" value={social.totalLikes} />
                  <StatMini icon={MessageCircle} label="Bình luận" value={social.totalComments} />
                  <StatMini icon={Share2} label="Chia sẻ" value={social.totalShares} />
                  <StatMini icon={Eye} label="Tiếp cận" value={social.totalReach} />
                </div>
                {social.topPostTournamentName && (
                  <p className="text-xs text-slate-500 dark:text-white/60">
                    Bài đăng nổi bật nhất thuộc giải <b>{social.topPostTournamentName}</b> — {social.topPostReach.toLocaleString("vi-VN")} lượt tiếp cận.
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-slate-400 dark:text-white/40 text-center py-6">Chưa có bài đăng Facebook nào trong kỳ này.</p>
            )}
          </AdminCard>
        </div>
      )}

      <AdminModal
        open={detailId != null}
        onClose={() => setDetailId(null)}
        title={detail ? detail.name : "Đang tải..."}
        size="lg"
        footer={
          <AdminButton variant="secondary" onClick={handleExportTournament} disabled={detailExporting || detailLoading}>
            <Download size={14} className={detailExporting ? "animate-pulse" : ""} />
            {detailExporting ? "Đang xuất..." : "Xuất báo cáo giải đấu"}
          </AdminButton>
        }
      >
        {detailLoading || !detail ? (
          <div className="py-10 text-center text-sm text-slate-400 dark:text-white/40">Đang tải chi tiết...</div>
        ) : (
          <TournamentDetailContent detail={detail} analyticsApi={analyticsApi} isDark={isDark} />
        )}
      </AdminModal>

      <PlayerDetailModal
        userId={playerDetailId}
        analyticsApi={analyticsApi}
        branchId={filters.branchId}
        onClose={() => setPlayerDetailId(null)}
      />
    </div>
  );
};

/** Bộ lọc chi nhánh (single) + loại bi/trạng thái giải đấu (multi, dạng chip) dùng chung Overview + Explore. */
const FilterBar = ({ branches, gameTypeOptions, branchId, setBranchId, gameTypeFilter, setGameTypeFilter, statusFilter, setStatusFilter }) => {
  const toggle = (arr, setArr, value) => setArr(arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value]);

  return (
    <div className="flex flex-wrap items-center gap-2">
      {branches.length > 0 && (
        <select className="admin-select w-auto" value={branchId} onChange={(e) => setBranchId(e.target.value)}>
          <option value="">Tất cả chi nhánh</option>
          {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
      )}
      {gameTypeOptions.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {gameTypeOptions.map((g) => (
            <button
              key={g.value} type="button" onClick={() => toggle(gameTypeFilter, setGameTypeFilter, g.value)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                gameTypeFilter.includes(g.value)
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "bg-white dark:bg-[#161a22] text-slate-600 dark:text-white/70 border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5"
              }`}
            >
              {g.label}
            </button>
          ))}
        </div>
      )}
      <details className="relative">
        <summary className="admin-select w-auto cursor-pointer list-none px-3 py-1.5 text-xs inline-block">
          Trạng thái giải đấu {statusFilter.length > 0 && `(${statusFilter.length})`}
        </summary>
        <div className="absolute z-10 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-lg shadow-lg p-2 w-60 grid grid-cols-1 gap-0.5">
          {TOURNAMENT_STATUS_OPTIONS.map((s) => (
            <label key={s.value} className="flex items-center gap-2 text-xs px-1.5 py-1 hover:bg-slate-50 dark:hover:bg-white/5 rounded cursor-pointer">
              <input type="checkbox" checked={statusFilter.includes(s.value)} onChange={() => toggle(statusFilter, setStatusFilter, s.value)} />
              {s.label}
            </label>
          ))}
        </div>
      </details>
    </div>
  );
};

const SEVERITY_STYLES = {
  WARNING: "bg-amber-100 text-amber-800",
  POSITIVE: "bg-emerald-100 text-emerald-800",
  INFO: "bg-indigo-100 text-indigo-800",
};
const SEVERITY_ICON = { WARNING: AlertTriangle, POSITIVE: TrendingUp, INFO: Info };

/** Chip insight rule-based tính từ số liệu thật — xem AnalyticsServiceImpl#buildInsights, không có "AI" giả. */
const InsightsChips = ({ analyticsApi, range, branchId }) => {
  const [insights, setInsights] = useState([]);
  useEffect(() => {
    let alive = true;
    analyticsApi.getInsights(range.from, range.to, branchId)
      .then((data) => { if (alive) setInsights(Array.isArray(data) ? data : []); })
      .catch(() => { /* insight chip không quan trọng bằng phần còn lại của trang — lỗi thì bỏ qua */ });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [analyticsApi, range.from, range.to, branchId]);

  if (insights.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {insights.map((i, idx) => {
        const Icon = SEVERITY_ICON[i.severity] || Info;
        return (
          <span key={idx} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${SEVERITY_STYLES[i.severity] || SEVERITY_STYLES.INFO}`}>
            <Icon size={13} />
            {i.message}
          </span>
        );
      })}
    </div>
  );
};

/** Bảng xếp hạng cơ thủ đa tiêu chí — tự fetch riêng để đổi sort/search/segment không kéo lại toàn trang. */
const PlayerLeaderboardCard = ({ analyticsApi, range, filters, onSelectPlayer }) => {
  const [sortBy, setSortBy] = useState("PRIZE");
  const [segment, setSegment] = useState("ALL");
  const [search, setSearch] = useState("");
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await analyticsApi.getPlayers({
        from: range.from, to: range.to,
        branchId: filters.branchId, gameTypes: filters.gameTypes, statuses: filters.statuses,
        sortBy, limit: 20, segment, search: search.trim() || undefined,
      });
      setPlayers(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [analyticsApi, range.from, range.to, filters.branchId, filters.gameTypes, filters.statuses, sortBy, segment, search]);

  useEffect(() => { load(); }, [load]);

  return (
    <AdminCard
      title="Cơ thủ nổi bật — bấm vào 1 dòng để xem lịch sử"
      action={
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-white/40 pointer-events-none" />
            <input type="text" placeholder="Tìm cơ thủ..." className="admin-input w-40 pl-8" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <select className="admin-select w-auto" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            {PLAYER_SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      }
    >
      <div className="flex flex-wrap gap-1.5 mb-3">
        {PLAYER_SEGMENT_TABS.map((t) => (
          <button
            key={t.value} type="button" onClick={() => setSegment(t.value)}
            className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-colors ${
              segment === t.value ? "bg-indigo-600 text-white" : "bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-white/70 hover:bg-slate-200 dark:hover:bg-white/10"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      {loading ? (
        <div className="h-40 animate-pulse bg-slate-100 dark:bg-white/10 rounded-xl" />
      ) : players.length === 0 ? (
        <p className="text-sm text-slate-400 dark:text-white/40 text-center py-6">Không có cơ thủ nào khớp bộ lọc.</p>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table w-full text-sm">
            <thead>
              <tr>
                <th>Cơ thủ</th>
                <th>Số giải (kỳ / cả đời)</th>
                <th>Chi tiêu</th>
                <th>Tiền thưởng</th>
                <th>Điểm</th>
                <th>Trận thắng/đấu</th>
                <th>Hoạt động gần nhất</th>
              </tr>
            </thead>
            <tbody>
              {players.map((p, idx) => (
                <tr key={p.userId} className="cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5" onClick={() => onSelectPlayer(p.userId)}>
                  <td className="font-medium text-indigo-700">
                    {RANK_MEDAL[idx] ? `${RANK_MEDAL[idx]} ` : ""}{p.playerName}
                    {p.isNewPlayer && <span className="ml-1.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-cyan-100 text-cyan-700">Mới</span>}
                    {p.championCount > 0 && <span className="ml-1.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-700">🏆{p.championCount}</span>}
                  </td>
                  <td className="text-xs">{p.tournamentsPlayed} / {p.lifetimeTournaments}</td>
                  <td className="text-xs font-semibold">{formatVND(p.totalSpend || 0)}</td>
                  <td className="text-xs font-semibold text-emerald-700">{formatVND(p.totalPrizeAmount || 0)}</td>
                  <td className="text-xs">{p.totalPoints}</td>
                  <td className="text-xs">{p.matchesWon}/{p.matchesPlayed}{p.winRatePct != null ? ` (${Math.round(p.winRatePct)}%)` : ""}</td>
                  <td className="text-xs text-slate-500 dark:text-white/60">{p.daysSinceLastActivity != null ? `${p.daysSinceLastActivity} ngày trước` : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminCard>
  );
};

/** Retention nâng cao: period return rate + phân bố lòng trung thành + danh sách rủi ro rời bỏ. */
const RetentionLoyaltyCard = ({ analyticsApi, range, filters, isDark }) => {
  const [retention, setRetention] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await analyticsApi.getPlayerRetention(range.from, range.to, filters);
      setRetention(data);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [analyticsApi, range.from, range.to, filters.branchId, filters.gameTypes, filters.statuses]);

  useEffect(() => { load(); }, [load]);

  return (
    <AdminCard title="Retention & lòng trung thành">
      {loading ? (
        <div className="h-48 animate-pulse bg-slate-100 dark:bg-white/10 rounded-xl" />
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <StatMiniPlain label="Tỷ lệ quay lại (kỳ này)" value={`${Math.round(retention?.periodReturnRatePct || 0)}%`} />
            <StatMiniPlain label="Hoạt động ở kỳ trước" value={retention?.previousPeriodActivePlayers ?? 0} />
            <StatMiniPlain label="Quay lại ở kỳ này" value={retention?.currentPeriodReturningPlayers ?? 0} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-600 dark:text-white/70 mb-1">Phân bố lòng trung thành (số giải cả đời)</p>
            <ChartOrEmpty
              hasData={hasCounts(retention?.loyaltyDistribution)}
              options={barByStatusOptions(retention?.loyaltyDistribution || [], "Người chơi", isDark)}
            />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-600 dark:text-white/70 mb-2">
              Người chơi rủi ro rời bỏ (không hoạt động &gt; {retention?.atRiskThresholdDays ?? 90} ngày)
            </p>
            {retention?.atRiskPlayers?.length ? (
              <div className="admin-table-wrap">
                <table className="admin-table w-full text-sm">
                  <thead>
                    <tr><th>Cơ thủ</th><th>Số ngày vắng</th><th>Số giải cả đời</th><th>Chi tiêu cả đời</th></tr>
                  </thead>
                  <tbody>
                    {retention.atRiskPlayers.slice(0, 10).map((p) => (
                      <tr key={p.userId}>
                        <td className="text-xs font-medium">{p.playerName}</td>
                        <td className="text-xs text-rose-600">{p.daysSinceLastActivity} ngày</td>
                        <td className="text-xs">{p.lifetimeTournaments}</td>
                        <td className="text-xs">{formatVND(p.totalSpend || 0)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-slate-400 dark:text-white/40 text-center py-4">Không có người chơi rủi ro.</p>
            )}
          </div>
        </div>
      )}
    </AdminCard>
  );
};

/** Drill-down lịch sử 1 người chơi — đăng ký/thanh toán/kết quả dưới owner này. */
const PlayerDetailModal = ({ userId, analyticsApi, branchId, onClose }) => {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId == null) return;
    setLoading(true);
    setDetail(null);
    analyticsApi.getPlayerDetail(userId, branchId)
      .then(setDetail)
      .catch((err) => { toast.error(getApiErrorMessage(err)); onClose(); })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, analyticsApi, branchId]);

  return (
    <AdminModal open={userId != null} onClose={onClose} title={detail ? detail.playerName : "Đang tải..."} size="lg">
      {loading || !detail ? (
        <div className="py-10 text-center text-sm text-slate-400 dark:text-white/40">Đang tải...</div>
      ) : (
        <div className="space-y-4">
          <p className="text-xs text-slate-500 dark:text-white/60">{detail.email}</p>
          {detail.summary && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatMiniPlain label="Số giải cả đời" value={detail.summary.lifetimeTournaments} />
              <StatMiniPlain label="Vô địch / Top 3" value={`${detail.summary.championCount} / ${detail.summary.top3Count}`} />
              <StatMiniPlain label="Tổng tiền thưởng" value={formatVND(detail.summary.totalPrizeAmount || 0)} />
              <StatMiniPlain label="Trận thắng/đấu" value={`${detail.summary.matchesWon}/${detail.summary.matchesPlayed}`} />
            </div>
          )}
          <div>
            <p className="text-xs font-semibold text-slate-600 dark:text-white/70 mb-2">Lịch sử giải đấu</p>
            <div className="admin-table-wrap">
              <table className="admin-table w-full text-sm">
                <thead>
                  <tr>
                    <th>Giải đấu</th><th>Chi nhánh</th><th>Ngày ĐK</th><th>Trạng thái</th>
                    <th>Đã trả</th><th>Xếp hạng</th><th>Thưởng</th>
                  </tr>
                </thead>
                <tbody>
                  {(detail.history || []).map((h) => (
                    <tr key={h.tournamentId}>
                      <td className="text-xs font-medium">{h.tournamentName}</td>
                      <td className="text-xs text-slate-500 dark:text-white/60">{h.branchName}</td>
                      <td className="text-xs">{h.registeredAt ? new Date(h.registeredAt).toLocaleDateString("vi-VN") : "—"}</td>
                      <td className="text-xs">{h.registrationStatusLabel}</td>
                      <td className="text-xs">{formatVND(h.amountPaid || 0)}</td>
                      <td className="text-xs">{h.finalRank ?? "—"}</td>
                      <td className="text-xs">{h.prizeAmount ? formatVND(h.prizeAmount) : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </AdminModal>
  );
};

/** Tab "Khám phá" — query builder linh hoạt: chọn dimension/metric/loại biểu đồ, báo cáo mẫu, lưu báo cáo. */
const ExploreTab = ({ analyticsApi, range, filters }) => {
  const [dims, setDims] = useState(["TIME"]);
  const [metrics, setMetrics] = useState(["REVENUE"]);
  const [chartType, setChartType] = useState("line");
  const [compare, setCompare] = useState(false);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [savedViews, setSavedViews] = useState([]);
  const [saveViewName, setSaveViewName] = useState("");
  const [saving, setSaving] = useState(false);

  const activeFactKind = metrics.length > 0 ? METRIC_BY_VALUE[metrics[0]]?.factKind : null;

  const loadSavedViews = useCallback(async () => {
    try {
      const views = await analyticsApi.listSavedViews();
      setSavedViews(Array.isArray(views) ? views : []);
    } catch {
      // không chặn tab nếu tải danh sách báo cáo đã lưu lỗi
    }
  }, [analyticsApi]);
  useEffect(() => { loadSavedViews(); }, [loadSavedViews]);

  const toggleMetric = (value) => {
    const m = METRIC_BY_VALUE[value];
    setMetrics((prev) => {
      if (prev.includes(value)) return prev.filter((v) => v !== value);
      if (prev.length > 0 && METRIC_BY_VALUE[prev[0]].factKind !== m.factKind) return [value];
      return [...prev, value];
    });
  };
  const toggleDim = (value) => {
    setDims((prev) => (prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]));
  };

  const buildBody = useCallback((d, m, cmp) => ({
    from: range.from, to: range.to, granularity: range.granularity,
    branchIds: filters.branchId ? [Number(filters.branchId)] : undefined,
    filters: {
      gameTypes: filters.gameTypes,
      tournamentStatuses: filters.statuses,
    },
    dimensions: d, metrics: m, sortBy: m[0], sortDir: "DESC", limit: 100,
    comparePreviousPeriod: cmp,
  }), [range, filters]);

  const runQuery = async (d = dims, m = metrics, cmp = compare) => {
    if (d.length === 0 || m.length === 0) {
      toast.error("Chọn ít nhất 1 dimension và 1 metric.");
      return;
    }
    setLoading(true);
    try {
      const data = await analyticsApi.runQuery(buildBody(d, m, cmp));
      setResult(data);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const applyPreset = (preset) => {
    setDims(preset.dims);
    setMetrics(preset.metrics);
    setChartType(preset.chart);
    runQuery(preset.dims, preset.metrics, compare);
  };

  const handleSaveView = async () => {
    if (!saveViewName.trim()) { toast.error("Nhập tên báo cáo trước khi lưu."); return; }
    setSaving(true);
    try {
      await analyticsApi.createSavedView({ name: saveViewName.trim(), config: buildBody(dims, metrics, compare) });
      setSaveViewName("");
      await loadSavedViews();
      toast.success("Đã lưu báo cáo.");
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleLoadView = (view) => {
    const cfg = view.config;
    if (!cfg) { toast.error("Không đọc được cấu hình báo cáo này."); return; }
    setDims(cfg.dimensions || []);
    setMetrics(cfg.metrics || []);
    setCompare(!!cfg.comparePreviousPeriod);
    runQuery(cfg.dimensions || [], cfg.metrics || [], !!cfg.comparePreviousPeriod);
  };

  const handleDeleteView = async (id) => {
    try {
      await analyticsApi.deleteSavedView(id);
      await loadSavedViews();
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  const rows = result?.rows || [];
  const primaryMetricMeta = metrics[0] ? METRIC_BY_VALUE[metrics[0]] : null;
  const chartItems = dims.length === 1
    ? rows.map((r) => {
        const v = Number(r.metrics[metrics[0]] ?? 0);
        const label = r.dimensions[dims[0]] || "—";
        return { label, status: label, period: label, count: v, amount: v };
      })
    : [];

  return (
    <div className="space-y-4">
      <AdminCard title="Báo cáo mẫu">
        <div className="flex flex-wrap gap-2">
          {EXPLORE_PRESETS.map((p) => (
            <AdminButton key={p.name} variant="secondary" onClick={() => applyPreset(p)}>{p.name}</AdminButton>
          ))}
        </div>
      </AdminCard>

      <AdminCard title="Tùy chỉnh truy vấn">
        <div className="space-y-4">
          <div>
            <p className="text-xs font-semibold text-slate-600 dark:text-white/70 mb-1.5">Chia theo (dimension)</p>
            <div className="flex flex-wrap gap-1.5">
              {DIMENSIONS.filter((d) => !d.factKindOnly || !activeFactKind || d.factKindOnly === activeFactKind).map((d) => (
                <button
                  key={d.value} type="button" onClick={() => toggleDim(d.value)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                    dims.includes(d.value) ? "bg-indigo-600 text-white border-indigo-600" : "bg-white dark:bg-[#161a22] text-slate-600 dark:text-white/70 border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5"
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-600 dark:text-white/70 mb-1.5">Chỉ số (metric) — chỉ chọn được các chỉ số cùng 1 nhóm dữ liệu / truy vấn</p>
            <div className="flex flex-wrap gap-1.5">
              {METRICS.map((m) => {
                const disabled = activeFactKind && !metrics.includes(m.value) && m.factKind !== activeFactKind;
                return (
                  <button
                    key={m.value} type="button" onClick={() => toggleMetric(m.value)} disabled={disabled}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                      metrics.includes(m.value)
                        ? "bg-violet-600 text-white border-violet-600"
                        : disabled
                        ? "bg-white dark:bg-[#161a22] text-slate-300 border-slate-100 dark:border-white/10 cursor-not-allowed"
                        : "bg-white dark:bg-[#161a22] text-slate-600 dark:text-white/70 border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5"
                    }`}
                  >
                    {m.label}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <select className="admin-select w-auto" value={chartType} onChange={(e) => setChartType(e.target.value)}>
              <option value="table">Bảng</option>
              <option value="bar" disabled={dims.length !== 1}>Cột</option>
              <option value="donut" disabled={dims.length !== 1}>Tròn</option>
              <option value="line" disabled={dims[0] !== "TIME"}>Đường xu hướng</option>
            </select>
            <label className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-white/70">
              <input type="checkbox" checked={compare} onChange={(e) => setCompare(e.target.checked)} />
              So sánh với kỳ trước
            </label>
            <AdminButton onClick={() => runQuery()} disabled={loading}>
              {loading ? "Đang chạy..." : "Chạy truy vấn"}
            </AdminButton>
          </div>
          <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-100 dark:border-white/10">
            <input
              type="text" placeholder="Tên báo cáo để lưu..." className="admin-input w-56"
              value={saveViewName} onChange={(e) => setSaveViewName(e.target.value)}
            />
            <AdminButton variant="secondary" onClick={handleSaveView} disabled={saving}>
              <Bookmark size={14} /> Lưu báo cáo
            </AdminButton>
            {savedViews.length > 0 && (
              <select
                className="admin-select w-auto" defaultValue=""
                onChange={(e) => {
                  const view = savedViews.find((v) => String(v.id) === e.target.value);
                  if (view) handleLoadView(view);
                  e.target.value = "";
                }}
              >
                <option value="" disabled>Tải báo cáo đã lưu...</option>
                {savedViews.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
              </select>
            )}
            {savedViews.map((v) => (
              <button
                key={`del-${v.id}`} type="button" title={`Xóa "${v.name}"`}
                onClick={() => handleDeleteView(v.id)} className="text-slate-300 hover:text-rose-500"
              >
                <X size={13} />
              </button>
            ))}
          </div>
        </div>
      </AdminCard>

      <AdminCard title="Kết quả">
        {loading ? (
          <div className="h-64 animate-pulse bg-slate-100 dark:bg-white/10 rounded-xl" />
        ) : !result ? (
          <p className="text-sm text-slate-400 dark:text-white/40 text-center py-10">Chọn dimension/metric rồi bấm "Chạy truy vấn", hoặc dùng báo cáo mẫu ở trên.</p>
        ) : (
          <div className="space-y-4">
            {result.meta?.truncated && (
              <p className="text-xs text-amber-600">Kết quả bị giới hạn ở {rows.length} dòng — hãy thu hẹp bộ lọc để xem đầy đủ.</p>
            )}
            <div className="flex flex-wrap gap-3">
              {metrics.map((m) => {
                const meta = METRIC_BY_VALUE[m];
                const val = result.totals?.[m];
                const prevVal = result.previousPeriodTotals?.[m];
                return (
                  <div key={m} className="rounded-xl bg-slate-50 dark:bg-white/5 px-4 py-3">
                    <p className="text-[11px] text-slate-500 dark:text-white/60">{meta?.label || m}</p>
                    <p className="text-lg font-bold text-slate-800 dark:text-slate-100">{formatMetricValue(meta, val)}</p>
                    {compare && prevVal != null && (
                      <p className="text-[11px] text-slate-400 dark:text-white/40">Kỳ trước: {formatMetricValue(meta, prevVal)}</p>
                    )}
                  </div>
                );
              })}
            </div>

            {chartType !== "table" && dims.length === 1 ? (
              <ChartOrEmpty
                hasData={chartItems.length > 0}
                options={
                  chartType === "donut" ? donutOptions(chartItems, primaryMetricMeta?.label, false)
                  : chartType === "line" ? areaTrendOptions(chartItems, primaryMetricMeta?.label, "#4f46e5", "amount", primaryMetricMeta?.money ? shortMoney : undefined, false)
                  : primaryMetricMeta?.money ? barByAmountOptions(chartItems, primaryMetricMeta?.label, "#4f46e5", false)
                  : barByStatusOptions(chartItems, primaryMetricMeta?.label, false)
                }
              />
            ) : (
              <div className="admin-table-wrap">
                <table className="admin-table w-full text-sm">
                  <thead>
                    <tr>
                      {dims.map((d) => <th key={d}>{DIMENSION_BY_VALUE[d]?.label || d}</th>)}
                      {metrics.map((m) => <th key={m}>{METRIC_BY_VALUE[m]?.label || m}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.length === 0 ? (
                      <tr><td colSpan={dims.length + metrics.length} className="text-center py-6 text-slate-400 dark:text-white/40">Không có dữ liệu.</td></tr>
                    ) : rows.map((r, idx) => (
                      <tr key={idx}>
                        {dims.map((d) => <td key={d} className="text-xs">{r.dimensions[d] || "—"}</td>)}
                        {metrics.map((m) => (
                          <td key={m} className="text-xs font-medium">{formatMetricValue(METRIC_BY_VALUE[m], r.metrics[m])}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </AdminCard>
    </div>
  );
};

const TournamentDetailContent = ({ detail, analyticsApi, isDark }) => (
  <div className="space-y-5">
    <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-slate-500 dark:text-white/60">
      <span><b className="text-slate-700 dark:text-white/75">{detail.branchName}</b></span>
      <span>{detail.gameTypeLabel} · {detail.formatLabel}</span>
      <span>Phí đăng ký: {formatVND(detail.entryFee || 0)}</span>
      <span className="font-semibold text-indigo-700">{detail.statusLabel}</span>
    </div>

    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <StatMiniPlain label="Doanh thu" value={formatVND(detail.transactionStats?.totalAmount || 0)} />
      <StatMiniPlain label="Tiền thưởng" value={formatVND(detail.prizePool || 0)} />
      <StatMiniPlain
        label="Lợi nhuận"
        value={formatVND(detail.netProfit || 0)}
        valueClassName={Number(detail.netProfit) < 0 ? "text-rose-600" : "text-emerald-700"}
      />
      <StatMiniPlain label="Lấp đầy" value={detail.fillRatePct != null ? `${Math.round(detail.fillRatePct)}%` : "—"} />
    </div>
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <StatMiniPlain label="Trận đã đấu" value={`${detail.matchStats?.completed ?? 0}/${detail.matchStats?.total ?? 0}`} />
      <StatMiniPlain label="VĐV" value={`${detail.participantStats?.active ?? 0}/${detail.maxParticipants ?? "—"}`} />
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div>
        <p className="text-xs font-semibold text-slate-600 dark:text-white/70 mb-1">Phễu đăng ký</p>
        <ChartOrEmpty
          hasData={hasCounts(detail.registrationStats?.byStatus)}
          options={donutOptions(detail.registrationStats?.byStatus || [], "Đăng ký", isDark)}
        />
      </div>
      <div>
        <p className="text-xs font-semibold text-slate-600 dark:text-white/70 mb-1">Trận đấu theo trạng thái</p>
        <ChartOrEmpty
          hasData={hasCounts(detail.matchStats?.byStatus)}
          options={barByStatusOptions(detail.matchStats?.byStatus || [], "Trận đấu", isDark)}
        />
      </div>
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div>
        <p className="text-xs font-semibold text-slate-600 dark:text-white/70 mb-1">Giao dịch theo trạng thái</p>
        <ChartOrEmpty
          hasData={hasCounts(detail.transactionStats?.byStatus)}
          options={donutOptions(detail.transactionStats?.byStatus || [], "Giao dịch", isDark)}
        />
      </div>
      <div>
        <p className="text-xs font-semibold text-slate-600 dark:text-white/70 mb-1">Doanh thu theo tháng</p>
        <ChartOrEmpty
          hasData={detail.transactionStats?.trend?.some((p) => Number(p.amount) > 0)}
          options={areaTrendOptions(detail.transactionStats?.trend || [], "Doanh thu", "#4f46e5", "amount", shortMoney, isDark)}
        />
      </div>
    </div>

    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <StatMiniPlain label="Tỷ lệ thành công" value={`${Math.round(detail.transactionStats?.successRatePct || 0)}%`} />
      <StatMiniPlain label="Giá trị TB/GD" value={formatVND(detail.transactionStats?.avgTransactionValue || 0)} />
      <StatMiniPlain label="TG xử lý TB" value={`${Math.round(detail.transactionStats?.avgConversionMinutes || 0)} phút`} />
      <StatMiniPlain label="Tổng giao dịch" value={detail.transactionStats?.totalTransactions ?? 0} />
    </div>

    {detail.social && detail.social.totalPosts > 0 && (
      <div>
        <p className="text-xs font-semibold text-slate-600 dark:text-white/70 mb-1">Truyền thông Facebook</p>
        <div className="grid grid-cols-4 gap-2">
          <StatMiniPlain label="Bài đăng" value={detail.social.totalPosts} />
          <StatMiniPlain label="Lượt thích" value={detail.social.totalLikes} />
          <StatMiniPlain label="Bình luận" value={detail.social.totalComments} />
          <StatMiniPlain label="Tiếp cận" value={detail.social.totalReach} />
        </div>
      </div>
    )}

    <div>
      <p className="text-xs font-semibold text-slate-600 dark:text-white/70 mb-2">Danh sách giao dịch của giải này</p>
      <TransactionTable analyticsApi={analyticsApi} tournamentId={detail.id} />
    </div>
  </div>
);

/**
 * Báo cáo doanh thu 12 tháng theo năm dương lịch — độc lập với bộ lọc khoảng thời gian ở đầu
 * trang, vì chủ/quản lý thường cần xem "cả năm nay" hoặc so sánh với năm ngoái, không phải một
 * cửa sổ trượt ngắn hạn.
 */
const toMonthStr = (d) => d.toISOString().slice(0, 7);

const MonthlyReportCard = ({ analyticsApi, isDark }) => {
  const today = new Date();
  const defaultFrom = new Date(today.getFullYear(), today.getMonth() - 5, 1);
  const [fromMonth, setFromMonth] = useState(toMonthStr(defaultFrom));
  const [toMonth, setToMonth] = useState(toMonthStr(today));
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await analyticsApi.getMonthlyReport(fromMonth, toMonth);
      setReport(r);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [analyticsApi, fromMonth, toMonth]);

  useEffect(() => { load(); }, [load]);

  const handleExport = async () => {
    setExporting(true);
    try {
      await analyticsApi.downloadMonthlyReport(fromMonth, toMonth);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setExporting(false);
    }
  };

  const chartPoints = (report?.months || []).map((m) => ({
    period: m.monthLabel.replace("Tháng ", "T"),
    count: m.transactionCount,
    amount: m.revenue,
  }));

  return (
    <AdminCard
      title="Báo cáo doanh thu theo tháng"
      action={
        <div className="flex flex-wrap items-center gap-2">
          <input type="month" className="admin-input w-auto" value={fromMonth} max={toMonth} onChange={(e) => setFromMonth(e.target.value)} />
          <span className="text-slate-400 dark:text-white/40 text-xs">đến</span>
          <input type="month" className="admin-input w-auto" value={toMonth} min={fromMonth} onChange={(e) => setToMonth(e.target.value)} />
          <AdminButton variant="secondary" onClick={handleExport} disabled={exporting || loading}>
            <FileSpreadsheet size={14} className={exporting ? "animate-pulse" : ""} />
            {exporting ? "Đang xuất..." : "Xuất Excel"}
          </AdminButton>
        </div>
      }
    >
      {loading ? (
        <div className="h-64 animate-pulse bg-slate-100 dark:bg-white/10 rounded-xl" />
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatMiniPlain label="Tổng doanh thu" value={formatVND(report?.totalRevenue || 0)} />
            <StatMiniPlain label="Tổng giao dịch" value={report?.totalTransactions ?? 0} />
            <StatMiniPlain label="Giải đấu mới" value={report?.totalNewTournaments ?? 0} />
            <StatMiniPlain label="Đăng ký mới" value={report?.totalNewRegistrations ?? 0} />
          </div>

          <ChartOrEmpty
            hasData={chartPoints.some((p) => Number(p.amount) > 0)}
            options={areaTrendOptions(chartPoints, "Doanh thu", "#4f46e5", "amount", shortMoney, isDark)}
          />

          <div className="admin-table-wrap">
            <table className="admin-table w-full text-sm">
              <thead>
                <tr>
                  <th>Tháng</th>
                  <th>Doanh thu</th>
                  <th>Số giao dịch</th>
                  <th>Giải đấu mới</th>
                  <th>Đăng ký mới</th>
                </tr>
              </thead>
              <tbody>
                {(report?.months || []).map((m) => (
                  <tr key={`${m.year}-${m.month}`}>
                    <td className="text-xs font-medium">{m.monthLabel}</td>
                    <td className="text-xs font-semibold text-emerald-700">{formatVND(m.revenue || 0)}</td>
                    <td className="text-xs">{m.transactionCount}</td>
                    <td className="text-xs">{m.newTournaments}</td>
                    <td className="text-xs">{m.newRegistrations}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </AdminCard>
  );
};

const StatMini = ({ icon: Icon, label, value }) => (
  <div className="flex items-center gap-2.5 rounded-xl bg-slate-50 dark:bg-white/5 px-3 py-2.5">
    <Icon size={16} className="text-slate-400 dark:text-white/40 flex-shrink-0" />
    <div>
      <p className="text-sm font-bold text-slate-800 dark:text-white/85">{(value ?? 0).toLocaleString("vi-VN")}</p>
      <p className="text-[11px] text-slate-500 dark:text-white/60">{label}</p>
    </div>
  </div>
);

const StatMiniPlain = ({ label, value, valueClassName = "text-slate-800 dark:text-white/85" }) => (
  <div className="rounded-xl bg-slate-50 dark:bg-white/5 px-3 py-2.5">
    <p className={`text-sm font-bold ${valueClassName}`}>{value}</p>
    <p className="text-[11px] text-slate-500 dark:text-white/60">{label}</p>
  </div>
);

export default StatisticsPage;
