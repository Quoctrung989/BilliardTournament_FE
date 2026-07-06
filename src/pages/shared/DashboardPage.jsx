import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  Trophy, Users, DollarSign, FileText, Clock, CheckCircle,
  PlayCircle, TrendingUp,
} from "lucide-react";
import AdminCard from "../../components/admin/ui/AdminCard";
import AdminStatCard from "../../components/admin/ui/AdminStatCard";
import { getApiErrorMessage } from "../../utils/apiError";
import { formatVND } from "../../utils/helpers";

/* Status → color kept consistent with the badge colors used elsewhere in the app
   (tournamentConfig.js), so a given status always reads the same color everywhere. */
const STATUS_COLORS = {
  DRAFT: "#64748b",
  OPEN_FOR_REGISTRATION: "#10b981",
  REGISTRATION_CLOSED: "#f59e0b",
  DRAW_PREVIEW: "#eab308",
  DRAW_DONE: "#3b82f6",
  FINAL_BRACKET_READY: "#06b6d4",
  IN_PROGRESS: "#8b5cf6",
  COMPLETED: "#14b8a6",
  CANCELLED: "#f43f5e",
  PENDING_PAYMENT: "#f59e0b",
  PAID: "#3b82f6",
  APPROVED: "#10b981",
  REJECTED: "#f43f5e",
  PENDING: "#f59e0b",
  SUCCESS: "#10b981",
  FAILED: "#f43f5e",
  ACTIVE: "#10b981",
  INACTIVE: "#64748b",
  WITHDRAWN: "#f43f5e",
  BYE: "#06b6d4",
  WALKOVER: "#f59e0b",
};
const FALLBACK_PALETTE = ["#4f46e5", "#06b6d4", "#10b981", "#f59e0b", "#8b5cf6", "#f43f5e", "#14b8a6", "#64748b"];
const colorFor = (status, idx) => STATUS_COLORS[status] || FALLBACK_PALETTE[idx % FALLBACK_PALETTE.length];

const hasCounts = (items) => Array.isArray(items) && items.some((i) => (i.count ?? 0) > 0);

const shortMoney = (v) => {
  const n = Number(v) || 0;
  const abs = Math.abs(n);
  if (abs >= 1e9) return `${(n / 1e9).toFixed(1)}tỷ`;
  if (abs >= 1e6) return `${(n / 1e6).toFixed(1)}tr`;
  if (abs >= 1e3) return `${(n / 1e3).toFixed(0)}k`;
  return `${n}`;
};

const chartBase = {
  chart: { backgroundColor: "transparent", style: { fontFamily: "inherit" }, height: 280 },
  credits: { enabled: false },
};

const donutOptions = (items, seriesName) => ({
  ...chartBase,
  chart: { ...chartBase.chart, type: "pie" },
  title: { text: null },
  tooltip: { pointFormat: "<b>{point.y}</b> ({point.percentage:.0f}%)" },
  legend: { enabled: true, itemStyle: { fontSize: "11px", fontWeight: 500 } },
  plotOptions: {
    pie: { innerSize: "62%", borderWidth: 2, borderColor: "#fff", dataLabels: { enabled: false } },
  },
  series: [{
    name: seriesName,
    data: items.map((i, idx) => ({ name: i.label, y: i.count, color: colorFor(i.status, idx) })),
  }],
});

const areaTrendOptions = (points, seriesName, color, valueKey, formatter) => ({
  ...chartBase,
  chart: { ...chartBase.chart, type: "areaspline" },
  title: { text: null },
  xAxis: { categories: points.map((p) => p.period), lineColor: "#e2e8f0", tickColor: "#e2e8f0" },
  yAxis: {
    title: { text: null },
    gridLineColor: "#f1f5f9",
    allowDecimals: valueKey !== "amount",
    labels: formatter ? { formatter() { return formatter(this.value); } } : undefined,
  },
  tooltip: formatter
    ? { formatter() { return `${this.x}: <b>${formatter(this.y)}</b>`; } }
    : { pointFormat: "<b>{point.y}</b>" },
  plotOptions: { areaspline: { fillOpacity: 0.15, marker: { enabled: false }, lineWidth: 2 } },
  series: [{
    name: seriesName,
    color,
    fillColor: {
      linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
      stops: [[0, `${color}59`], [1, `${color}00`]],
    },
    data: points.map((p) => Number(p[valueKey] ?? 0)),
  }],
});

