import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";
import {
  DollarSign, Trophy, Users, TrendingUp, Download, Crown, Repeat,
  ThumbsUp, MessageCircle, Share2, Eye, Search, FileSpreadsheet,
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

const StatisticsPage = ({ analyticsApi, title }) => {
  const isDark = useThemeStore((s) => s.theme === "dark");
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
  const [players, setPlayers] = useState([]);
  const [social, setSocial] = useState(null);
  const [funnel, setFunnel] = useState(null);
  const [gameTypes, setGameTypes] = useState([]);
  const [playerGrowth, setPlayerGrowth] = useState(null);

  const [detailId, setDetailId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailExporting, setDetailExporting] = useState(false);
  const [tournamentSearch, setTournamentSearch] = useState("");

  const baseRange = useMemo(() => resolveRange(preset, customFrom, customTo), [preset, customFrom, customTo]);
  const granularity = granularityOverride || baseRange.granularity;
  const range = { ...baseRange, granularity };

  const handlePresetChange = (value) => {
    setPreset(value);
    setGranularityOverride(null);
  };

  const load = useCallback(async () => {
    if (hasLoadedRef.current) setRefreshing(true); else setLoading(true);
    try {
      const { from, to, granularity: g } = range;
      const [ov, rev, tour, ply, soc, fun, gt, growth] = await Promise.all([
        analyticsApi.getOverview(from, to),
        analyticsApi.getRevenue(from, to, g),
        analyticsApi.getTournaments(from, to),
        analyticsApi.getPlayers(from, to),
        analyticsApi.getSocial(from, to),
        analyticsApi.getFunnel(from, to, g),
        analyticsApi.getGameTypes(from, to),
        analyticsApi.getPlayerGrowth(from, to, g),
      ]);
      setOverview(ov);
      setRevenue(rev);
      setTournaments(Array.isArray(tour) ? tour : []);
      setPlayers(Array.isArray(ply) ? ply : []);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [analyticsApi, range.from, range.to, range.granularity]);

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
      value: `${Math.round(playerGrowth?.repeatPlayerRatePct || 0)}%`,
      hint: playerGrowth ? `${playerGrowth.returningPlayerCount}/${playerGrowth.activePlayerCount} người chơi` : undefined,
    },
    {
      icon: Crown, accent: "indigo", label: "Giải đấu quán quân",
      value: overview.topTournamentName || "—",
      hint: overview.topTournamentRevenue ? formatVND(overview.topTournamentRevenue) : undefined,
    },
  ] : [];

  const gameTypeBarItems = gameTypes.map((g) => ({ label: g.label, amount: g.totalRevenue }));
  const approvalDenominator = (funnel?.approved || 0) + (funnel?.rejected || 0);
  const approvalRatePct = approvalDenominator > 0 ? Math.round((funnel.approved / approvalDenominator) * 100) : null;

  const filteredTournaments = tournamentSearch.trim()
    ? tournaments.filter((t) => t.name.toLowerCase().includes(tournamentSearch.trim().toLowerCase()))
    : tournaments;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            {title}
            {refreshing && <span className="text-xs font-normal text-indigo-500 animate-pulse">Đang cập nhật...</span>}
          </h1>
          <p className="text-sm text-slate-500">Phân tích chi tiết doanh thu, giải đấu, cơ thủ và truyền thông</p>
        </div>
        <AdminButton variant="secondary" onClick={handleExport} disabled={exporting || loading}>
          <Download size={14} className={exporting ? "animate-pulse" : ""} />
          {exporting ? "Đang xuất..." : "Xuất báo cáo Excel"}
        </AdminButton>
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
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {p.label}
          </button>
        ))}
        {preset === "custom" && (
          <div className="flex items-center gap-2 ml-1">
            <input type="date" className="admin-input w-auto" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} />
            <span className="text-slate-400 text-xs">đến</span>
            <input type="date" className="admin-input w-auto" value={customTo} onChange={(e) => setCustomTo(e.target.value)} />
          </div>
        )}
        <select
          className="admin-select w-auto ml-auto"
          value={granularity}
          onChange={(e) => setGranularityOverride(e.target.value)}
        >
          {GRANULARITY_OPTIONS.map((g) => (
            <option key={g.value} value={g.value}>{g.label}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="admin-card h-32 animate-pulse bg-slate-100" />
          ))}
        </div>
      ) : (
        <div className={`space-y-6 transition-opacity ${refreshing ? "opacity-60 pointer-events-none" : ""}`}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {kpis.map((c) => <AdminStatCard key={c.label} {...c} />)}
          </div>

          <AdminCard
            title="Hiệu suất giải đấu — bấm vào 1 dòng để xem chi tiết"
            action={
              <div className="relative">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
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
              <p className="text-sm text-slate-400 text-center py-6">Chưa có giải đấu nào trong kỳ này.</p>
            ) : filteredTournaments.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-6">Không tìm thấy giải đấu nào khớp "{tournamentSearch}".</p>
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
                      <tr key={t.id} className="cursor-pointer hover:bg-slate-50" onClick={() => openTournamentDetail(t.id)}>
                        <td className="font-medium text-indigo-700">{t.name}</td>
                        <td className="text-xs text-slate-500">{t.branchName}</td>
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

          <AdminCard title="Cơ thủ nổi bật">
            {players.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-6">Chưa có kết quả giải đấu nào được ghi nhận trong kỳ này.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                {players.map((p, idx) => (
                  <div key={p.userId} className="rounded-xl border border-slate-100 p-4 flex items-center gap-3">
                    <span className="text-2xl w-8 text-center flex-shrink-0">{RANK_MEDAL[idx] || `#${idx + 1}`}</span>
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-800 truncate">{p.playerName}</p>
                      <p className="text-xs text-slate-500">
                        {p.tournamentsPlayed} giải · {p.championCount} vô địch · {p.top3Count} top 3
                      </p>
                      <p className="text-xs font-semibold text-emerald-700 mt-0.5">{formatVND(p.totalPrizeAmount || 0)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </AdminCard>

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
                  <p className="text-xs text-slate-500">
                    Bài đăng nổi bật nhất thuộc giải <b>{social.topPostTournamentName}</b> — {social.topPostReach.toLocaleString("vi-VN")} lượt tiếp cận.
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-slate-400 text-center py-6">Chưa có bài đăng Facebook nào trong kỳ này.</p>
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
          <div className="py-10 text-center text-sm text-slate-400">Đang tải chi tiết...</div>
        ) : (
          <TournamentDetailContent detail={detail} analyticsApi={analyticsApi} isDark={isDark} />
        )}
      </AdminModal>
    </div>
  );
};

