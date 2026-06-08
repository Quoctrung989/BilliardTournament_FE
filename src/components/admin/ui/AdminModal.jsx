const AdminModal = ({ open, onClose, title, children, footer, size = "md" }) => {
  if (!open) return null;

  const maxWidth =
    size === "lg" ? "max-w-2xl" : size === "sm" ? "max-w-sm" : "max-w-md";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={onClose}
        role="presentation"
        aria-hidden
      />
      <div
        className={`relative admin-card w-full ${maxWidth} shadow-2xl animate-in fade-in max-h-[90vh] flex flex-col`}
        role="dialog"
        aria-modal="true"
      >
        <div className="px-6 py-4 border-b border-slate-200 shrink-0">
          <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
        </div>
        <div className="px-6 py-4 text-sm text-slate-600 overflow-y-auto">{children}</div>
        {footer && (
          <div className="px-6 py-4 border-t border-slate-200 flex justify-end gap-2 bg-slate-50/80 rounded-b-xl shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminModal;
