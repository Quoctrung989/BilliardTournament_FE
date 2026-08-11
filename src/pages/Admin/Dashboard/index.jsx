import { useCallback, useEffect, useState } from "react";
import {
  Activity,
  AlertTriangle,
  Building2,
  CheckCircle2,
  Clock,
  Cpu,
  Database,
  HardDrive,
  KeyRound,
  ListChecks,
  Lock,
  Mail,
  RefreshCw,
  Server,
  Timer,
  Trash2,
  Trophy,
  UserPlus,
  Users,
  X,
  XCircle,
} from "lucide-react";
import { toast } from "react-toastify";
import { getAdminStats, getAdminSystemHealth } from "../../../api/dashboardApi";
import AdminCard from "../../../components/admin/ui/AdminCard";
import AdminStatCard from "../../../components/admin/ui/AdminStatCard";
import ChartOrEmpty from "../../../components/admin/ui/ChartOrEmpty";
import { getApiErrorMessage } from "../../../utils/apiError";

const chartBase = {
  chart: { backgroundColor: "transparent", style: { fontFamily: "inherit" }, height: 260 },
  credits: { enabled: false },
  legend: { enabled: false },
};

const areaChartOptions = (categories, data, name, color) => ({
  ...chartBase,
  chart: { ...chartBase.chart, type: "areaspline" },
  title: { text: null },
  xAxis: { categories, lineColor: "#e2e8f0", tickColor: "#e2e8f0" },
  yAxis: { title: { text: null }, gridLineColor: "#f1f5f9", allowDecimals: false },
  plotOptions: { areaspline: { fillOpacity: 0.15, marker: { enabled: false }, lineWidth: 2 } },
  series: [
    {
      name,
      color,
      fillColor: {
        linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
        stops: [[0, `${color}59`], [1, `${color}00`]],
      },
      data,
    },
  ],
});

const columnChartOptions = (categories, data, name, color) => ({
  ...chartBase,
  chart: { ...chartBase.chart, type: "column" },
  title: { text: null },
  xAxis: { categories, lineColor: "#e2e8f0" },
  yAxis: { title: { text: null }, gridLineColor: "#f1f5f9", allowDecimals: false },
  plotOptions: { column: { borderRadius: 6, borderWidth: 0, color } },
  series: [{ name, data }],
});

const donutChartOptions = (items, colors) => ({
  ...chartBase,
  chart: { ...chartBase.chart, type: "pie" },
  title: { text: null },
  tooltip: { pointFormat: "{point.y} ({point.percentage:.0f}%)" },
  plotOptions: {
    pie: {
      innerSize: "65%",
      borderWidth: 0,
      dataLabels: { enabled: true, format: "{point.name}: {point.y}" },
    },
  },
  colors,
  series: [{ name: "Số lượng", data: items.map((i) => ({ name: i.label, y: i.count })) }],
});

