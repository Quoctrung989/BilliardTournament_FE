import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle, XCircle, Clock, ArrowRight, Loader } from "lucide-react";
import { confirmPaymentReturn } from "../../api/paymentApi";

const PaymentSuccessPage = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [confirming, setConfirming] = useState(true);
  const [countdown, setCountdown] = useState(5);

  const code      = params.get("code") || "00";
  const cancel    = params.get("cancel") === "true";
  const status    = params.get("status") || "PAID";
  const orderCode = params.get("orderCode");

  const isSuccess   = code === "00" && !cancel && status === "PAID";
  const isCancelled = cancel || status === "CANCELLED";

  /* Gọi backend để xác nhận thanh toán — backup cho webhook */
  useEffect(() => {
    if (isSuccess && orderCode) {
      confirmPaymentReturn(Number(orderCode), "PAID")
        .catch(() => {/* Lỗi xác nhận — không chặn UI */})
        .finally(() => setConfirming(false));
    } else {
      setConfirming(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* Đếm ngược tự chuyển trang */
  useEffect(() => {
    if (!isSuccess || confirming) return;
    const timer = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) { clearInterval(timer); navigate("/player/registrations"); }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isSuccess, confirming, navigate]);

  /* ── Đang xác nhận với server ── */
  if (confirming && isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4"
           style={{ background: "linear-gradient(135deg,#010851 0%,#0d1b2e 100%)" }}>
        <div className="text-center">
          <Loader size={48} className="mx-auto mb-4 text-white/60 animate-spin" />
          <p className="text-white font-semibold text-lg">Đang xác nhận thanh toán...</p>
          <p className="text-white/50 text-sm mt-1">Vui lòng chờ trong giây lát</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4"
         style={{ background: "linear-gradient(135deg,#010851 0%,#0d1b2e 100%)" }}>
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white dark:bg-[#161a22] rounded-3xl overflow-hidden shadow-2xl">
          {/* Top stripe */}
          <div className={`h-2 w-full ${isSuccess ? "bg-emerald-400" : isCancelled ? "bg-amber-400" : "bg-slate-300"}`} />

          <div className="p-8 text-center">
            {isSuccess ? (
              <CheckCircle size={64} className="mx-auto mb-4 text-emerald-500" />
            ) : isCancelled ? (
              <XCircle size={64} className="mx-auto mb-4 text-amber-500" />
            ) : (
              <Clock size={64} className="mx-auto mb-4 text-slate-400 dark:text-white/40" />
            )}

            <h1 className="text-2xl font-black text-[#010851] mb-2">
              {isSuccess ? "Thanh toán thành công!" : isCancelled ? "Đã hủy thanh toán" : "Đang xử lý..."}
            </h1>

            {isSuccess && (
              <>
                {orderCode && (
                  <p className="text-slate-400 dark:text-white/40 text-sm mb-1">Mã đơn: <strong className="text-slate-700 dark:text-white/80">#{orderCode}</strong></p>
                )}
                <p className="text-slate-500 dark:text-white/60 text-sm mb-6">
                  Đăng ký của bạn đã được xác nhận. Kiểm tra trạng thái trong "Đăng ký của tôi".
                </p>
                <div className="mb-6 py-3 px-4 rounded-2xl text-sm font-medium"
                     style={{ background: "rgba(1,8,81,0.06)" }}>
                  <span className="text-[#010851]/60">Tự động chuyển trang sau </span>
                  <strong className="text-[#EF342A]">{countdown}s</strong>
                </div>
              </>
            )}

            {isCancelled && (
              <p className="text-slate-500 dark:text-white/60 text-sm mb-6">
                Bạn đã hủy giao dịch. Đơn đăng ký vẫn còn hiệu lực — bạn có thể thanh toán lại bất kỳ lúc nào trong "Đăng ký của tôi".
              </p>
            )}

            {!isSuccess && !isCancelled && (
              <p className="text-slate-500 dark:text-white/60 text-sm mb-6">
                Giao dịch đang được xử lý. Vui lòng kiểm tra lại sau ít phút.
              </p>
            )}

            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={() => navigate("/player/registrations")}
                className="w-full py-3 rounded-2xl font-bold text-sm text-white flex items-center justify-center gap-2 transition-all hover:opacity-90"
                style={{ background: "linear-gradient(90deg,#010851,#0d1b2e)" }}
              >
                Xem đăng ký của tôi
                <ArrowRight size={16} />
              </button>
              <button
                type="button"
                onClick={() => navigate("/event")}
                className="w-full py-2.5 rounded-2xl font-medium text-sm text-slate-500 dark:text-white/60 hover:text-[#010851] border border-slate-200 dark:border-white/10 hover:border-[#010851] transition-colors"
              >
                Xem giải đấu khác
              </button>
            </div>
          </div>
        </div>

        <p className="text-center text-white/30 text-xs mt-6">
          CAPSTONE<span className="text-[#EF342A]">.</span> Billiards Tournament System
        </p>
      </div>
    </div>
  );
};

export default PaymentSuccessPage;
