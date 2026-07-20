import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import {
  ArrowLeft, Calendar, Trophy, Gamepad2, CreditCard,
  Clock, CheckCircle2, XCircle, Award, ChevronRight, MapPin,
} from "lucide-react";
import {
  getPlayerTournamentDetail,
  getMyRegistrations,
} from "../../api/playerRegistrationApi";
import { getApiErrorMessage } from "../../utils/apiError";

const BANNER_POOL = [
  "/images/tournaments/vn-player-1.jpg",
  "/images/tournaments/action-1.jpg",
  "/images/tournaments/action-2.jpg",
  "/images/tournaments/pool-6.jpg",
  "/images/tournaments/pool-4.jpg",
  "/images/tournaments/pool-2.jpg",
];

/* Chọn banner cố định theo id để mỗi giải có một ảnh khác nhau (không random) */
const bannerFor = (id) =>
  BANNER_POOL[Math.abs(Number(id) || 0) % BANNER_POOL.length];

const fmtDateRange = (start, end) => {
  if (!start && !end) return "—";
  const opts = { day: "2-digit", month: "short", year: "numeric" };
  const s = start ? new Date(start).toLocaleDateString("vi-VN", opts) : null;
  const e = end ? new Date(end).toLocaleDateString("vi-VN", opts) : null;
  if (s && e) return `${s} – ${e}`;
  return s || e;
};

