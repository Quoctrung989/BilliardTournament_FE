import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { ArrowLeft, CheckCircle, CreditCard, Loader } from "lucide-react";
import {
  getTournamentRegistrationForm,
  submitTournamentRegistration,
} from "../../api/playerRegistrationApi";
import { createCheckout } from "../../api/paymentApi";
import RegistrationDynamicForm from "../../components/registration-form/RegistrationDynamicForm";
import { getApiErrorMessage } from "../../utils/apiError";

const fmtMoney = (v) => {
  if (!v || Number(v) === 0) return "Miễn phí";
  return `${Number(v).toLocaleString("vi-VN")} đ`;
};

const TournamentRegisterPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const tournamentId = Number(id);

  const [loading, setLoading] = useState(true);
  const [formPreview, setFormPreview] = useState(null);
  const [values, setValues] = useState({});
  const [note, setNote] = useState("");

  /* Trạng thái submit */
  const [submitState, setSubmitState] = useState("idle");
  // idle | submitting | paying | success_free | success_paid_retry
  const [registrationId, setRegistrationId] = useState(null);
  const [checkoutUrl, setCheckoutUrl] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getTournamentRegistrationForm(tournamentId);
      setFormPreview(data);
      const initial = {};
      (data.fields || []).forEach((f) => {
        if (f.defaultValue) initial[f.fieldKey] = f.defaultValue;
      });
      setValues(initial);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
      navigate(`/player/tournaments/${tournamentId}`);
    } finally {
      setLoading(false);
    }
  }, [tournamentId, navigate]);

  useEffect(() => {
    if (tournamentId) load();
  }, [tournamentId, load]);

  const hasFee = Boolean(formPreview?.entryFee && Number(formPreview.entryFee) > 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitState !== "idle") return;

    const fieldValues = (formPreview?.fields || [])
      .filter((f) => values[f.fieldKey] !== undefined && values[f.fieldKey] !== "")
      .map((f) => ({ fieldKey: f.fieldKey, value: String(values[f.fieldKey]) }));

    try {
      if (hasFee) {
        /* Có phí: submit → checkout → redirect PayOS (1 thao tác liên tục) */
        setSubmitState("submitting");
        const response = await submitTournamentRegistration(tournamentId, {
          registrationType: formPreview?.participantType || "SINGLE",
          note: note.trim() || null,
          fieldValues,
        });
        const regId = response.id;
        setRegistrationId(regId);

        setSubmitState("paying");
        try {
          const co = await createCheckout(regId);
          window.location.href = co.checkoutUrl;
          // Không set state thêm vì browser sẽ redirect
        } catch (payErr) {
          // Checkout thất bại — lưu lại để user thử lại
          toast.error("Tạo đơn thanh toán thất bại. Bạn có thể thử lại bên dưới.");
          setCheckoutUrl(null);
          setSubmitState("success_paid_retry");
        }
      } else {
        /* Miễn phí: submit → màn xác nhận */
        setSubmitState("submitting");
        const response = await submitTournamentRegistration(tournamentId, {
          registrationType: formPreview?.participantType || "SINGLE",
          note: note.trim() || null,
          fieldValues,
        });
        setRegistrationId(response.id);
        toast.success("Đăng ký thành công!");
        setSubmitState("success_free");
      }
    } catch (err) {
      toast.error(getApiErrorMessage(err));
      setSubmitState("idle");
    }
  };

  const handleRetryPayment = async () => {
    if (!registrationId) return;
    setSubmitState("paying");
    try {
      const co = await createCheckout(registrationId);
      window.location.href = co.checkoutUrl;
    } catch (err) {
      toast.error(getApiErrorMessage(err));
      setSubmitState("success_paid_retry");
    }
  };

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center text-slate-400">
        Đang tải form đăng ký...
      </div>
    );
  }

  if (!formPreview) return null;

  /* ── Đang chuyển tới cổng thanh toán ── */
  if (submitState === "paying") {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <Loader size={48} className="mx-auto mb-4 text-indigo-500 animate-spin" />
        <h2 className="text-xl font-bold text-slate-900 mb-2">Đang chuyển tới cổng thanh toán...</h2>
        <p className="text-slate-500">Vui lòng không đóng trang này.</p>
      </div>
    );
  }

  /* ── Đăng ký miễn phí thành công ── */
  if (submitState === "success_free") {
    return (
      <div className="max-w-lg mx-auto px-4 py-12">
        <div className="admin-card p-8 text-center">
          <CheckCircle size={56} className="mx-auto mb-4 text-emerald-500" />
          <h2 className="text-xl font-bold text-slate-900 mb-2">Đăng ký thành công!</h2>
          <p className="text-slate-500 mb-6">
            Đây là giải đấu miễn phí. Bạn đã được tự động xác nhận tham gia nếu còn slot.
            Kiểm tra lại trạng thái trong mục "Đăng ký của tôi".
          </p>
          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={() => navigate("/player/registrations")}
              className="admin-btn admin-btn-primary w-full py-3 text-base font-semibold"
            >
              Xem đăng ký của tôi
            </button>
            <button
              type="button"
              onClick={() => navigate("/event")}
              className="text-sm text-slate-400 hover:text-slate-600"
            >
              Xem giải đấu khác
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ── Có phí nhưng checkout lỗi — cho phép thử lại ── */
  if (submitState === "success_paid_retry") {
    return (
      <div className="max-w-lg mx-auto px-4 py-12">
        <div className="admin-card p-8 text-center">
          <CheckCircle size={56} className="mx-auto mb-4 text-emerald-500" />
          <h2 className="text-xl font-bold text-slate-900 mb-2">Đăng ký đã được ghi nhận!</h2>
          <p className="text-slate-500 mb-2">
            Đơn đăng ký của bạn đã lưu. Bạn cần thanh toán để xác nhận tham gia.
          </p>
          <div className="mb-6 p-4 rounded-xl bg-indigo-50 border border-indigo-100">
            <p className="text-sm text-indigo-600 font-medium mb-1">Phí tham dự</p>
            <p className="text-2xl font-black text-indigo-900">{fmtMoney(formPreview.entryFee)}</p>
          </div>
          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={handleRetryPayment}
              className="admin-btn admin-btn-primary w-full flex items-center justify-center gap-2 py-3 text-base font-semibold"
            >
              <CreditCard size={18} />
              Thanh toán ngay qua PayOS
            </button>
            <button
              type="button"
              onClick={() => navigate("/player/registrations")}
              className="admin-btn admin-btn-secondary w-full"
            >
              Thanh toán sau (trong "Đăng ký của tôi")
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ── Form đăng ký ── */
  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <button
        type="button"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors mb-5"
        onClick={() => navigate(`/player/tournaments/${tournamentId}`)}
      >
        <ArrowLeft size={14} /> Quay lại chi tiết giải
      </button>

      {/* Tournament header */}
      <div className="mb-5 p-4 rounded-xl bg-indigo-50 border border-indigo-100">
        <h1 className="text-lg font-bold text-indigo-900">{formPreview.tournamentName}</h1>
        {formPreview.templateDescription && (
          <p className="text-sm text-indigo-700 mt-1">{formPreview.templateDescription}</p>
        )}
        <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-indigo-500">
          {formPreview.participantType && (
            <span>
              Hình thức:{" "}
              {formPreview.participantType === "SINGLE" ? "Đơn" : formPreview.participantType === "DOUBLE" ? "Đôi" : "Đội"}
            </span>
          )}
          <span className={`font-semibold ${hasFee ? "text-red-600" : "text-emerald-600"}`}>
            Phí tham dự: {fmtMoney(formPreview.entryFee)}
          </span>
        </div>
      </div>

      {/* Thông báo quy trình rõ ràng */}
      {hasFee ? (
        <div className="mb-5 p-4 rounded-xl bg-amber-50 border border-amber-200 flex gap-3">
          <CreditCard size={20} className="text-amber-600 shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold text-amber-800">Quy trình đăng ký có phí</p>
            <p className="text-amber-700 mt-0.5">
              1. Điền form bên dưới → 2. Nhấn nút → 3. Tự động chuyển tới PayOS để thanh toán{" "}
              <strong>{fmtMoney(formPreview.entryFee)}</strong> → 4. Thanh toán xong = Tham gia chính thức
            </p>
          </div>
        </div>
      ) : (
        <div className="mb-5 p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex gap-3">
          <CheckCircle size={20} className="text-emerald-600 shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold text-emerald-800">Giải đấu miễn phí</p>
            <p className="text-emerald-700 mt-0.5">Điền form và nhấn đăng ký — sẽ được xác nhận ngay nếu còn slot.</p>
          </div>
        </div>
      )}

      <div className="admin-card p-6">
        <h2 className="text-base font-semibold text-slate-900 mb-5">Thông tin đăng ký</h2>
        <form onSubmit={handleSubmit} className="space-y-5">
          <RegistrationDynamicForm
            fields={formPreview.fields || []}
            values={values}
            onChange={setValues}
          />

          <div>
            <label className="admin-label">Ghi chú (tùy chọn)</label>
            <textarea
              className="admin-input w-full min-h-[80px] mt-1"
              placeholder="Ghi chú cho Ban tổ chức..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          <div className="pt-2 border-t border-slate-100">
            <button
              type="submit"
              className={`w-full py-3 text-base font-bold rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-60 ${
                hasFee
                  ? "bg-[#ef342a] hover:bg-[#d42a22] text-white"
                  : "bg-emerald-600 hover:bg-emerald-700 text-white"
              }`}
              disabled={submitState !== "idle"}
            >
              {submitState === "submitting" ? (
                <><Loader size={18} className="animate-spin" /> Đang gửi đăng ký...</>
              ) : hasFee ? (
                <><CreditCard size={18} /> Đăng ký & thanh toán {fmtMoney(formPreview.entryFee)}</>
              ) : (
                "Gửi đăng ký"
              )}
            </button>
            <p className="text-xs text-slate-400 text-center mt-2">
              {hasFee
                ? "Bạn sẽ được tự động chuyển sang trang thanh toán PayOS ngay sau khi gửi."
                : "Đăng ký xong sẽ được xét duyệt tự động theo số slot còn trống."}
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TournamentRegisterPage;