const columnTrendOptions = (points, seriesName, color) => ({
  ...chartBase,
  chart: { ...chartBase.chart, type: "column" },
  title: { text: null },
  xAxis: { categories: points.map((p) => p.period), lineColor: "#e2e8f0" },
  yAxis: { title: { text: null }, gridLineColor: "#f1f5f9", allowDecimals: false },
  tooltip: { pointFormat: "<b>{point.y}</b>" },
  plotOptions: { column: { borderRadius: 6, borderWidth: 0, color } },
  series: [{ name: seriesName, data: points.map((p) => p.count) }],
});

const barByStatusOptions = (items, seriesName) => ({
  ...chartBase,
  chart: { ...chartBase.chart, type: "bar", height: Math.max(180, items.length * 44) },
  title: { text: null },
  xAxis: { categories: items.map((i) => i.label), lineColor: "#e2e8f0" },
  yAxis: { title: { text: null }, gridLineColor: "#f1f5f9", allowDecimals: false },
  tooltip: { pointFormat: "<b>{point.y}</b>" },
  plotOptions: { bar: { borderRadius: 4, borderWidth: 0, dataLabels: { enabled: true } } },
  series: [{
    name: seriesName,
    data: items.map((i, idx) => ({ y: i.count, color: colorFor(i.status, idx) })),
  }],
});

const ChartOrEmpty = ({ hasData, options }) =>
  hasData ? (
    <HighchartsReact highcharts={Highcharts} options={options} />
  ) : (
    <div className="h-[220px] flex items-center justify-center text-sm text-slate-400">
      Chưa có dữ liệu
    </div>
  );

