const LABEL_BY_STATE = {
  connecting: "Đang kết nối realtime...",
  reconnecting: "Mất kết nối — đang thử lại...",
  disconnected: "Mất kết nối — đang thử lại...",
};

const SocketReconnectBanner = ({ connectionState }) => {
  if (connectionState === "connected") return null;
  const label = LABEL_BY_STATE[connectionState] || LABEL_BY_STATE.disconnected;

  return (
    <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-2 text-sm text-amber-800">
      {label} Sau khi nối lại, hệ thống sẽ tự tải snapshot để đồng bộ điểm.
    </div>
  );
};

export default SocketReconnectBanner;