const PALETTE = ["#4f46e5", "#06b6d4", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6"];
const STATUS_CLASS_COLORS = ["#10b981", "#06b6d4", "#f59e0b", "#ef4444"];

const REFRESH_OPTIONS = [
  { label: "Tắt tự làm mới", value: 0 },
  { label: "Tự làm mới 5s", value: 5000 },
  { label: "Tự làm mới 10s", value: 10000 },
  { label: "Tự làm mới 30s", value: 30000 },
  { label: "Tự làm mới 1p", value: 60000 },
  { label: "Tự làm mới 5p", value: 300000 },
  { label: "Tự làm mới 15p", value: 900000 },
];
const REFRESH_INTERVAL_STORAGE_KEY = "admin_dashboard_refresh_interval";
const DISMISSED_ALERTS_STORAGE_KEY = "admin_dashboard_dismissed_alerts";

// Backend không có cột id riêng cho alert (gộp từ 2 nguồn khác nhau) — dùng tổ hợp field làm khoá
// ổn định để lưu trạng thái "đã ẩn" phía client (localStorage), không cần thêm bảng DB.
const alertKey = (a) => `${a.type}|${a.title}|${a.occurredAt ?? ""}`;

const loadDismissedAlerts = () => {
  try {
    const raw = localStorage.getItem(DISMISSED_ALERTS_STORAGE_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
};

const saveDismissedAlerts = (set) => {
  try {
    localStorage.setItem(DISMISSED_ALERTS_STORAGE_KEY, JSON.stringify([...set].slice(-200)));
  } catch {
    // localStorage đầy/bị chặn — bỏ qua, không ảnh hưởng chức năng chính
  }
};

const formatBytes = (bytes) => {
  if (!bytes || bytes <= 0) return "0 MB";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let value = bytes;
  let i = 0;
  while (value >= 1024 && i < units.length - 1) {
    value /= 1024;
    i += 1;
  }
  return `${value.toFixed(value < 10 && i > 0 ? 1 : 0)} ${units[i]}`;
};

const formatUptime = (seconds) => {
  if (seconds == null || seconds < 0) return "—";
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}n ${h}h`;
  if (h > 0) return `${h}h ${m}p`;
  return `${m}p`;
};

const formatMs = (ms) => (ms == null ? "—" : `${Math.round(ms)} ms`);
const formatPercent = (v) => (v == null || v < 0 ? "N/A" : `${v.toFixed(0)}%`);

const UsageList = ({ items, emptyText = "Chưa có dữ liệu" }) => {
  if (!items?.length) {
    return <p className="text-sm text-slate-400 px-5 py-6">{emptyText}</p>;
  }
  const max = Math.max(...items.map((i) => i.count), 1);
  return (
    <ul className="divide-y divide-slate-100 dark:divide-white/10">
      {items.map((item) => (
        <li key={item.status} className="px-5 py-3">
          <div className="flex items-center justify-between gap-3 mb-1.5">
            <span className="text-sm text-slate-700 dark:text-slate-200 truncate">{item.label}</span>
            <span
              className={`text-sm font-semibold ${
                item.count === 0 ? "text-slate-400" : "text-slate-900 dark:text-slate-100"
              }`}
            >
              {item.count}
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden">
            <div
              className={`h-full rounded-full ${item.count === 0 ? "bg-slate-300" : "bg-indigo-500"}`}
              style={{ width: `${(item.count / max) * 100}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
};

const toneForPercent = (pct) => (pct == null || pct < 0 ? null : pct >= 85 ? "danger" : pct >= 65 ? "warning" : null);

const MetricBar = ({ label, valueLabel, percent }) => {
  const tone = toneForPercent(percent);
  const pct = Math.max(0, Math.min(100, percent ?? 0));
  const toneClass = tone === "danger" ? "bg-red-500" : tone === "warning" ? "bg-amber-500" : "bg-indigo-500";
  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-1.5">
        <span className="text-sm text-slate-700 dark:text-slate-200">{label}</span>
        <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{valueLabel}</span>
      </div>
      <div className="h-1.5 rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden">
        <div className={`h-full rounded-full ${toneClass}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
};

const AlertFeed = ({ alerts, onDismiss }) => {
  if (!alerts?.length) {
    return (
      <div className="px-5 py-6 flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
        <AlertTriangle size={16} />
        Không có cảnh báo nào gần đây — hệ thống hoạt động bình thường.
      </div>
    );
  }
  return (
    <ul className="divide-y divide-slate-100 dark:divide-white/10">
      {alerts.map((a) => (
        <li key={a.key} className="px-5 py-3 flex items-start gap-3">
          <span
            className={`mt-0.5 flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center ${
              a.type === "EMAIL_FAILED"
                ? "bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400"
                : "bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400"
            }`}
          >
            <AlertTriangle size={14} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm text-slate-800 dark:text-slate-100 truncate">{a.title}</p>
            {a.detail && <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{a.detail}</p>}
            <p className="text-[11px] text-slate-400 mt-0.5">
              {a.occurredAt ? new Date(a.occurredAt).toLocaleString("vi-VN") : ""}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onDismiss(a.key)}
            title="Ẩn cảnh báo này"
            className="flex-shrink-0 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:text-slate-200 dark:hover:bg-white/10"
          >
            <X size={14} />
          </button>
        </li>
      ))}
    </ul>
  );
};

const SchedulerJobList = ({ jobs }) => {
  if (!jobs?.length) {
    return <p className="text-sm text-slate-400 px-5 py-6">Chưa có job nào chạy kể từ khi khởi động server.</p>;
  }
  return (
    <ul className="divide-y divide-slate-100 dark:divide-white/10">
      {jobs.map((j) => (
        <li key={j.name} className="px-5 py-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm text-slate-800 dark:text-slate-100 truncate">{j.name}</p>
            <p className="text-xs text-slate-400 mt-0.5">
              {j.lastRunAt ? new Date(j.lastRunAt).toLocaleString("vi-VN") : "Chưa chạy lần nào"} · {j.lastDurationMs} ms
            </p>
            {!j.success && j.lastError && (
              <p className="text-xs text-red-500 mt-0.5 line-clamp-1">{j.lastError}</p>
            )}
          </div>
          <span
            className={`flex-shrink-0 inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${
              j.success
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400"
                : "bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400"
            }`}
          >
            {j.success ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
            {j.success ? "OK" : "Lỗi"}
          </span>
        </li>
      ))}
    </ul>
  );
};

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [refreshInterval, setRefreshInterval] = useState(() => {
    const saved = Number(localStorage.getItem(REFRESH_INTERVAL_STORAGE_KEY));
    return REFRESH_OPTIONS.some((o) => o.value === saved) ? saved : 0;
  });
  const [dismissedAlerts, setDismissedAlerts] = useState(() => loadDismissedAlerts());

  const fetchAll = useCallback(async () => {
    setRefreshing(true);
    const [statsResult, healthResult] = await Promise.allSettled([getAdminStats(), getAdminSystemHealth()]);
    if (statsResult.status === "fulfilled") {
      setStats(statsResult.value);
    } else {
      toast.error(getApiErrorMessage(statsResult.reason));
    }
    if (healthResult.status === "fulfilled") {
      setHealth(healthResult.value);
    } else {
      toast.error(getApiErrorMessage(healthResult.reason));
    }
    setLastUpdated(new Date());
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  useEffect(() => {
    localStorage.setItem(REFRESH_INTERVAL_STORAGE_KEY, String(refreshInterval));
    if (!refreshInterval) return undefined;
    const id = setInterval(fetchAll, refreshInterval);
    return () => clearInterval(id);
  }, [refreshInterval, fetchAll]);

  const visibleAlerts = (stats?.recentAlerts || [])
    .map((a) => ({ ...a, key: alertKey(a) }))
    .filter((a) => !dismissedAlerts.has(a.key));

  const dismissAlert = (key) => {
    setDismissedAlerts((prev) => {
      const next = new Set(prev);
      next.add(key);
      saveDismissedAlerts(next);
      return next;
    });
  };

  const dismissAllAlerts = () => {
    setDismissedAlerts((prev) => {
      const next = new Set(prev);
      visibleAlerts.forEach((a) => next.add(a.key));
      saveDismissedAlerts(next);
      return next;
    });
  };

  const toolbar = (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">Admin Dashboard</h1>
        <p className="text-xs text-slate-400">
          {lastUpdated ? `Cập nhật lúc ${lastUpdated.toLocaleTimeString("vi-VN")}` : "Đang tải..."}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <select
          value={refreshInterval}
          onChange={(e) => setRefreshInterval(Number(e.target.value))}
          className="text-sm rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800 px-3 py-2 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400"
        >
          {REFRESH_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => fetchAll()}
          disabled={refreshing}
          className="inline-flex items-center gap-2 text-sm font-medium rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800 px-3 py-2 text-slate-700 dark:text-slate-200 hover:border-indigo-400 disabled:opacity-60"
        >
          <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
          Làm mới
        </button>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="space-y-6">
        {toolbar}
        <div className="text-sm text-slate-400 py-12 text-center">Đang tải dữ liệu...</div>
      </div>
    );
  }
  if (!stats && !health) {
    return (
      <div className="space-y-6">
        {toolbar}
        <div className="text-sm text-slate-400 py-12 text-center">Không tải được dữ liệu dashboard.</div>
      </div>
    );
  }

  const accountsTrendChart = stats
    ? areaChartOptions(
        stats.newAccountsTrend?.map((p) => p.period) || [],
        stats.newAccountsTrend?.map((p) => p.count) || [],
        "Tài khoản mới",
        "#4f46e5"
      )
    : null;
  const tournamentsTrendChart = stats
    ? columnChartOptions(
        stats.newTournamentsTrend?.map((p) => p.period) || [],
        stats.newTournamentsTrend?.map((p) => p.count) || [],
        "Giải mới",
        "#06b6d4"
      )
    : null;
  const tournamentsByStatusChart = stats ? donutChartOptions(stats.tournamentsByStatus || [], PALETTE) : null;
  const emailsByStatusChart = stats
    ? donutChartOptions(stats.emailsByStatus30d || [], ["#10b981", "#f59e0b", "#ef4444", "#94a3b8"])
    : null;
  const httpStatusClassChart = health
    ? donutChartOptions(health.httpRequestsByStatusClass || [], STATUS_CLASS_COLORS)
    : null;

  return (
    <div className="space-y-6">
      {toolbar}

      {stats && (
        <AdminCard
          title="Cảnh báo & hoạt động gần đây"
          padding={false}
          action={
            visibleAlerts.length > 0 && (
              <button
                type="button"
                onClick={dismissAllAlerts}
                className="inline-flex items-center gap-1 text-xs font-medium text-slate-400 hover:text-red-500"
              >
                <Trash2 size={12} />
                Xóa tất cả
              </button>
            )
          }
        >
          <AlertFeed alerts={visibleAlerts} onDismiss={dismissAlert} />
        </AdminCard>
      )}

      {health && (
        <>
          <div
            className={`rounded-2xl px-5 py-3 flex items-center gap-3 text-sm font-medium ${
              health.appStatus === "UP"
                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
                : "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400"
            }`}
          >
            {health.appStatus === "UP" ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
            Hệ thống {health.appStatus === "UP" ? "đang hoạt động bình thường" : "đang gặp sự cố"} — DB{" "}
            {health.dbConnected ? "kết nối OK" : "mất kết nối"} · Java {health.javaVersion} · Profile{" "}
            {health.activeProfile}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-4">
            <AdminStatCard label="Uptime" value={formatUptime(health.uptimeSeconds)} hint="Kể từ lúc khởi động" icon={Clock} accent="indigo" />
            <AdminStatCard
              label="Heap dùng"
              value={formatPercent(health.heapUsedPercent)}
              hint={`${formatBytes(health.heapUsedBytes)} / ${formatBytes(health.heapMaxBytes)}`}
              icon={Activity}
              accent={health.heapUsedPercent >= 85 ? "amber" : "cyan"}
            />
            <AdminStatCard label="CPU" value={formatPercent(health.cpuUsagePercent)} hint="Toàn tiến trình" icon={Cpu} accent="cyan" />
            <AdminStatCard label="Threads" value={health.threadCount >= 0 ? health.threadCount : "N/A"} hint="Đang sống" icon={Server} accent="indigo" />
            <AdminStatCard
              label="DB Pool"
              value={health.dbPoolActive >= 0 ? `${health.dbPoolActive}/${health.dbPoolMax}` : "N/A"}
              hint={`${health.dbPoolIdle >= 0 ? health.dbPoolIdle : "?"} rảnh`}
              icon={Database}
              accent="emerald"
            />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <AdminCard title="Bộ nhớ & CPU" padding>
              <div className="space-y-4">
                <MetricBar label="Heap" valueLabel={formatPercent(health.heapUsedPercent)} percent={health.heapUsedPercent} />
                <MetricBar label="CPU" valueLabel={formatPercent(health.cpuUsagePercent)} percent={health.cpuUsagePercent} />
                <MetricBar
                  label="DB Pool"
                  valueLabel={health.dbPoolMax > 0 ? `${health.dbPoolActive}/${health.dbPoolMax}` : "N/A"}
                  percent={health.dbPoolMax > 0 ? (health.dbPoolActive / health.dbPoolMax) * 100 : 0}
                />
              </div>
              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-white/10 flex items-center gap-2 text-xs text-slate-500">
                <HardDrive size={14} />
                Dung lượng DB: {formatBytes(health.dbSizeBytes)} · {health.dbTableCount} bảng
              </div>
            </AdminCard>

            <AdminCard title="Traffic & lỗi HTTP (từ lúc khởi động)" padding={false} className="xl:col-span-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center px-2 pb-2">
                <ChartOrEmpty hasData={health.httpTotalRequests > 0} options={httpStatusClassChart} />
                <div className="grid grid-cols-2 gap-3 px-3">
                  <div className="admin-card p-3">
                    <p className="text-xs text-slate-500">Tổng request</p>
                    <p className="text-xl font-bold text-slate-900 dark:text-slate-100">{health.httpTotalRequests}</p>
                  </div>
                  <div className="admin-card p-3">
                    <p className="text-xs text-slate-500">Tỷ lệ lỗi</p>
                    <p className="text-xl font-bold text-slate-900 dark:text-slate-100">{formatPercent(health.httpErrorRatePercent)}</p>
                  </div>
                  <div className="admin-card p-3">
                    <p className="text-xs text-slate-500">Latency TB</p>
                    <p className="text-xl font-bold text-slate-900 dark:text-slate-100">{formatMs(health.httpAvgLatencyMs)}</p>
                  </div>
                  <div className="admin-card p-3">
                    <p className="text-xs text-slate-500">Latency max</p>
                    <p className="text-xl font-bold text-slate-900 dark:text-slate-100">{formatMs(health.httpMaxLatencyMs)}</p>
                  </div>
                </div>
              </div>
              {health.topErrorEndpoints?.length > 0 && (
                <div className="border-t border-slate-100 dark:border-white/10">
                  <p className="text-xs font-semibold text-slate-500 px-5 pt-3">Endpoint lỗi nhiều nhất</p>
                  <UsageList items={health.topErrorEndpoints} />
                </div>
              )}
            </AdminCard>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {stats && (
              <AdminCard title="Tài khoản theo vai trò" padding={false}>
                <UsageList items={stats.accountsByRole} />
              </AdminCard>
            )}
            <AdminCard title="Đăng nhập thất bại (từ lúc khởi động)" padding={false}>
              <UsageList items={health.authFailuresByReason} emptyText="Không có lượt đăng nhập thất bại nào." />
            </AdminCard>
            <AdminCard title="Background jobs" padding={false}>
              <SchedulerJobList jobs={health.schedulerJobs} />
            </AdminCard>
          </div>
        </>
      )}

      {stats && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
            <AdminStatCard label="Tổng tài khoản" value={stats.totalAccounts?.toLocaleString("vi-VN")} hint="Toàn hệ thống" icon={Users} accent="indigo" />
            <AdminStatCard label="Tài khoản mới" value={stats.newAccounts30d?.toLocaleString("vi-VN")} hint="Trong 30 ngày qua" icon={UserPlus} accent="cyan" />
            <AdminStatCard label="Tài khoản bị khóa" value={stats.lockedAccounts?.toLocaleString("vi-VN")} hint="Cần rà soát" icon={Lock} accent="amber" />
            <AdminStatCard label="Rule email đang bật" value={stats.enabledAutomationRules ?? 0} hint={`${stats.disabledAutomationRules ?? 0} đang tắt`} icon={KeyRound} accent="emerald" />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <AdminCard title="Tài khoản mới theo ngày (7 ngày)" padding={false}>
              <div className="px-2 pb-2">
                <ChartOrEmpty hasData={stats.newAccounts30d > 0} options={accountsTrendChart} />
              </div>
            </AdminCard>
            <AdminCard title="Email hệ thống (30 ngày)" padding={false}>
              <div className="px-2 pb-2 grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                <ChartOrEmpty hasData={stats.totalEmails30d > 0} options={emailsByStatusChart} />
                <div className="grid grid-cols-2 gap-3 px-3">
                  <div className="admin-card p-3">
                    <p className="text-xs text-slate-500">Đã gửi (30 ngày)</p>
                    <p className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <Mail size={16} className="text-indigo-500" />
                      {stats.totalEmails30d ?? 0}
                    </p>
                  </div>
                  <div className="admin-card p-3">
                    <p className="text-xs text-slate-500">Tỷ lệ gửi thành công</p>
                    <p className="text-xl font-bold text-slate-900 dark:text-slate-100">{(stats.emailSuccessRate30d ?? 0).toFixed(0)}%</p>
                  </div>
                  <div className="admin-card p-3 col-span-2">
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <Timer size={12} /> Độ trễ hàng đợi trung bình
                    </p>
                    <p className="text-xl font-bold text-slate-900 dark:text-slate-100">
                      {health ? formatMs(health.mailQueueAvgLatencyMs) : "—"}
                    </p>
                  </div>
                </div>
              </div>
            </AdminCard>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-2">
              <ListChecks size={16} />
              Tổng quan nghiệp vụ toàn hệ thống
            </h2>
            <p className="text-xs text-slate-400 mb-3">Xem chi tiết theo từng quán ở Owner Dashboard.</p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
              <AdminStatCard label="Chi nhánh / CLB" value={stats.totalBranches?.toLocaleString("vi-VN")} hint={`${stats.activeBranches ?? 0} đang hoạt động`} icon={Building2} accent="emerald" />
              <AdminStatCard label="Giải đang diễn ra" value={stats.ongoingTournaments?.toLocaleString("vi-VN")} hint="Toàn hệ thống" icon={Trophy} accent="amber" />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-4">
              <AdminCard title="Giải đấu mới theo tháng" padding={false}>
                <div className="px-2 pb-2">
                  <ChartOrEmpty hasData={(stats.newTournamentsTrend || []).some((p) => p.count > 0)} options={tournamentsTrendChart} />
                </div>
              </AdminCard>
              <AdminCard title="Giải đấu theo trạng thái" padding={false}>
                <div className="px-2 pb-2">
                  <ChartOrEmpty hasData={(stats.tournamentsByStatus || []).length > 0} options={tournamentsByStatusChart} />
                </div>
              </AdminCard>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
              <AdminCard title="Thể thức giải — mức sử dụng" padding={false}>
                <UsageList items={stats.formatUsage} />
              </AdminCard>
              <AdminCard title="Loại bi — mức sử dụng" padding={false}>
                <UsageList items={stats.gameTypeUsage} />
              </AdminCard>
              <AdminCard title="Form đăng ký — mức sử dụng" padding={false}>
                <UsageList items={stats.registrationTemplateUsage} />
              </AdminCard>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
