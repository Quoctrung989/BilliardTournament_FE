const AdminModal = ({ open, onClose, title, children, footer }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={onClose}
        role="presentation"
        aria-hidden
      />
      <div
        className="relative admin-card w-full max-w-md shadow-2xl animate-in fade-in"
        role="dialog"
        aria-modal="true"
      >
        <div className="px-6 py-4 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
        </div>
        <div className="px-6 py-4 text-sm text-slate-600">{children}</div>
        {footer && (
          <div className="px-6 py-4 border-t border-slate-200 flex justify-end gap-2 bg-slate-50/80 rounded-b-xl">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminModal;