const TournamentDetailContent = ({ detail, analyticsApi, isDark }) => (
  <div className="space-y-5">
    <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-slate-500">
      <span><b className="text-slate-700">{detail.branchName}</b></span>
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
        <p className="text-xs font-semibold text-slate-600 mb-1">Phễu đăng ký</p>
        <ChartOrEmpty
          hasData={hasCounts(detail.registrationStats?.byStatus)}
          options={donutOptions(detail.registrationStats?.byStatus || [], "Đăng ký", isDark)}
        />
      </div>
      <div>
        <p className="text-xs font-semibold text-slate-600 mb-1">Trận đấu theo trạng thái</p>
        <ChartOrEmpty
          hasData={hasCounts(detail.matchStats?.byStatus)}
          options={barByStatusOptions(detail.matchStats?.byStatus || [], "Trận đấu", isDark)}
        />
      </div>
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div>
        <p className="text-xs font-semibold text-slate-600 mb-1">Giao dịch theo trạng thái</p>
        <ChartOrEmpty
          hasData={hasCounts(detail.transactionStats?.byStatus)}
          options={donutOptions(detail.transactionStats?.byStatus || [], "Giao dịch", isDark)}
        />
      </div>
      <div>
        <p className="text-xs font-semibold text-slate-600 mb-1">Doanh thu theo tháng</p>
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
        <p className="text-xs font-semibold text-slate-600 mb-1">Truyền thông Facebook</p>
        <div className="grid grid-cols-4 gap-2">
          <StatMiniPlain label="Bài đăng" value={detail.social.totalPosts} />
          <StatMiniPlain label="Lượt thích" value={detail.social.totalLikes} />
          <StatMiniPlain label="Bình luận" value={detail.social.totalComments} />
          <StatMiniPlain label="Tiếp cận" value={detail.social.totalReach} />
        </div>
      </div>
    )}

    <div>
      <p className="text-xs font-semibold text-slate-600 mb-2">Danh sách giao dịch của giải này</p>
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
          <span className="text-slate-400 text-xs">đến</span>
          <input type="month" className="admin-input w-auto" value={toMonth} min={fromMonth} onChange={(e) => setToMonth(e.target.value)} />
          <AdminButton variant="secondary" onClick={handleExport} disabled={exporting || loading}>
            <FileSpreadsheet size={14} className={exporting ? "animate-pulse" : ""} />
            {exporting ? "Đang xuất..." : "Xuất Excel"}
          </AdminButton>
        </div>
      }
    >
      {loading ? (
        <div className="h-64 animate-pulse bg-slate-100 rounded-xl" />
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
  <div className="flex items-center gap-2.5 rounded-xl bg-slate-50 px-3 py-2.5">
    <Icon size={16} className="text-slate-400 flex-shrink-0" />
    <div>
      <p className="text-sm font-bold text-slate-800">{(value ?? 0).toLocaleString("vi-VN")}</p>
      <p className="text-[11px] text-slate-500">{label}</p>
    </div>
  </div>
);

const StatMiniPlain = ({ label, value, valueClassName = "text-slate-800" }) => (
  <div className="rounded-xl bg-slate-50 px-3 py-2.5">
    <p className={`text-sm font-bold ${valueClassName}`}>{value}</p>
    <p className="text-[11px] text-slate-500">{label}</p>
  </div>
);

export default StatisticsPage;
