import AdminButton from "../../admin/ui/AdminButton";
import AdminModal from "../../admin/ui/AdminModal";

const ConfirmModal = ({
    open,
    title,
    message,
    details,
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
                    <AdminButton variant={confirmVariant} onClick={onConfirm} disabled={loading}>
                        {loading ? "Đang xử lý..." : confirmText}
                    </AdminButton>
                </>
            }
        >
            <div className="space-y-2">
                {message && <p className="text-slate-700">{message}</p>}
                {details && <p className="text-sm text-slate-500">{details}</p>}
            </div>
        </AdminModal>
    );
};

export default ConfirmModal;