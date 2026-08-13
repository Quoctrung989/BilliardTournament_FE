/**
 * Thẻ số liệu.
 *
 * @param {string} [valueSize] "lg" (mặc định) cho con số; "sm" cho giá trị là
 *   một cụm chữ dài — ví dụ tên giải đấu. Cỡ 2xl với chuỗi dài trong lưới 6 cột
 *   sẽ xuống mỗi dòng một từ và kéo cao cả hàng thẻ.
 */
const AdminStatCard = ({ label, value, hint, icon: Icon, trend, accent = "indigo", valueSize = "lg" }) => {
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
        {/* `min-w-0` là bắt buộc: mặc định con của flex không co xuống dưới
            chiều rộng nội dung, nên một chuỗi dài sẽ đẩy thẻ phình ra hoặc
            xuống dòng từng chữ. */}
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</p>
          <p
            className={`font-bold text-slate-900 dark:text-slate-100 mt-1 tracking-tight break-words ${
              valueSize === "sm" ? "text-base leading-snug line-clamp-2" : "text-2xl"
            }`}
            title={typeof value === "string" ? value : undefined}
          >
            {value}
          </p>
          {hint && <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{hint}</p>}
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