const DashboardPage = ({ statsLoader, basePath, title }) => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    statsLoader()
      .then(setStats)
      .catch((err) => toast.error(getApiErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [statsLoader]);

  const cards = stats
    ? [
        {
          icon: Trophy, accent: "indigo", label: "Tổng giải đấu",
          value: stats.tournaments.total,
          hint: `${stats.tournaments.active} đang hoạt động`,
        },
        {
          icon: FileText, accent: "cyan", label: "Đang mở đăng ký",
          value: stats.tournaments.openForRegistration,
          hint: "Giải đấu",
        },
        {
          icon: PlayCircle, accent: "amber", label: "Đang thi đấu",
          value: stats.tournaments.inProgress,
          hint: "Giải đấu",
        },
        {
          icon: CheckCircle, accent: "emerald", label: "Đã hoàn thành",
          value: stats.tournaments.completed,
          hint: "Giải đấu",
        },
        {
          icon: DollarSign, accent: "emerald", label: "Tổng doanh thu",
          value: formatVND(stats.revenue.totalRevenue || 0),
          hint: `TB ${formatVND(stats.revenue.avgTicketValue || 0)} / giao dịch`,
        },
        {
          icon: Users, accent: "indigo", label: "Người tham gia",
          value: stats.participants.total,
          hint: `${stats.participants.active} đang thi đấu`,
        },
        {
          icon: Clock, accent: "amber", label: "Đăng ký chờ xử lý",
          value: stats.registrations.pending,
          hint: `${stats.registrations.total} tổng đăng ký`,
        },
        {
          icon: TrendingUp, accent: "cyan", label: "Tỷ lệ trận đã đấu",
          value: `${Math.round(stats.matches.completionRate)}%`,
          hint: `${stats.matches.completed}/${stats.matches.total} trận`,
        },
      ]
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">{title}</h1>
        <p className="text-sm text-slate-500">Tổng quan hệ thống giải đấu</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="admin-card h-32 animate-pulse bg-slate-100" />
          ))}
        </div>
      ) : !stats ? (
        <p className="text-sm text-slate-400">Không tải được dữ liệu thống kê.</p>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {cards.map((c) => (
              <AdminStatCard key={c.label} {...c} />
            ))}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <AdminCard title="Doanh thu theo tháng" padding={false}>
              <div className="px-2 pb-2">
                <ChartOrEmpty
                  hasData={stats.revenue.monthlyTrend.some((p) => Number(p.amount) > 0)}
                  options={areaTrendOptions(
                    stats.revenue.monthlyTrend,
                    "Doanh thu",
                    "#4f46e5",
                    "amount",
                    shortMoney
                  )}
                />
              </div>
            </AdminCard>
            <AdminCard title="Giải đấu mới theo tháng" padding={false}>
              <div className="px-2 pb-2">
                <ChartOrEmpty
                  hasData={stats.tournaments.monthlyTrend.some((p) => p.count > 0)}
                  options={columnTrendOptions(stats.tournaments.monthlyTrend, "Giải mới", "#06b6d4")}
                />
              </div>
            </AdminCard>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <AdminCard title="Giải đấu theo trạng thái" padding={false}>
              <div className="px-2 pb-2">
                <ChartOrEmpty
                  hasData={hasCounts(stats.tournaments.byStatus)}
                  options={donutOptions(stats.tournaments.byStatus, "Giải đấu")}
                />
              </div>
            </AdminCard>
            <AdminCard title="Đăng ký theo trạng thái" padding={false}>
              <div className="px-2 pb-2">
                <ChartOrEmpty
                  hasData={hasCounts(stats.registrations.byStatus)}
                  options={donutOptions(stats.registrations.byStatus, "Đăng ký")}
                />
              </div>
            </AdminCard>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <AdminCard title="Trận đấu theo trạng thái" padding={false}>
              <div className="px-2 pb-2">
                <ChartOrEmpty
                  hasData={hasCounts(stats.matches.byStatus)}
                  options={barByStatusOptions(stats.matches.byStatus, "Trận đấu")}
                />
              </div>
            </AdminCard>
            <AdminCard title="Loại bi phổ biến" padding={false}>
              <div className="px-2 pb-2">
                <ChartOrEmpty
                  hasData={hasCounts(stats.tournaments.byGameType)}
                  options={barByStatusOptions(stats.tournaments.byGameType, "Giải đấu")}
                />
              </div>
            </AdminCard>
          </div>
        </>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => navigate(`${basePath}/tournaments`)}
          className="flex items-center gap-3 bg-white rounded-2xl p-5 shadow-sm border border-slate-100 text-left hover:border-[#010851] transition-colors group"
        >
          <Trophy size={20} className="text-[#010851] shrink-0" />
          <div>
            <p className="font-semibold text-[#010851] group-hover:text-[#EF342A] transition-colors">Quản lý giải đấu</p>
            <p className="text-xs text-slate-400">Tạo, cấu hình, mở đăng ký</p>
          </div>
        </button>
        <button
          type="button"
          onClick={() => navigate(`${basePath}/employees`)}
          className="flex items-center gap-3 bg-white rounded-2xl p-5 shadow-sm border border-slate-100 text-left hover:border-[#010851] transition-colors group"
        >
          <Users size={20} className="text-[#010851] shrink-0" />
          <div>
            <p className="font-semibold text-[#010851] group-hover:text-[#EF342A] transition-colors">Quản lý nhân viên</p>
            <p className="text-xs text-slate-400">Manager, Staff</p>
          </div>
        </button>
        <button
          type="button"
          onClick={() => navigate(`${basePath}/news`)}
          className="flex items-center gap-3 bg-white rounded-2xl p-5 shadow-sm border border-slate-100 text-left hover:border-[#010851] transition-colors group"
        >
          <FileText size={20} className="text-[#010851] shrink-0" />
          <div>
            <p className="font-semibold text-[#010851] group-hover:text-[#EF342A] transition-colors">Tin tức & Bài viết</p>
            <p className="text-xs text-slate-400">CMS — tạo, xuất bản tin</p>
          </div>
        </button>
      </div>
    </div>
  );
};

export default DashboardPage;
