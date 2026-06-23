import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { Trophy, Users, DollarSign, FileText, Clock, CheckCircle } from "lucide-react";
import { getApiErrorMessage } from "../../utils/apiError";

const StatCard = ({ icon: Icon, label, value, sub, color = "#010851" }) => (
  <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
    <div className="flex items-start justify-between mb-3">
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center"
        style={{ background: `${color}15` }}
      >
        <Icon size={18} style={{ color }} />
      </div>
    </div>
    <p className="text-2xl font-black text-[#010851]">{value ?? "—"}</p>
    <p className="text-sm text-slate-500 mt-0.5">{label}</p>
    {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
  </div>
);

const fmtMoney = (v) => {
  if (!v || Number(v) === 0) return "0 đ";
  return `${Number(v).toLocaleString("vi-VN")} đ`;
};

const DashboardPage = ({ statsLoader, basePath, title }) => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    statsLoader()
      .then(setStats)
      .catch((err) => toast.error(getApiErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [statsLoader]);

  const cards = stats
    ? [
        { icon: Trophy, label: "Tổng giải đấu", value: stats.totalTournaments, color: "#010851" },
        { icon: CheckCircle, label: "Giải đang hoạt động", value: stats.activeTournaments, color: "#10b981" },
        { icon: FileText, label: "Đang mở đăng ký", value: stats.openTournaments, color: "#EF342A" },
        { icon: Users, label: "Người tham gia", value: stats.totalParticipants, color: "#8b5cf6" },
        { icon: Clock, label: "Chờ thanh toán", value: stats.pendingRegistrations, color: "#f59e0b" },
        { icon: DollarSign, label: "Doanh thu", value: fmtMoney(stats.totalRevenue), color: "#10b981" },
      ]
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">{title}</h1>
        <p className="text-sm text-slate-500">Tổng quan hệ thống giải đấu</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-5 h-28 animate-pulse bg-slate-100" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {cards.map((c) => <StatCard key={c.label} {...c} />)}
        </div>
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
