import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import {
  getPlayerTournamentDetail,
  getMyRegistrations,
} from "../../api/playerRegistrationApi";
import {
  TOURNAMENT_STATUS_LABELS,
  TOURNAMENT_STATUS_STYLES,
} from "../../constants/tournamentConfig";
import { getApiErrorMessage } from "../../utils/apiError";

const fmtDate = (iso) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("vi-VN", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
};

const fmtCurrency = (v) => {
  if (v == null || v === "" || Number(v) === 0) return "Miễn phí";
  return `${Number(v).toLocaleString("vi-VN")} đ`;
};

const participantLabel = (type) =>
  type === "SINGLE" ? "Đơn" : type === "DOUBLE" ? "Đôi" : type === "TEAM" ? "Đội" : type || "—";

const InfoRow = ({ label, children }) => (
  <div>
    <dt className="text-xs uppercase tracking-wide text-slate-400 mb-0.5">{label}</dt>
    <dd className="text-sm font-medium text-slate-800">{children}</dd>
  </div>
);

/* Thanh slot trực quan */
const SlotBar = ({ approved, max }) => {
  const pct = max > 0 ? Math.min(100, (approved / max) * 100) : 0;
  const remaining = Math.max(0, max - approved);
  const full = remaining === 0;

  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-slate-500">Đã đăng ký xác nhận</span>
        <span className={`font-semibold ${full ? "text-red-600" : remaining <= 3 ? "text-amber-600" : "text-emerald-600"}`}>
          {full ? "Đã đủ người" : `Còn ${remaining} slot`}
        </span>
      </div>
      <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${full ? "bg-red-500" : remaining <= 3 ? "bg-amber-400" : "bg-emerald-400"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-xs text-slate-400 mt-1">{approved} / {max} người tham gia</p>
    </div>
  );
};

const PlayerTournamentDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const tournamentId = Number(id);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState(null);
  const [myRegistration, setMyRegistration] = useState(undefined); // undefined = loading, null = not registered

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [data, allMyRegs] = await Promise.all([
        getPlayerTournamentDetail(tournamentId),
        getMyRegistrations({ page: 0, size: 100 }).catch(() => ({ content: [] })),
      ]);
      setDetail(data);
      const found = allMyRegs.content?.find((r) => r.tournamentId === tournamentId) ?? null;
      setMyRegistration(found);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
      navigate("/player/tournaments");
    } finally {
      setLoading(false);
    }
  }, [tournamentId, navigate]);

  useEffect(() => {
    if (tournamentId) load();
  }, [tournamentId, load]);

  if (loading) {
    return <div className="max-w-3xl mx-auto px-4 py-16 text-center text-slate-400">Đang tải...</div>;
  }

  if (!detail) return null;

  const approved = detail.approvedCount ?? 0;
  const remaining = detail.remainingSlots ?? (detail.maxParticipants - approved);
  const isFull = remaining <= 0;
  const alreadyRegistered = Boolean(myRegistration);
  const canRegister = detail.status === "OPEN_FOR_REGISTRATION" && detail.isRegister && !isFull && !alreadyRegistered;
  const statusStyle = TOURNAMENT_STATUS_STYLES[detail.status] || "bg-slate-100 text-slate-600";
  const statusLabel = TOURNAMENT_STATUS_LABELS[detail.status] || detail.status;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <button type="button" className="text-sm text-indigo-600 hover:underline" onClick={() => navigate("/player/tournaments")}>
        ← Danh sách giải đấu
      </button>

      {/* Header */}
      <div className="admin-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{detail.name}</h1>
            {detail.description && <p className="text-sm text-slate-500 mt-1">{detail.description}</p>}
          </div>
          <span className={`shrink-0 px-3 py-1 rounded-full text-sm font-semibold ${statusStyle}`}>
            {statusLabel}
          </span>
        </div>

        <dl className="grid gap-4 sm:grid-cols-2 mb-5">
          <InfoRow label="Loại bi">{detail.gameType}</InfoRow>
          <InfoRow label="Thể thức">{detail.formatName || detail.format}</InfoRow>
          <InfoRow label="Hình thức">{participantLabel(detail.participantType)}</InfoRow>
          <InfoRow label="Phí tham dự">{fmtCurrency(detail.entryFee)}</InfoRow>
          {detail.prizePool && <InfoRow label="Tổng giải thưởng">{fmtCurrency(detail.prizePool)}</InfoRow>}
          {detail.prizeDescription && (
            <div className="sm:col-span-2">
              <InfoRow label="Cơ cấu giải thưởng">{detail.prizeDescription}</InfoRow>
            </div>
          )}
        </dl>

        {/* Slot bar */}
        <div className="pt-4 border-t border-slate-100">
          <SlotBar approved={approved} max={detail.maxParticipants} />
        </div>
      </div>

      {/* Dates */}
      <div className="admin-card p-6">
        <h2 className="text-sm font-semibold text-slate-700 mb-4 uppercase tracking-wide">Thời gian</h2>
        <dl className="grid gap-4 sm:grid-cols-3">
          <InfoRow label="Hạn đăng ký">{fmtDate(detail.registrationDeadline)}</InfoRow>
          <InfoRow label="Bắt đầu">{fmtDate(detail.startAt)}</InfoRow>
          <InfoRow label="Kết thúc">{fmtDate(detail.endAt)}</InfoRow>
        </dl>
      </div>

      {/* Config summary */}
      {detail.configSummary && (
        <div className="admin-card p-6">
          <h2 className="text-sm font-semibold text-slate-700 mb-4 uppercase tracking-wide">Thể thức thi đấu</h2>
          <dl className="grid gap-4 sm:grid-cols-2">
            {detail.configSummary.seedingMethod && (
              <InfoRow label="Xếp hạt giống">
                {detail.configSummary.seedingMethod === "RANDOM" ? "Ngẫu nhiên"
                  : detail.configSummary.seedingMethod === "ELO" ? "Theo ELO" : "Thủ công"}
              </InfoRow>
            )}
            {detail.configSummary.bracketSize != null && (
              <InfoRow label="Số slot bracket">{detail.configSummary.bracketSize}</InfoRow>
            )}
            {detail.configSummary.breakRule && (
              <InfoRow label="Luật break">
                {detail.configSummary.breakRule === "ALTERNATE_BREAK" ? "Luân phiên"
                  : detail.configSummary.breakRule === "WINNER_BREAK" ? "Người thắng" : "Người thua"}
              </InfoRow>
            )}
            {detail.configSummary.finalRaceTo != null && (
              <InfoRow label="Race-to chung kết">Race to {detail.configSummary.finalRaceTo}</InfoRow>
            )}
            {detail.configSummary.thirdPlaceMatch != null && (
              <InfoRow label="Tranh hạng 3">{detail.configSummary.thirdPlaceMatch ? "Có" : "Không"}</InfoRow>
            )}
          </dl>
        </div>
      )}

      {/* Registration section */}
      {detail.isRegister && (
        <div className="overflow-hidden rounded-2xl shadow-sm"
             style={{
               background: alreadyRegistered ? "#f0fdf4"
                 : canRegister ? "linear-gradient(135deg,#010851 0%,#0d1b2e 100%)"
                 : "#f5f6fa",
               border: alreadyRegistered ? "1px solid #86efac"
                 : canRegister ? "none" : "1px solid #e2e8f0",
             }}>
          <div className="p-6">
            {/* Đã đăng ký rồi */}
            {alreadyRegistered ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                    <span className="text-emerald-600 text-lg">✓</span>
                  </div>
                  <div>
                    <p className="font-bold text-emerald-800">Bạn đã đăng ký giải này</p>
                    <p className="text-sm text-emerald-600">
                      Trạng thái:{" "}
                      <strong>
                        {{
                          PENDING_PAYMENT: "Chờ thanh toán",
                          PAID: "Đã thanh toán",
                          APPROVED: "Tham gia chính thức",
                          REJECTED: "Không được tham dự",
                          CANCELLED: "Đã hủy",
                        }[myRegistration.status] || myRegistration.status}
                      </strong>
                    </p>
                  </div>
                </div>
                {myRegistration.status === "PENDING_PAYMENT" && (
                  <button
                    type="button"
                    onClick={() => navigate("/player/registrations")}
                    className="w-full py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2"
                    style={{ background: "#EF342A", color: "white" }}
                  >
                    Thanh toán ngay →
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => navigate("/player/registrations")}
                  className="w-full py-2.5 rounded-2xl text-sm font-medium border border-emerald-200 text-emerald-700 hover:bg-emerald-50 transition-colors"
                >
                  Xem đăng ký của tôi
                </button>
              </div>
            ) : isFull ? (
              <div className="text-center py-2">
                <p className="font-semibold text-red-600 mb-1">Đã đủ {detail.maxParticipants} người tham gia</p>
                <p className="text-sm text-slate-500">Không còn slot trống.</p>
              </div>
            ) : canRegister ? (
              <div>
                {remaining <= 3 && (
                  <div className="mb-4 px-4 py-2 rounded-xl bg-amber-400/20 border border-amber-400/30 text-sm text-amber-300 font-semibold text-center">
                    ⚡ Chỉ còn {remaining} slot cuối cùng!
                  </div>
                )}
                <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
                  <div>
                    <p className="text-xs text-white/50 uppercase tracking-wide mb-0.5">Phí tham dự</p>
                    <p className="text-2xl font-black text-white">
                      {detail.entryFee && Number(detail.entryFee) > 0
                        ? `${Number(detail.entryFee).toLocaleString("vi-VN")} đ`
                        : "Miễn phí"}
                    </p>
                  </div>
                  {detail.registrationFormTemplateName && (
                    <div className="text-right">
                      <p className="text-xs text-white/40 mb-0.5">Form đăng ký</p>
                      <p className="text-sm text-white/70 font-medium">{detail.registrationFormTemplateName}</p>
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  className="w-full py-4 rounded-2xl font-black text-base text-white uppercase tracking-wider transition-all hover:opacity-90 active:scale-[0.98]"
                  style={{ background: "#EF342A" }}
                  onClick={() => navigate(`/player/tournaments/${tournamentId}/register`)}
                >
                  {detail.entryFee && Number(detail.entryFee) > 0 ? "Đăng ký & Thanh toán →" : "Đăng ký tham dự →"}
                </button>
                <p className="text-center text-white/40 text-xs mt-2">
                  {detail.entryFee && Number(detail.entryFee) > 0
                    ? "Sẽ được chuyển sang trang thanh toán PayOS sau khi điền form"
                    : "Xác nhận tham dự tự động nếu còn slot"}
                </p>
              </div>
            ) : (
              <div className="text-center py-2">
                <p className="text-slate-500 text-sm">
                  {detail.status === "REGISTRATION_CLOSED" || detail.status === "DRAW_DONE" ? "Đã đóng đăng ký."
                    : detail.status === "IN_PROGRESS" ? "Giải đấu đang diễn ra."
                    : detail.status === "COMPLETED" ? "Giải đấu đã kết thúc."
                    : "Chưa mở đăng ký."}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {!detail.isRegister && (
        <div className="admin-card p-6">
          <h2 className="text-sm font-semibold text-slate-700 mb-2 uppercase tracking-wide">Đăng ký</h2>
          <p className="text-sm text-slate-500">Giải đấu này không nhận đăng ký online. Vui lòng liên hệ Ban tổ chức.</p>
        </div>
      )}

      <div className="flex gap-3">
        <button type="button" className="admin-btn admin-btn-secondary" onClick={() => navigate("/player/registrations")}>
          Đăng ký của tôi
        </button>
      </div>
    </div>
  );
};

export default PlayerTournamentDetailPage;
