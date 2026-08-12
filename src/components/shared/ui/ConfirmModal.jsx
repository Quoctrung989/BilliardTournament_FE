import AdminButton from "../../admin/ui/AdminButton";
import AdminModal from "../../admin/ui/AdminModal";

const ConfirmModal = ({
    open,
    title,
    message,
    details,
    errorMessage,
    extraAction,
    confirmText = "Xác nhận",
    cancelText = "Hủy",
    onConfirm,
    onCancel,
    loading = false,
    confirmVariant = "danger",
}) => {
    const handleClose = () => {
        if (!loading) {
            onCancel?.();
        }
    };

    return (
        <AdminModal
            open={open}
            onClose={handleClose}
            title={title}
            footer={
                <>
                    <AdminButton variant="secondary" onClick={onCancel} disabled={loading}>
                        {cancelText}
                    </AdminButton>
                    {extraAction && (
                        <AdminButton variant="secondary" onClick={extraAction.onClick} disabled={loading}>
                            {extraAction.label}
                        </AdminButton>
                    )}
                    <AdminButton variant={confirmVariant} onClick={onConfirm} disabled={loading}>
                        {loading ? "Đang xử lý..." : confirmText}
                    </AdminButton>
                </>
            }
        >
            <div className="space-y-2">
                {message && <p className="text-slate-700 dark:text-white/75">{message}</p>}
                {details && <p className="text-sm text-slate-500 dark:text-white/60">{details}</p>}
                {errorMessage && (
                    <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                        <p className="text-sm text-red-700">{errorMessage}</p>
                    </div>
                )}
            </div>
        </AdminModal>
    );
};

export default ConfirmModal;