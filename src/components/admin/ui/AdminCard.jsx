const AdminCard = ({ children, className = "", padding = true, title, action }) => (
  <div className={`admin-card ${className}`}>
    {(title || action) && (
      <div
        className={`flex items-center justify-between gap-4 border-b border-slate-200 ${
          padding ? "px-5 py-4" : "px-5 py-3"
        }`}
      >
        {title && <h3 className="text-sm font-semibold text-slate-800">{title}</h3>}
        {action}
      </div>
    )}
    <div className={padding ? "p-5" : ""}>{children}</div>
  </div>
);

export default AdminCard;
