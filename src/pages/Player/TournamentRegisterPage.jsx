import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { ArrowLeft, CheckCircle, CreditCard, Loader, UserCheck } from "lucide-react";
import {
  getMyRegistrationForTournament,
  getTournamentRegistrationForm,
  submitTournamentRegistration,
} from "../../api/playerRegistrationApi";
import { createCheckout } from "../../api/paymentApi";
import { getProfile } from "../../api/profileApi";
import RegistrationDynamicForm from "../../components/registration-form/RegistrationDynamicForm";
import { getApiErrorMessage } from "../../utils/apiError";
import { useReveal } from "../../hooks/useReveal";
import { useAuthStore } from "../../store/authStore";

const fmtMoney = (v) => {
  if (!v || Number(v) === 0) return "Miễn phí";
  return `${Number(v).toLocaleString("vi-VN")} đ`;
};

/**
 * Những trường lấy được từ hồ sơ người đang đăng nhập.
 *
 * Khớp bằng `fieldKey` CHÍNH XÁC, không suy từ `uiComponent`. Template giải đôi
 * có `player2_phone` cũng là `PHONE_INPUT`; đoán theo kiểu ô thì số của người
 * đăng ký chui thẳng vào ô của đồng đội.
 *
 * Hai key này do `DataInitializer` bên backend đặt cho hai template có sẵn.
 * Owner tự dựng template với key khác thì không tự điền — thà để trống còn hơn
 * điền nhầm chỗ.
 *
 * Họ tên chỉ có ở hồ sơ (`GET /profile`); `GET /auth/me` không trả trường đó,
 * nên tài khoản chưa tạo hồ sơ thì chỉ điền được số điện thoại.
 *
 * Giữ khớp với `TournamentRegisterView.jsx` bên mobile — hai bên lệch nhau thì
 * cùng một người đăng ký trên hai thiết bị lại ra hai form khác nhau.
 */
const PREFILL_FROM_PROFILE = {
  /* `displayName` là đường lùi: hồ sơ tạo qua màn chơi có thể chỉ có tên hiển
     thị mà bỏ trống họ tên đầy đủ. Điền tên hiển thị vẫn hơn để trống, vì dù
     sao người dùng cũng sửa được. */
  player_full_name: (profile) => profile?.fullName || profile?.displayName || "",
  player_phone: (profile, user) => profile?.phone || user?.phone || "",
};

/** Giá trị điền sẵn cho các trường của giải, bỏ qua trường không có dữ liệu */
const buildPrefill = (fields, profile, user) => {
  const prefill = {};

  (fields || []).forEach((field) => {
    const source = PREFILL_FROM_PROFILE[field.fieldKey];
    if (!source) return;

    const value = source(profile, user);
    if (value) prefill[field.fieldKey] = String(value);
  });

  return prefill;
};

const TournamentRegisterPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const pageRef = useReveal({ threshold: 0 });
  const tournamentId = Number(id);

  const user = useAuthStore((s) => s.user);
  /* `load` chỉ nên chạy lại khi đổi giải (tournamentId), không phải mỗi khi
     store auth hydrate xong và đổi tham chiếu `user` — nếu không, lần chạy
     thứ hai sẽ bỏ qua bước điền hộ (prefilledOnce đã true) và ghi đè `values`
     bằng object gần như rỗng, xoá mất dữ liệu đã điền đúng ở lần đầu. */
  const userRef = useRef(user);
  useEffect(() => {
    userRef.current = user;
  }, [user]);

  const [loading, setLoading] = useState(true);
  const [formPreview, setFormPreview] = useState(null);
  const [values, setValues] = useState({});
  const [note, setNote] = useState("");
  /* Trang này vào được thẳng bằng URL, không chỉ qua nút "Đăng ký" đã bị ẩn khi
     đã đăng ký rồi — nếu không tự kiểm tra ở đây, người dùng gõ thẳng link vẫn
     mở được form và bấm gửi lại, nhận về lỗi 409 REGISTRATION_ALREADY_EXISTS mà
     không hiểu vì sao (xem PlayerTournamentDetailPage/EventDetailPage — hai màn
     đó chỉ ẩn nút, không chặn thẳng URL này). */
  const [existingRegistration, setExistingRegistration] = useState(null);
  /** Có điền hộ được ô nào không — quyết định việc hiện dòng nhắc phía trên form */
  const [prefilled, setPrefilled] = useState(false);

  /* Điền hộ đúng MỘT lần. `load` chạy lại thì việc điền lại sẽ xoá những gì
     người dùng vừa gõ, kể cả khi họ cố ý sửa tên để đăng ký cho người khác. */
  const prefilledOnce = useRef(false);

  /* Trạng thái submit */
  const [submitState, setSubmitState] = useState("idle");
  // idle | submitting | paying | success_free | success_paid_retry
  const [registrationId, setRegistrationId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [data, profile, myRegistration] = await Promise.all([
        getTournamentRegistrationForm(tournamentId),
        // Hồ sơ chỉ dùng để điền hộ. Tài khoản chưa tạo hồ sơ thì backend trả
        // 404 — nuốt lỗi tại đây, vì không có nó form vẫn phải mở được bình thường
        getProfile().catch(() => null),
        // Chưa đăng ký thì backend cũng trả 404 — coi như "chưa có" thay vì lỗi
        getMyRegistrationForTournament(tournamentId).catch(() => null),
      ]);
      setFormPreview(data);
      if (myRegistration) {
        setExistingRegistration(myRegistration);
        return;
      }

      const initial = {};
      (data.fields || []).forEach((f) => {
        if (f.defaultValue) initial[f.fieldKey] = f.defaultValue;
      });

      /* Hồ sơ đè lên defaultValue của template: giá trị mặc định do Owner đặt
         là ví dụ chung cho mọi người, còn đây là dữ liệu thật của người đang điền */
      if (!prefilledOnce.current) {
        prefilledOnce.current = true;

        const prefill = buildPrefill(data.fields, profile, userRef.current);
        if (Object.keys(prefill).length > 0) {
          Object.assign(initial, prefill);
          setPrefilled(true);
        }
      }

      /* setValues bằng updater thay vì ghi đè thẳng: nếu `load` chạy lại (StrictMode ở
         dev double-invoke effect, hoặc effect fire lại vì lý do khác) trong khi
         prefilledOnce.current đã true, `initial` ở lần này sẽ KHÔNG có phần điền hộ
         (đã bị guard bỏ qua) — merge với state cũ để giữ lại giá trị đã điền đúng ở
         lần chạy trước, thay vì để `initial` gần-rỗng ghi đè mất nó. */
      setValues((prev) => {
        const merged = { ...initial };
        Object.keys(prev).forEach((key) => {
          if (prev[key]) merged[key] = prev[key];
        });
        return merged;
      });
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
          // Checkout thất bại. Đăng ký đã lưu rồi nên đừng quay về "idle" —
          // chuyển sang màn cho trả tiền lại, `registrationId` ở trên đủ để thử lại
          toast.error("Tạo đơn thanh toán thất bại. Bạn có thể thử lại bên dưới.");
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
      <div className="max-w-2xl mx-auto px-4 py-16 text-center text-slate-400 dark:text-white/40 content-dark">
        Đang tải form đăng ký...
      </div>
    );
  }

  if (!formPreview) return null;

  /* ── Đã đăng ký giải này rồi — vào thẳng bằng URL vẫn phải thấy trạng thái
     thật, không phải form trống chờ gửi lại để rồi nhận lỗi khó hiểu ── */
  if (existingRegistration) {
    return (
      <div className="max-w-lg mx-auto px-4 py-12 content-dark">
        <div className="admin-card p-8 text-center">
          <UserCheck size={56} className="mx-auto mb-4 text-indigo-500" />
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Bạn đã đăng ký giải này rồi</h2>
          <p className="text-slate-500 dark:text-white/60 mb-6">
            Trạng thái hiện tại: <span className="font-semibold">{existingRegistration.status}</span>.
            Xem chi tiết hoặc thanh toán (nếu còn thiếu) trong mục "Đăng ký của tôi".
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
              onClick={() => navigate(`/player/tournaments/${tournamentId}`)}
              className="text-sm text-slate-400 dark:text-white/40 hover:text-slate-600 dark:hover:text-white/70"
            >
              Quay lại giải đấu
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ── Đang chuyển tới cổng thanh toán ── */
  if (submitState === "paying") {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center content-dark">
        <Loader size={48} className="mx-auto mb-4 text-indigo-500 animate-spin" />
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Đang chuyển tới cổng thanh toán...</h2>
        <p className="text-slate-500 dark:text-white/60">Vui lòng không đóng trang này.</p>
      </div>
    );
  }

  /* ── Đăng ký miễn phí thành công ── */
  if (submitState === "success_free") {
    return (
      <div className="max-w-lg mx-auto px-4 py-12 content-dark">
        <div className="admin-card p-8 text-center">
          <CheckCircle size={56} className="mx-auto mb-4 text-emerald-500" />
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Đăng ký thành công!</h2>
          <p className="text-slate-500 dark:text-white/60 mb-6">
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
              className="text-sm text-slate-400 dark:text-white/40 hover:text-slate-600 dark:hover:text-white/70"
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
      <div className="max-w-lg mx-auto px-4 py-12 content-dark">
        <div className="admin-card p-8 text-center">
          <CheckCircle size={56} className="mx-auto mb-4 text-emerald-500" />
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Đăng ký đã được ghi nhận!</h2>
          <p className="text-slate-500 dark:text-white/60 mb-2">
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
    // Các khối vào tuần tự lúc mount. Cố ý KHÔNG stagger từng ô nhập bên trong
    // form — người dùng vào đây để điền, ô nhảy vào lần lượt sẽ cản việc điền.
    <div ref={pageRef} className="max-w-2xl mx-auto px-4 py-8 content-dark">
      <button
        type="button"
        className="ui-stagger group inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors mb-5"
        style={{ "--i": 0 }}
        onClick={() => navigate(`/player/tournaments/${tournamentId}`)}
      >
        <ArrowLeft size={14} className="transition-transform duration-200 group-hover:-translate-x-1" /> Quay lại chi tiết giải
      </button>

      {/* Tournament header */}
      <div className="ui-stagger mb-5 p-4 rounded-xl bg-indigo-50 border border-indigo-100" style={{ "--i": 1 }}>
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
        <div className="ui-stagger mb-5 p-4 rounded-xl bg-amber-50 border border-amber-200 flex gap-3" style={{ "--i": 2 }}>
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
        <div className="ui-stagger mb-5 p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex gap-3" style={{ "--i": 2 }}>
          <CheckCircle size={20} className="text-emerald-600 shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold text-emerald-800">Giải đấu miễn phí</p>
            <p className="text-emerald-700 mt-0.5">Điền form và nhấn đăng ký — sẽ được xác nhận ngay nếu còn slot.</p>
          </div>
        </div>
      )}

      <div className="ui-stagger admin-card p-6" style={{ "--i": 3 }}>
        <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-5">Thông tin đăng ký</h2>

        {/* Nói rõ vì sao ô đã có sẵn chữ, và rằng sửa được. Không có dòng này
            thì người đăng ký hộ bạn mình sẽ tưởng form khoá cứng theo tài khoản */}
        {prefilled && (
          <div className="mb-5 flex items-start gap-2.5 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-3.5 py-3">
            <UserCheck size={18} className="mt-0.5 shrink-0 text-slate-400 dark:text-white/40" />
            <p className="text-sm text-slate-500 dark:text-white/60">
              Đã điền sẵn từ hồ sơ của bạn — sửa lại nếu bạn đăng ký cho người khác.
            </p>
          </div>
        )}

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

          <div className="pt-2 border-t border-slate-100 dark:border-white/10">
            <button
              type="submit"
              className={`ui-press w-full py-3 text-base font-bold rounded-xl flex items-center justify-center gap-2 disabled:opacity-60 ${
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
            <p className="text-xs text-slate-400 dark:text-white/40 text-center mt-2">
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
