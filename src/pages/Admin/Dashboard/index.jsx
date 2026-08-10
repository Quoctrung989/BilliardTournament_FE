import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import { DollarSign, TrendingUp, Trophy, Users } from "lucide-react";
import AdminCard from "../../../components/admin/ui/AdminCard";
import AdminStatCard from "../../../components/admin/ui/AdminStatCard";
import { formatVND } from "../../../utils/helpers";

const chartBase = {
  chart: {
    backgroundColor: "transparent",
    style: { fontFamily: "inherit" },
    height: 280,
  },
  credits: { enabled: false },
  legend: { enabled: false },
};

const Dashboard = () => {
  const revenueChart = {
    ...chartBase,
    chart: { ...chartBase.chart, type: "areaspline" },
    title: { text: null },
    xAxis: {
      categories: ["T2", "T3", "T4", "T5", "T6", "T7", "CN"],
      lineColor: "#e2e8f0",
      tickColor: "#e2e8f0",
    },
    yAxis: {
      title: { text: null },
      gridLineColor: "#f1f5f9",
      labels: {
        formatter() {
          return `${(this.value / 1e6).toFixed(0)}M`;
        },
      },
    },
    plotOptions: {
      areaspline: {
        fillOpacity: 0.15,
        marker: { enabled: false },
        lineWidth: 2,
      },
    },
    series: [
      {
        name: "Doanh thu",
        color: "#4f46e5",
        fillColor: {
          linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
          stops: [
            [0, "rgba(79, 70, 229, 0.35)"],
            [1, "rgba(79, 70, 229, 0)"],
          ],
        },
        data: [220, 280, 250, 310, 340, 380, 400],
      },
    ],
  };

  const tournamentsChart = {
    ...chartBase,
    chart: { ...chartBase.chart, type: "column" },
    title: { text: null },
    xAxis: {
      categories: ["T1", "T2", "T3", "T4", "T5", "T6"],
      lineColor: "#e2e8f0",
    },
    yAxis: {
      title: { text: null },
      gridLineColor: "#f1f5f9",
      allowDecimals: false,
    },
    plotOptions: {
      column: {
        borderRadius: 6,
        borderWidth: 0,
        color: "#06b6d4",
      },
    },
    series: [{ name: "Giải mới", data: [5, 8, 6, 10, 12, 15] }],
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <AdminStatCard
          label="Doanh thu tháng"
          value={formatVND(300000000)}
          hint="Ước tính từ đăng ký giải"
          icon={DollarSign}
          accent="indigo"
          trend={12}
        />
        <AdminStatCard
          label="Người dùng mới"
          value="123"
          hint="Trong 30 ngày qua"
          icon={Users}
          accent="cyan"
          trend={8}
        />
        <AdminStatCard
          label="Giải đang diễn ra"
          value="4"
          hint="Toàn hệ thống"
          icon={Trophy}
          accent="amber"
        />
        <AdminStatCard
          label="Tỷ lệ lấp đầy"
          value="78%"
          hint="Sân / slot trung bình"
          icon={TrendingUp}
          accent="emerald"
          trend={3}
        />
      </div>

      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Phân tích nhanh</h2>
          <p className="text-xs text-slate-500 mt-0.5">Dữ liệu mẫu — kết nối API sau</p>
        </div>
        <select className="admin-select w-full sm:w-48" defaultValue="current-week">
          <option value="current-week">Tuần này</option>
          <option value="last-week">Tuần trước</option>
          <option value="current-month">Tháng này</option>
          <option value="last-month">Tháng trước</option>
        </select>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <AdminCard title="Doanh thu theo tuần" padding={false}>
          <div className="px-2 pb-2">
            <HighchartsReact highcharts={Highcharts} options={revenueChart} />
          </div>
        </AdminCard>
        <AdminCard title="Giải đấu mới" padding={false}>
          <div className="px-2 pb-2">
            <HighchartsReact highcharts={Highcharts} options={tournamentsChart} />
          </div>
        </AdminCard>
      </div>
    </div>
  );
};

export default Dashboard;
