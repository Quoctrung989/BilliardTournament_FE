const AdminStatCard = ({ label, value, hint, icon: Icon, trend, accent = "indigo" }) => {
  const accents = {
    indigo: "from-indigo-500 to-violet-600",
    cyan: "from-cyan-500 to-blue-600",
    amber: "from-amber-500 to-orange-500",
    emerald: "from-emerald-500 to-teal-600",
  };
  const gradient = accents[accent] || accents.indigo;

  return (
    <div className="admin-card p-5 flex flex-col gap-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
          <p className="text-2xl font-bold text-slate-900 mt-1 tracking-tight">{value}</p>
          {hint && <p className="text-xs text-slate-500 mt-1">{hint}</p>}
        </div>
        {Icon && (
          <div
            className={`flex-shrink-0 w-11 h-11 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white shadow-sm`}
          >
            <Icon size={22} strokeWidth={2} />
          </div>
        )}
      </div>
      {trend != null && (
        <p
          className={`text-xs font-medium ${
            trend >= 0 ? "text-emerald-600" : "text-red-500"
          }`}
        >
          {trend >= 0 ? "↑" : "↓"} {Math.abs(trend)}% so với kỳ trước
        </p>
      )}
    </div>
  );
};

export default AdminStatCard;