const fmtDateFull = (iso) => {
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

/* ── Info column for the WNT-style info bar ── */
const InfoCol = ({ icon: Icon, label, value, border = true }) => (
  <div className={`flex flex-col gap-1 py-4 px-5 ${border ? "border-l border-slate-200 first:border-l-0" : ""}`}>
    <div className="flex items-center gap-1.5 text-slate-400 text-xs font-semibold uppercase tracking-wide">
      <Icon size={12} />
      {label}
    </div>
    <p className="text-slate-800 font-semibold text-sm">{value}</p>
  </div>
);

/* ── Slot progress bar ── */
const SlotBar = ({ approved, max }) => {
  const pct = max > 0 ? Math.min(100, (approved / max) * 100) : 0;
  const remaining = Math.max(0, max - approved);
  const full = remaining === 0;
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs">
        <span className="text-slate-500">Đã đăng ký</span>
        <span className={`font-semibold ${full ? "text-red-600" : remaining <= 3 ? "text-amber-600" : "text-emerald-600"}`}>
          {full ? "Đã đủ người" : `Còn ${remaining} slot`}
        </span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${full ? "bg-red-500" : remaining <= 3 ? "bg-amber-400" : "bg-emerald-400"}`}
          style={{ width: `${pct}%` }} />
      </div>
      <p className="text-xs text-slate-400">{approved} / {max} người</p>
    </div>
  );
};

const PlayerTournamentDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const tournamentId = Number(id);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState(null);
  const [myRegistration, setMyRegistration] = useState(undefined);
  const fallbackBanner = bannerFor(id);

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
      navigate("/event");
    } finally {
      setLoading(false);
    }
  }, [tournamentId, navigate]);

  useEffect(() => { if (tournamentId) load(); }, [tournamentId, load]);

  if (loading) {
    return (
      <div style={{ background: "#0c1527", minHeight: "50vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.875rem" }}>Đang tải...</p>
      </div>
    );
  }

  if (!detail) return null;

  const approved = detail.approvedCount ?? 0;
  const remaining = detail.remainingSlots ?? (detail.maxParticipants - approved);
  const isFull = remaining <= 0;
  const alreadyRegistered = Boolean(myRegistration);
  const canRegister = detail.status === "OPEN_FOR_REGISTRATION" && detail.isRegister && !isFull && !alreadyRegistered;
  /* ── Màu sắc trạng thái đăng ký ── */
  const regState = alreadyRegistered ? "registered"
    : canRegister ? "open"
    : isFull ? "full"
    : "closed";
  const isEndedOrClosed = detail.status === "COMPLETED" || detail.status === "REGISTRATION_CLOSED"
    || detail.status === "DRAW_DONE" || detail.status === "IN_PROGRESS" || detail.status === "CANCELLED";

  const REG_STATUS_TEXT = {
    PENDING_PAYMENT: "Chờ thanh toán",
    PAID: "Đã thanh toán",
    APPROVED: "Tham gia chính thức",
    REJECTED: "Không được tham dự",
    CANCELLED: "Đã hủy",
  };

  return (
    <div className="content-dark" style={{ background: "var(--pd-page)", minHeight: "100vh" }}>

      {/* ══════════════════════════════════════════
          HERO BANNER
      ══════════════════════════════════════════ */}
      <div style={{ position: "relative", width: "100%", height: "300px", overflow: "hidden" }}>
        {/* Banner image */}
        <img
          src={detail.thumbnailUrl || fallbackBanner}
          alt=""
          onError={(e) => { e.currentTarget.src = fallbackBanner; }}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" }}
        />
        {/* Dark overlay for readability */}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(12,21,39,0.55) 0%, rgba(12,21,39,0.25) 50%, rgba(232,232,232,0.15) 100%)" }} />

        {/* Back button → về trang đăng ký của tôi */}
        <button type="button"
          onClick={() => navigate("/player/registrations")}
          style={{
            position: "absolute", top: "1.25rem", left: "1.5rem",
            display: "flex", alignItems: "center", gap: "0.5rem",
            background: "rgba(255,255,255,0.1)", backdropFilter: "blur(8px)",
            border: "1px solid rgba(255,255,255,0.2)",
            borderRadius: "100px", padding: "0.4rem 0.9rem",
            color: "rgba(255,255,255,0.85)", fontSize: "0.8125rem", fontWeight: 600,
            cursor: "pointer",
          }}>
          <ArrowLeft size={14} /> Đăng ký của tôi
        </button>
      </div>

      {/* ══════════════════════════════════════════
          EVENT INFO CARD (overlaps hero)
      ══════════════════════════════════════════ */}
      <div style={{ position: "relative", zIndex: 10, maxWidth: "min(1100px, calc(100% - 3rem))", margin: "-60px auto 0", paddingBottom: "3rem" }}>
        <div style={{
          background: "var(--pd-card)",
          borderRadius: "1.25rem",
          boxShadow: "0 10px 40px rgba(0,0,0,0.15), 0 2px 8px rgba(0,0,0,0.08)",
          overflow: "visible",
          position: "relative",
        }}>
          {/* Floating "EVENT INFO" tab */}
          <div style={{
            position: "absolute", top: 0, left: "50%",
            transform: "translate(-50%, -50%)",
            background: "#0c1527",
            borderRadius: "100px",
            padding: "0.55rem 2rem",
            display: "flex", alignItems: "center", gap: "0.75rem",
            whiteSpace: "nowrap",
            boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
          }}>
            <span style={{ width: "3px", height: "1rem", background: "rgba(255,255,255,0.8)", borderRadius: "2px", flexShrink: 0 }} aria-hidden />
            <span style={{ color: "#fff", fontWeight: 700, fontSize: "0.7rem", letterSpacing: "0.12em", textTransform: "uppercase" }}>
              Thông tin giải đấu
            </span>
          </div>

          {/* Tournament name */}
          <div style={{ textAlign: "center", padding: "2.5rem 2rem 1.5rem" }}>
            <h1 style={{
              fontWeight: 900, fontSize: "clamp(1.4rem, 3vw, 2rem)",
              color: "var(--pd-heading)", fontStyle: "italic",
              textTransform: "uppercase", letterSpacing: "-0.01em",
              lineHeight: 1.25, margin: "0 0 0.5rem",
            }}>
              {detail.name}
            </h1>
            {detail.description && (
              <p style={{ color: "#64748b", fontSize: "0.875rem", margin: 0, maxWidth: "600px", marginLeft: "auto", marginRight: "auto" }}>
                {detail.description}
              </p>
            )}
          </div>

          {/* ── 4-column info bar ── */}
          <div style={{ borderTop: "1px solid var(--pd-border)", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))" }}>
            <InfoCol icon={Calendar} label="Ngày diễn ra"
              value={fmtDateRange(detail.startAt, detail.endAt)} />
            <InfoCol icon={Gamepad2} label="Loại bi"
              value={detail.gameType || "—"} />
            <InfoCol icon={Award} label="Thể thức"
              value={`${detail.formatName || detail.format || "—"} · ${participantLabel(detail.participantType)}`} />
            <InfoCol icon={Trophy} label="Tổng giải thưởng"
              value={fmtCurrency(detail.prizePool)} />
            <InfoCol icon={MapPin} label="Chi nhánh"
              value={detail.venue?.name || detail.venueName || "—"} />
          </div>
        </div>

        {/* ══════════════════════════════════════════
            REGISTRATION CTA BANNER (WNT "LIVE ACTION" style)
        ══════════════════════════════════════════ */}
        <div style={{
          marginTop: "1.5rem",
          borderRadius: "1rem",
          overflow: "hidden",
          position: "relative",
          background: regState === "registered"
            ? "linear-gradient(135deg, #064e3b 0%, #065f46 100%)"
            : regState === "open"
            ? "linear-gradient(135deg, #010851 0%, #0d1f3c 100%)"
            : "linear-gradient(135deg, #1e293b 0%, #334155 100%)",
          minHeight: "110px",
        }}>
          {/* Dot texture */}
          <div style={{
            position: "absolute", inset: 0,
            backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }} />

          <div style={{
            position: "relative",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "1.75rem 2.5rem", gap: "2rem", flexWrap: "wrap",
          }}>
            {/* Left: text */}
            {regState === "registered" ? (
              <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                <CheckCircle2 size={36} style={{ color: "#34d399", flexShrink: 0 }} />
                <div>
                  <p style={{ color: "#fff", fontWeight: 800, fontSize: "1rem", margin: "0 0 0.25rem", textTransform: "uppercase", letterSpacing: "0.03em" }}>
                    Bạn đã đăng ký giải này
                  </p>
                  <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.8125rem", margin: 0 }}>
                    Trạng thái:{" "}
                    <strong style={{ color: "#6ee7b7" }}>
                      {REG_STATUS_TEXT[myRegistration.status] || myRegistration.status}
                    </strong>
                  </p>
                </div>
              </div>
            ) : regState === "open" ? (
              <div>
                <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 0.35rem" }}>
                  Phí tham dự
                </p>
                <p style={{ color: "#fff", fontWeight: 900, fontSize: "1.75rem", letterSpacing: "-0.03em", margin: 0, lineHeight: 1 }}>
                  {fmtCurrency(detail.entryFee)}
                </p>
                {remaining <= 5 && remaining > 0 && (
                  <p style={{ color: "#fbbf24", fontSize: "0.75rem", fontWeight: 700, margin: "0.35rem 0 0" }}>
                    ⚡ Chỉ còn {remaining} slot!
                  </p>
                )}
              </div>
            ) : regState === "full" && !isEndedOrClosed ? (
              <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                <XCircle size={32} style={{ color: "#f87171", flexShrink: 0 }} />
                <div>
                  <p style={{ color: "#fff", fontWeight: 800, fontSize: "1rem", margin: "0 0 0.25rem" }}>
                    Đã đủ {detail.maxParticipants} người tham gia
                  </p>
                  <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.8125rem", margin: 0 }}>
                    Không còn slot trống.
                  </p>
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                <Clock size={32} style={{ color: "rgba(255,255,255,0.4)", flexShrink: 0 }} />
                <div>
                  <p style={{ color: "#fff", fontWeight: 800, fontSize: "1rem", margin: "0 0 0.25rem" }}>
                    {detail.status === "REGISTRATION_CLOSED" || detail.status === "DRAW_DONE" ? "Đã đóng đăng ký"
                      : detail.status === "IN_PROGRESS" ? "Giải đấu đang diễn ra"
                      : detail.status === "COMPLETED" ? "Giải đấu đã kết thúc"
                      : "Chưa mở đăng ký"}
                  </p>
                  <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.8125rem", margin: 0 }}>
                    {detail.isRegister ? "Đã đóng nhận đăng ký online" : "Giải đấu không nhận đăng ký online"}
                  </p>
                </div>
              </div>
            )}

            {/* Right: action buttons */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", flexShrink: 0 }}>
              {regState === "registered" && (
                <>
                  {myRegistration.status === "PENDING_PAYMENT" && (
                    <button type="button"
                      onClick={() => navigate("/player/registrations")}
                      style={{
                        padding: "0.65rem 1.75rem", borderRadius: "0.5rem",
                        background: "#EF342A", color: "#fff",
                        fontWeight: 800, fontSize: "0.875rem", border: "none",
                        cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem",
                        textTransform: "uppercase", letterSpacing: "0.06em",
                      }}>
                      <CreditCard size={15} /> Thanh toán ngay
                    </button>
                  )}
                  <button type="button"
                    onClick={() => navigate("/player/registrations")}
                    style={{
                      padding: "0.55rem 1.5rem", borderRadius: "0.5rem",
                      background: "rgba(255,255,255,0.1)", backdropFilter: "blur(4px)",
                      border: "1px solid rgba(255,255,255,0.2)",
                      color: "rgba(255,255,255,0.8)",
                      fontWeight: 600, fontSize: "0.8125rem", cursor: "pointer",
                    }}>
                    Xem đăng ký của tôi →
                  </button>
                </>
              )}

              {regState === "open" && (
                <button type="button"
                  onClick={() => navigate(`/player/tournaments/${tournamentId}/register`)}
                  style={{
                    padding: "0.85rem 2.5rem", borderRadius: "0.5rem",
                    background: "#EF342A", color: "#fff",
                    fontWeight: 800, fontSize: "0.9375rem", border: "none",
                    cursor: "pointer", display: "flex", alignItems: "center", gap: "0.6rem",
                    textTransform: "uppercase", letterSpacing: "0.06em",
                    boxShadow: "0 4px 20px rgba(239,52,42,0.4)",
                  }}>
                  {detail.entryFee && Number(detail.entryFee) > 0
                    ? "Đăng ký & Thanh toán"
                    : "Đăng ký tham dự"}
                  <ChevronRight size={16} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════
            DETAILS GRID (white cards below)
        ══════════════════════════════════════════ */}
        <div style={{ marginTop: "1.25rem", display: "flex", flexDirection: "column", gap: "1rem" }}>

          {/* Địa điểm tổ chức */}
          {detail.venue && (
            <div style={{ background: "var(--pd-card)", borderRadius: "1rem", border: "1px solid var(--pd-border)", padding: "1.5rem", boxShadow: "0 1px 3px rgba(15,23,42,0.06)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
                <span style={{ width: "3px", height: "1rem", background: "#0c1527", borderRadius: "2px" }} aria-hidden />
                <p style={{ fontWeight: 700, fontSize: "0.7rem", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em", margin: 0 }}>
                  Địa điểm tổ chức
                </p>
              </div>
              <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
                <div style={{ width: "2rem", height: "2rem", borderRadius: "0.5rem", background: "var(--pd-subtle)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <MapPin size={14} style={{ color: "var(--pd-heading)" }} />
                </div>
                <div>
                  <p style={{ fontSize: "0.9375rem", fontWeight: 700, color: "var(--pd-text)", margin: "0 0 0.25rem" }}>
                    {detail.venue.name}
                  </p>
                  <p style={{ fontSize: "0.8125rem", color: "#64748b", margin: 0 }}>{detail.venue.address}</p>
                  {detail.venue.phone && (
                    <p style={{ fontSize: "0.8125rem", color: "#64748b", margin: "0.25rem 0 0" }}>
                      SĐT: {detail.venue.phone}
                    </p>
                  )}
                </div>
              </div>
              {detail.venue.images?.length > 0 && (
                <div style={{ marginTop: "1rem", display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                  {detail.venue.images.map((img) => (
                    <img
                      key={img.id}
                      src={img.url}
                      alt=""
                      style={{ height: "5rem", width: "5rem", borderRadius: "0.625rem", objectFit: "cover", border: "1px solid var(--pd-border)" }}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Schedule */}
          <div style={{ background: "var(--pd-card)", borderRadius: "1rem", border: "1px solid var(--pd-border)", padding: "1.5rem", boxShadow: "0 1px 3px rgba(15,23,42,0.06)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
              <span style={{ width: "3px", height: "1rem", background: "#0c1527", borderRadius: "2px" }} aria-hidden />
              <p style={{ fontWeight: 700, fontSize: "0.7rem", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em", margin: 0 }}>
                Thời gian
              </p>
            </div>
            <div style={{ display: "grid", gap: "0.875rem" }}>
              {[
                { label: "Hạn đăng ký", value: fmtDateFull(detail.registrationDeadline), icon: Clock },
                { label: "Bắt đầu", value: fmtDateFull(detail.startAt), icon: Calendar },
                { label: "Kết thúc", value: fmtDateFull(detail.endAt), icon: Calendar },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
                  <div style={{ width: "2rem", height: "2rem", borderRadius: "0.5rem", background: "var(--pd-subtle)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Icon size={14} style={{ color: "var(--pd-heading)" }} />
                  </div>
                  <div>
                    <p style={{ fontSize: "0.7rem", color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", margin: "0 0 0.15rem" }}>{label}</p>
                    <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--pd-text)", margin: 0 }}>{value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Slots + Fee */}
          <div style={{ background: "var(--pd-card)", borderRadius: "1rem", border: "1px solid var(--pd-border)", padding: "1.5rem", boxShadow: "0 1px 3px rgba(15,23,42,0.06)" }}>
            {!isEndedOrClosed && (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
                  <span style={{ width: "3px", height: "1rem", background: "#0c1527", borderRadius: "2px" }} aria-hidden />
                  <p style={{ fontWeight: 700, fontSize: "0.7rem", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em", margin: 0 }}>
                    Người tham dự
                  </p>
                </div>
                <SlotBar approved={approved} max={detail.maxParticipants} />
              </>
            )}

            <div style={{ marginTop: "1.25rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              {[
                { label: "Phí tham dự", value: fmtCurrency(detail.entryFee), icon: CreditCard },
                { label: "Giải thưởng", value: fmtCurrency(detail.prizePool), icon: Trophy },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} style={{ padding: "0.75rem", borderRadius: "0.625rem", background: "var(--pd-subtle)", border: "1px solid var(--pd-border)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.3rem", color: "#94a3b8" }}>
                    <Icon size={11} />
                    <span style={{ fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</span>
                  </div>
                  <p style={{ fontWeight: 700, fontSize: "0.875rem", color: "var(--pd-heading)", margin: 0 }}>{value}</p>
                </div>
              ))}
            </div>

            {detail.prizeDescription && (
              <p style={{ marginTop: "0.75rem", fontSize: "0.75rem", color: "#64748b", lineHeight: 1.5, paddingTop: "0.75rem", borderTop: "1px solid var(--pd-border)" }}>
                {detail.prizeDescription}
              </p>
            )}
          </div>

          {/* Format / Config */}
          {(detail.configSummary || detail.formatName) && (
            <div style={{ background: "var(--pd-card)", borderRadius: "1rem", border: "1px solid var(--pd-border)", padding: "1.5rem", boxShadow: "0 1px 3px rgba(15,23,42,0.06)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
                <span style={{ width: "3px", height: "1rem", background: "#0c1527", borderRadius: "2px" }} aria-hidden />
                <p style={{ fontWeight: 700, fontSize: "0.7rem", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em", margin: 0 }}>
                  Thể thức thi đấu
                </p>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                {[
                  detail.formatName && { label: "Format", value: detail.formatName },
                  detail.participantType && { label: "Hình thức", value: participantLabel(detail.participantType) },
                  detail.configSummary?.seedingMethod && {
                    label: "Bốc thăm",
                    value: { RANDOM: "Ngẫu nhiên", ELO: "Theo ELO", MANUAL: "Thủ công" }[detail.configSummary.seedingMethod] || detail.configSummary.seedingMethod
                  },
                  detail.configSummary?.bracketSize != null && { label: "Bracket", value: `${detail.configSummary.bracketSize} slot` },
                  detail.configSummary?.finalRaceTo != null && { label: "Final", value: `Race to ${detail.configSummary.finalRaceTo}` },
                  detail.configSummary?.breakRule && {
                    label: "Break rule",
                    value: { ALTERNATE_BREAK: "Luân phiên", WINNER_BREAK: "Người thắng", LOSER_BREAK: "Người thua" }[detail.configSummary.breakRule] || detail.configSummary.breakRule
                  },
                  detail.configSummary?.thirdPlaceMatch != null && { label: "Tranh hạng 3", value: detail.configSummary.thirdPlaceMatch ? "Có" : "Không" },
                ].filter(Boolean).map(({ label, value }) => (
                  <div key={label} style={{ padding: "0.75rem", borderRadius: "0.625rem", background: "var(--pd-subtle)", border: "1px solid var(--pd-border)" }}>
                    <p style={{ fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", color: "#94a3b8", margin: "0 0 0.25rem" }}>{label}</p>
                    <p style={{ fontWeight: 700, fontSize: "0.875rem", color: "var(--pd-heading)", margin: 0 }}>{value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── If registration not available online ── */}
        {!detail.isRegister && detail.status !== "COMPLETED" && (
          <div style={{ marginTop: "1rem", background: "var(--pd-card)", borderRadius: "1rem", border: "1px solid var(--pd-border)", padding: "1.25rem 1.5rem", boxShadow: "0 1px 3px rgba(15,23,42,0.06)" }}>
            <p style={{ fontSize: "0.875rem", color: "#64748b", margin: 0 }}>
              <strong style={{ color: "var(--pd-text)" }}>Lưu ý:</strong> Giải đấu này không nhận đăng ký online. Vui lòng liên hệ Ban tổ chức để tham dự.
            </p>
          </div>
        )}

      </div>
    </div>
  );
};

export default PlayerTournamentDetailPage;
