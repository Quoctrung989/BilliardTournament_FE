import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { CreditCard, CheckCircle2, DollarSign, Clock } from "lucide-react";
import AdminCard from "../../components/admin/ui/AdminCard";
import AdminStatCard from "../../components/admin/ui/AdminStatCard";
import ChartOrEmpty from "../../components/admin/ui/ChartOrEmpty";
import TransactionTable from "../../components/admin/ui/TransactionTable";
import { getApiErrorMessage } from "../../utils/apiError";
import { formatVND } from "../../utils/helpers";
import { useThemeStore } from "../../store/themeStore";
import { RANGE_PRESETS, resolveRange } from "../../utils/dateRangePresets";
import { hasCounts, donutOptions, barByStatusOptions } from "../../utils/chartHelpers";

const TransactionsPage = ({ analyticsApi, title }) => {
  const isDark = useThemeStore((s) => s.theme === "dark");
  const [preset, setPreset] = useState("30d");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [tournamentId, setTournamentId] = useState("");
  const [tournamentOptions, setTournamentOptions] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const range = useMemo(() => resolveRange(preset, customFrom, customTo), [preset, customFrom, customTo]);

  const loadStats = useCallback(async () => {
    setLoading(true);
    try {
      const s = await analyticsApi.getTransactions(range.from, range.to, "month");
      setStats(s);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [analyticsApi, range.from, range.to]);

  useEffect(() => { loadStats(); }, [loadStats]);

  useEffect(() => {
    analyticsApi.getTournaments(range.from, range.to)
      .then((list) => setTournamentOptions(Array.isArray(list) ? list : []))
      .catch(() => setTournamentOptions([]));
  }, [analyticsApi, range.from, range.to]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">{title}</h1>
        <p className="text-sm text-slate-500 dark:text-white/60">Tra cứu và quản lý toàn bộ giao dịch thanh toán</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {RANGE_PRESETS.map((p) => (
          <button
            key={p.value}
            type="button"
            onClick={() => setPreset(p.value)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              preset === p.value ? "bg-indigo-600 text-white" : "bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-white/70 hover:bg-slate-200 dark:hover:bg-white/10"
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
        <select
          className="admin-select w-auto ml-auto"
          value={tournamentId}
          onChange={(e) => setTournamentId(e.target.value)}
        >
          <option value="">Tất cả giải đấu</option>
          {tournamentOptions.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="admin-card h-28 animate-pulse bg-slate-100 dark:bg-white/10" />)}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <AdminStatCard icon={CreditCard} accent="indigo" label="Tổng giao dịch" value={stats?.totalTransactions ?? 0} />
            <AdminStatCard icon={CheckCircle2} accent="emerald" label="Tỷ lệ thành công" value={`${Math.round(stats?.successRatePct || 0)}%`} />
            <AdminStatCard icon={DollarSign} accent="emerald" label="Giá trị TB / giao dịch" value={formatVND(stats?.avgTransactionValue || 0)} />
            <AdminStatCard icon={Clock} accent="cyan" label="Thời gian xử lý TB" value={`${Math.round(stats?.avgConversionMinutes || 0)} phút`} />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <AdminCard title="Theo trạng thái" padding={false}>
              <div className="px-2 pb-2">
                <ChartOrEmpty hasData={hasCounts(stats?.byStatus)} options={donutOptions(stats?.byStatus || [], "Giao dịch", isDark)} />
              </div>
            </AdminCard>
            <AdminCard title="Theo phương thức thanh toán" padding={false}>
              <div className="px-2 pb-2">
                <ChartOrEmpty hasData={hasCounts(stats?.byMethod)} options={barByStatusOptions(stats?.byMethod || [], "Giao dịch", isDark)} />
              </div>
            </AdminCard>
          </div>
        </>
      )}

      <AdminCard title="Danh sách giao dịch">
        <TransactionTable
          analyticsApi={analyticsApi}
          tournamentId={tournamentId || undefined}
          from={range.from}
          to={range.to}
        />
      </AdminCard>
    </div>
  );
};

export default TransactionsPage;
