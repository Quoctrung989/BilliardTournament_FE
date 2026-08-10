import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import {
  ArrowLeft, Calendar, Trophy, Gamepad2, Award,
  Info, List, Radio, BarChart2, UserCheck,
  CreditCard, Clock, CheckCircle2, XCircle, ChevronRight, Search, MapPin, Phone,
} from "lucide-react";
import MatchesTab, { apiMatchToComp, MatchRow } from "./MatchesTab";
import RankingTab from "./RankingTab";
import { getPublicTournamentDetail } from "../../api/publicTournamentApi";
import { getMyRegistrations } from "../../api/playerRegistrationApi";
import { listPublicParticipants } from "../../api/participantApi";
import { getPublicMatches } from "../../api/matchApi";
import { getApiErrorMessage } from "../../utils/apiError";
import { useAuthStore } from "../../store/authStore";
import { useTournamentSocket } from "../../hooks/useTournamentSocket";
import { useReveal } from "../../hooks/useReveal";
import { isMatchLive } from "../../utils/refereeMatch";
import "./eventTheme.css";

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

const fmtDate = (iso) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("vi-VN", {
    day: "2-digit", month: "short", year: "numeric",
  });
};

const fmtDateTime = (iso) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("vi-VN", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
};

const fmtCurrency = (v) => {
  if (v == null || Number(v) === 0) return "Miễn phí";
  return `${Number(v).toLocaleString("vi-VN")} đ`;
};

const participantLabel = (type) =>
  type === "SINGLE" ? "Đơn" : type === "DOUBLE" ? "Đôi" : type === "TEAM" ? "Đội" : type || "—";

/* ── Shared sub-components ── */
const InfoCol = ({ icon: Icon, label, value, border = true }) => (
  <div className={`flex flex-col gap-1 py-4 px-5 ${border ? "border-l border-slate-200 dark:border-white/10 first:border-l-0" : ""}`}>
    <div className="flex items-center gap-1.5 text-slate-400 text-xs font-semibold uppercase tracking-wide">
      <Icon size={12} /> {label}
    </div>
    <p className="text-slate-800 dark:text-white font-semibold text-sm">{value}</p>
  </div>
);

const SlotBar = ({ approved, max }) => {
  const pct = max > 0 ? Math.min(100, (approved / max) * 100) : 0;
  const remaining = Math.max(0, max - approved);
  const full = remaining === 0;
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs">
        <span className="text-slate-500 dark:text-white/70">Đã đăng ký</span>
        <span className={`font-semibold ${full ? "text-red-600 dark:text-red-400" : remaining <= 3 ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"}`}>
          {full ? "Đã đủ người" : `Còn ${remaining} slot`}
        </span>
      </div>
      <div className="h-2 bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${full ? "bg-red-500" : remaining <= 3 ? "bg-amber-400" : "bg-emerald-400"}`}
          style={{ width: `${pct}%` }} />
      </div>
      <p className="text-xs text-slate-400 dark:text-white/50">{approved} / {max} người</p>
    </div>
  );
};

/* ── Tabs ── */
const TABS = [
  { id: "info",    label: "Thông tin", Icon: Info      },
  { id: "players", label: "Cơ thủ",   Icon: UserCheck },
  { id: "matches", label: "Trận đấu", Icon: List      },
  { id: "live",    label: "Trực tiếp", Icon: Radio, live: true },
  { id: "ranking", label: "Xếp hạng", Icon: BarChart2 },
];

/* ── Info tab ── */
const REG_STATUS_TEXT = {
  PENDING_PAYMENT: "Chờ thanh toán",
  PAID: "Đã thanh toán",
  APPROVED: "Tham gia chính thức",
  REJECTED: "Không được tham dự",
  CANCELLED: "Đã hủy",
};

const InfoTab = ({ t, onRegister, myRegistration, isPlayer, isAuthenticated }) => {
  const infoRef = useReveal({ threshold: 0 });
  const navigate = useNavigate();
  const approved = t.approvedCount ?? 0;
  const remaining = t.remainingSlots ?? Math.max(0, (t.maxParticipants ?? 0) - approved);
  const isFull = remaining <= 0 && (t.maxParticipants ?? 0) > 0;
  const alreadyRegistered = Boolean(myRegistration);
  const canRegister = t.status === "OPEN_FOR_REGISTRATION" && t.isRegister && !isFull && !alreadyRegistered && isPlayer;

  const regState = alreadyRegistered ? "registered"
    : canRegister ? "open"
    : isFull ? "full"
    : "closed";
  const isEndedOrClosed = t.status === "COMPLETED" || t.status === "REGISTRATION_CLOSED"
    || t.status === "DRAW_DONE" || t.status === "IN_PROGRESS" || t.status === "CANCELLED";

  return (
    <div ref={infoRef} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>

      {/* Registration CTA banner */}
      <div className="ui-stagger" style={{ "--i": 0,
        borderRadius: "1rem", overflow: "hidden", position: "relative",
        background: regState === "registered"
          ? "linear-gradient(135deg, #064e3b 0%, #065f46 100%)"
          : regState === "open"
          ? "linear-gradient(135deg, #010851 0%, #0d1f3c 100%)"
          : "linear-gradient(135deg, #1e293b 0%, #334155 100%)",
        minHeight: "100px",
      }}>
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }} />
        <div style={{
          position: "relative", display: "flex", alignItems: "center",
          justifyContent: "space-between", padding: "1.5rem 2rem", gap: "1.5rem", flexWrap: "wrap",
        }}>
          {/* Left */}
          {regState === "registered" ? (
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <CheckCircle2 size={32} style={{ color: "#34d399", flexShrink: 0 }} />
              <div>
                <p style={{ color: "#fff", fontWeight: 800, fontSize: "1rem", margin: "0 0 0.2rem", textTransform: "uppercase", letterSpacing: "0.03em" }}>
                  Bạn đã đăng ký giải này
                </p>
                <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.8rem", margin: 0 }}>
                  Trạng thái: <strong style={{ color: "#6ee7b7" }}>
                    {REG_STATUS_TEXT[myRegistration.status] || myRegistration.status}
                  </strong>
                </p>
              </div>
            </div>
          ) : regState === "open" ? (
            <div>
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 0.3rem" }}>
                Phí tham dự
              </p>
              <p style={{ color: "#fff", fontWeight: 900, fontSize: "1.6rem", letterSpacing: "-0.03em", margin: 0, lineHeight: 1 }}>
                {fmtCurrency(t.entryFee)}
              </p>
              {remaining <= 5 && remaining > 0 && (
                <p style={{ color: "#fbbf24", fontSize: "0.75rem", fontWeight: 700, margin: "0.3rem 0 0" }}>
                  ⚡ Chỉ còn {remaining} slot!
                </p>
              )}
            </div>
          ) : regState === "full" && !isEndedOrClosed ? (
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <XCircle size={28} style={{ color: "#f87171", flexShrink: 0 }} />
              <div>
                <p style={{ color: "#fff", fontWeight: 800, fontSize: "1rem", margin: "0 0 0.2rem" }}>
                  Đã đủ {t.maxParticipants} người tham gia
                </p>
                <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.8rem", margin: 0 }}>Không còn slot trống.</p>
              </div>
            </div>
          ) : !isAuthenticated ? (
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <Info size={28} style={{ color: "rgba(255,255,255,0.4)", flexShrink: 0 }} />
              <p style={{ color: "#fff", fontWeight: 700, fontSize: "0.95rem", margin: 0 }}>
                Đăng nhập để đăng ký tham dự giải đấu
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <Clock size={28} style={{ color: "rgba(255,255,255,0.4)", flexShrink: 0 }} />
              <div>
                <p style={{ color: "#fff", fontWeight: 800, fontSize: "1rem", margin: "0 0 0.2rem" }}>
                  {t.status === "REGISTRATION_CLOSED" || t.status === "DRAW_DONE" ? "Đã đóng đăng ký"
                    : t.status === "IN_PROGRESS" ? "Giải đấu đang diễn ra"
                    : t.status === "COMPLETED" ? "Giải đấu đã kết thúc"
                    : "Chưa mở đăng ký"}
                </p>
                <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.8rem", margin: 0 }}>
                  {t.isRegister ? "Đã đóng nhận đăng ký online" : "Giải đấu không nhận đăng ký online"}
                </p>
              </div>
            </div>
          )}

          {/* Right: action buttons */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", flexShrink: 0 }}>
            {regState === "registered" && (
              <>
                {myRegistration.status === "PENDING_PAYMENT" && (
                  <button type="button" className="ui-press" onClick={() => navigate("/player/registrations")}
                    style={{
                      padding: "0.6rem 1.5rem", borderRadius: "0.5rem",
                      background: "#EF342A", color: "#fff",
                      fontWeight: 800, fontSize: "0.875rem", border: "none",
                      cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem",
                      textTransform: "uppercase", letterSpacing: "0.06em",
                    }}>
                    <CreditCard size={14} /> Thanh toán ngay
                  </button>
                )}
                <button type="button" className="ui-press" onClick={() => navigate("/player/registrations")}
                  style={{
                    padding: "0.5rem 1.25rem", borderRadius: "0.5rem",
                    background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)",
                    color: "rgba(255,255,255,0.8)", fontWeight: 600, fontSize: "0.8rem", cursor: "pointer",
                  }}>
                  Xem đăng ký của tôi →
                </button>
              </>
            )}
            {regState === "open" && (
              <button type="button" className="ui-press" onClick={onRegister}
                style={{
                  padding: "0.8rem 2rem", borderRadius: "0.5rem",
                  background: "#EF342A", color: "#fff",
                  fontWeight: 800, fontSize: "0.9rem", border: "none",
                  cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem",
                  textTransform: "uppercase", letterSpacing: "0.06em",
                  boxShadow: "0 4px 20px rgba(239,52,42,0.4)",
                }}>
                {t.entryFee && Number(t.entryFee) > 0 ? "Đăng ký & Thanh toán" : "Đăng ký tham dự"}
                <ChevronRight size={15} />
              </button>
            )}
            {regState === "closed" && !isAuthenticated && (
              <button type="button" className="ui-press" onClick={() => navigate("/login")}
                style={{
                  padding: "0.7rem 1.75rem", borderRadius: "0.5rem",
                  background: "#EF342A", color: "#fff",
                  fontWeight: 800, fontSize: "0.875rem", border: "none",
                  cursor: "pointer", textTransform: "uppercase", letterSpacing: "0.06em",
                }}>
                Đăng nhập
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Schedule card */}
      <div className="ui-stagger" style={{ "--i": 1, background: "var(--evt-card-bg)", borderRadius: "1rem", border: "1px solid var(--evt-card-border)", padding: "1.5rem", boxShadow: "0 1px 3px rgba(15,23,42,0.06)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
          <span style={{ width: "3px", height: "1rem", background: "var(--evt-accent)", borderRadius: "2px" }} aria-hidden />
          <p style={{ fontWeight: 700, fontSize: "0.7rem", color: "var(--evt-text-3)", textTransform: "uppercase", letterSpacing: "0.08em", margin: 0 }}>
            Thời gian
          </p>
        </div>
        <div style={{ display: "grid", gap: "0.875rem" }}>
          {[
            { label: "Hạn đăng ký", value: fmtDateTime(t.registrationDeadline), icon: Clock },
            { label: "Bắt đầu", value: fmtDateTime(t.startAt), icon: Calendar },
            { label: "Kết thúc", value: fmtDateTime(t.endAt), icon: Calendar },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
              <div style={{ width: "2rem", height: "2rem", borderRadius: "0.5rem", background: "var(--evt-subtle)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Icon size={14} style={{ color: "var(--evt-heading)" }} />
              </div>
              <div>
                <p style={{ fontSize: "0.7rem", color: "var(--evt-text-4)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", margin: "0 0 0.15rem" }}>{label}</p>
                <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--evt-text)", margin: 0 }}>{value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Organizing branch card */}
      {t.venue && (
        <div className="ui-stagger" style={{ "--i": 2, background: "var(--evt-card-bg)", borderRadius: "1rem", border: "1px solid var(--evt-card-border)", padding: "1.5rem", boxShadow: "0 1px 3px rgba(15,23,42,0.06)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
            <span style={{ width: "3px", height: "1rem", background: "var(--evt-accent)", borderRadius: "2px" }} aria-hidden />
            <p style={{ fontWeight: 700, fontSize: "0.7rem", color: "var(--evt-text-3)", textTransform: "uppercase", letterSpacing: "0.08em", margin: 0 }}>
              Chi nhánh tổ chức
            </p>
          </div>
          <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start", flexWrap: "wrap" }}>
            {t.venue.images?.[0]?.url && (
              <img
                src={t.venue.images[0].url}
                alt={t.venue.name}
                style={{ width: "72px", height: "72px", borderRadius: "0.75rem", objectFit: "cover", flexShrink: 0, border: "1px solid var(--evt-card-border)" }}
              />
            )}
            <div style={{ flex: 1, minWidth: "180px", display: "grid", gap: "0.6rem" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: "0.6rem" }}>
                <MapPin size={15} style={{ color: "var(--evt-accent)", marginTop: "0.15rem", flexShrink: 0 }} />
                <div>
                  <p style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--evt-heading)", margin: 0 }}>{t.venue.name}</p>
                  {t.venue.address && (
                    <p style={{ fontSize: "0.8125rem", color: "var(--evt-text-3)", margin: "0.15rem 0 0" }}>{t.venue.address}</p>
                  )}
                </div>
              </div>
              {t.venue.phone && (
                <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                  <Phone size={14} style={{ color: "var(--evt-text-4)", flexShrink: 0 }} />
                  <p style={{ fontSize: "0.8125rem", color: "var(--evt-text-2)", margin: 0 }}>{t.venue.phone}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Participants + Fee card */}
      <div className="ui-stagger" style={{ "--i": 3, background: "var(--evt-card-bg)", borderRadius: "1rem", border: "1px solid var(--evt-card-border)", padding: "1.5rem", boxShadow: "0 1px 3px rgba(15,23,42,0.06)" }}>
        {!isEndedOrClosed && (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
              <span style={{ width: "3px", height: "1rem", background: "var(--evt-accent)", borderRadius: "2px" }} aria-hidden />
              <p style={{ fontWeight: 700, fontSize: "0.7rem", color: "var(--evt-text-3)", textTransform: "uppercase", letterSpacing: "0.08em", margin: 0 }}>
                Người tham dự
              </p>
            </div>
            {(t.maxParticipants ?? 0) > 0 && <SlotBar approved={approved} max={t.maxParticipants} />}
          </>
        )}
        <div style={{ marginTop: "1.25rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
          {[
            // Đỏ cho khoản phải trả, vàng cho khoản nhận được — hai ô cạnh nhau
            // nên màu là thứ phân biệt nhanh hơn đọc nhãn.
            { label: "Phí tham dự", value: fmtCurrency(t.entryFee), icon: CreditCard, tone: "var(--evt-fee)" },
            { label: "Giải thưởng", value: fmtCurrency(t.prizePool), icon: Trophy, tone: "var(--evt-prize)" },
          ].map(({ label, value, icon: Icon, tone }) => (
            <div key={label} style={{ padding: "0.75rem", borderRadius: "0.625rem", background: "var(--evt-box-bg)", border: "1px solid var(--evt-card-border)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.4rem" }}>
                <span
                  style={{
                    width: "1.65rem", height: "1.65rem", borderRadius: "0.5rem",
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                    background: `color-mix(in srgb, ${tone} 18%, transparent)`,
                    border: `1px solid color-mix(in srgb, ${tone} 35%, transparent)`,
                    color: tone, flexShrink: 0,
                  }}
                >
                  <Icon size={14} />
                </span>
                <span style={{ fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--evt-text-4)" }}>{label}</span>
              </div>
              <p style={{ fontWeight: 800, fontSize: "0.95rem", color: tone, margin: 0 }}>{value}</p>
            </div>
          ))}
        </div>
        {t.prizeDescription && (
          <p style={{ marginTop: "0.75rem", fontSize: "0.75rem", color: "var(--evt-text-3)", lineHeight: 1.5, paddingTop: "0.75rem", borderTop: "1px solid var(--evt-subtle)" }}>
            {t.prizeDescription}
          </p>
        )}
      </div>

      {/* Format / Config card */}
      {(t.configSummary || t.formatName) && (
        <div className="ui-stagger" style={{ "--i": 4, background: "var(--evt-card-bg)", borderRadius: "1rem", border: "1px solid var(--evt-card-border)", padding: "1.5rem", boxShadow: "0 1px 3px rgba(15,23,42,0.06)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
            <span style={{ width: "3px", height: "1rem", background: "var(--evt-accent)", borderRadius: "2px" }} aria-hidden />
            <p style={{ fontWeight: 700, fontSize: "0.7rem", color: "var(--evt-text-3)", textTransform: "uppercase", letterSpacing: "0.08em", margin: 0 }}>
              Thể thức thi đấu
            </p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            {[
              t.formatName && { label: "Format", value: t.formatName },
              t.participantType && { label: "Hình thức", value: participantLabel(t.participantType) },
              t.configSummary?.seedingMethod && {
                label: "Bốc thăm",
                value: { RANDOM: "Ngẫu nhiên", RANK: "Theo hạng cơ thủ" }[t.configSummary.seedingMethod] || t.configSummary.seedingMethod,
              },
              t.configSummary?.bracketSize != null && { label: "Số người tối đa", value: `${t.configSummary.bracketSize} người` },
              t.configSummary?.finalRaceTo != null && { label: "Chung kết", value: `Đánh tới ${t.configSummary.finalRaceTo} ván` },
              t.configSummary?.breakRule && {
                label: "Luật giao bóng",
                value: { ALTERNATE_BREAK: "Luân phiên", WINNER_BREAK: "Người thắng", LOSER_BREAK: "Người thua" }[t.configSummary.breakRule] || t.configSummary.breakRule,
              },
              t.configSummary?.thirdPlaceMatch != null && { label: "Tranh hạng 3", value: t.configSummary.thirdPlaceMatch ? "Có" : "Không" },
            ].filter(Boolean).map(({ label, value }) => (
              <div key={label} style={{ padding: "0.75rem", borderRadius: "0.625rem", background: "var(--evt-box-bg)", border: "1px solid var(--evt-card-border)" }}>
                <p style={{ fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--evt-text-4)", margin: "0 0 0.25rem" }}>{label}</p>
                <p style={{ fontWeight: 700, fontSize: "0.875rem", color: "var(--evt-heading)", margin: 0 }}>{value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Description card */}
      {t.description && (
        <div className="ui-stagger" style={{ "--i": 5, background: "var(--evt-card-bg)", borderRadius: "1rem", border: "1px solid var(--evt-card-border)", padding: "1.5rem", boxShadow: "0 1px 3px rgba(15,23,42,0.06)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
            <span style={{ width: "3px", height: "1rem", background: "var(--evt-accent)", borderRadius: "2px" }} aria-hidden />
            <p style={{ fontWeight: 700, fontSize: "0.7rem", color: "var(--evt-text-3)", textTransform: "uppercase", letterSpacing: "0.08em", margin: 0 }}>
              Giới thiệu
            </p>
          </div>
          <p style={{ fontSize: "0.875rem", color: "var(--evt-text-2)", lineHeight: 1.7, margin: 0 }}>{t.description}</p>
        </div>
      )}
    </div>
  );
};

const DEFAULT_AVATAR = "/player-default.webp";

/* ── Players tab ── */
const PlayersTab = ({ participants }) => {
  const playersRef = useReveal({ threshold: 0.05 });
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const filtered = participants.filter(
    (p) => !search || p.displayName?.toLowerCase().includes(search.toLowerCase()) || p.phone?.includes(search)
  );

  return (
    <div className="evt-surface" style={{ position: "relative", paddingTop: "1.25rem" }}>
        <div style={{
          position: "absolute", top: 0, left: "50%",
          transform: "translateX(-50%)", zIndex: 10,
          width: "min(560px, calc(100% - 4rem))",
          background: "linear-gradient(180deg, #0d1b2e 0%, #152842 100%)",
          borderRadius: "0 0 0.75rem 0.75rem",
          padding: "0.7rem 2.5rem",
          boxShadow: "0 4px 16px rgba(13,27,46,0.25)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <span style={{
            fontFamily: "var(--evt-font)",
            color: "#fff", fontWeight: 700,
            fontSize: "0.78rem", letterSpacing: "0.1em", textTransform: "uppercase",
            whiteSpace: "nowrap",
          }}>
            Danh sách cơ thủ tham gia
          </span>
        </div>

        <div style={{
          background: "var(--evt-card-bg)", borderRadius: "1rem", overflow: "hidden",
          border: "1px solid var(--evt-card-border)",
          boxShadow: "0 6px 28px rgba(10,22,40,0.07)",
        }}>
          <div style={{ padding: "2.75rem 1.5rem 0.75rem", display: "flex", justifyContent: "flex-end" }}>
            <div style={{ position: "relative", width: "100%", maxWidth: "220px" }}>
              <input
                type="text"
                placeholder="Tìm cơ thủ..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  width: "100%", background: "var(--evt-box-bg)", border: "1px solid var(--evt-card-border)",
                  borderRadius: "999px", padding: "0.5rem 0.9rem 0.5rem 2rem",
                  fontFamily: "var(--evt-font)", fontSize: "0.8125rem", outline: "none",
                  boxSizing: "border-box", color: "var(--evt-text)",
                }}
              />
              <Search
                size={13}
                style={{ position: "absolute", left: "0.7rem", top: "50%", transform: "translateY(-50%)", color: "var(--evt-text-4)", pointerEvents: "none" }}
              />
            </div>
          </div>

          {filtered.length === 0 ? (
            <div style={{
              textAlign: "center", padding: "3.5rem 1.5rem 4rem",
              color: "var(--evt-text-4)", fontSize: "0.875rem", fontFamily: "var(--evt-font)",
            }}>
              {participants.length === 0 ? "Danh sách cơ thủ chưa được công bố" : "Không tìm thấy cơ thủ"}
            </div>
          ) : (
            <div ref={playersRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1 mx-2 mb-4">
              {filtered.map((p, pi) => (
                <div key={p.id} className="ui-stagger flex" style={{ "--i": Math.min(pi, 11) }}>
                  <button
                    type="button"
                    onClick={() => navigate(p.userId ? `/event/players/user/${p.userId}` : `/event/players/${p.id}`)}
                    className="ui-row w-full flex items-center gap-3.5 px-4 py-5 cursor-pointer bg-transparent border border-transparent text-left rounded-2xl hover:bg-[#f8f9fb] dark:hover:bg-white/5"
                    style={{ fontFamily: "var(--evt-font)" }}
                  >
                    <img
                      src={p.avatarUrl || p.avtarUrl || DEFAULT_AVATAR}
                      alt={p.displayName}
                      onError={(e) => { e.currentTarget.src = DEFAULT_AVATAR; }}
                      style={{
                        width: "56px", height: "72px", objectFit: "cover",
                        objectPosition: "top center", flexShrink: 0, borderRadius: "8px",
                      }}
                    />

                    <div style={{ minWidth: 0, flex: 1 }}>
                      <p className="evt-player-name" title={p.displayName}>{p.displayName}</p>
                      <p className="evt-meta">
                        <span style={{ fontSize: "0.75rem", lineHeight: 1 }}>🇻🇳</span>
                        Việt Nam
                      </p>
                    </div>
                  </button>
                </div>
              ))}
            </div>
          )}

          {filtered.length > 0 && (
            <div style={{
              padding: "0.5rem 1.5rem 1rem", textAlign: "right",
              fontSize: "0.75rem", fontWeight: 500, color: "var(--evt-text-4)",
              fontFamily: "var(--evt-font)",
            }}>
              {filtered.length} / {participants.length} cơ thủ
            </div>
          )}
        </div>
    </div>
  );
};

/* ── Live tab — trận đang IN_PROGRESS được websocket đẩy vào, tự remove khi kết thúc ── */
const LiveTab = ({ tournamentId }) => {
  const [matchMap, setMatchMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [flashIds, setFlashIds] = useState(() => new Set());
  const flashTimers = useRef({});

  const upsertMatch = useCallback((m) => {
    if (m?.id == null) return;
    setMatchMap((prev) => ({ ...prev, [m.id]: m }));

    const sid = String(m.id);
    setFlashIds((prev) => { const s = new Set(prev); s.add(sid); return s; });
    clearTimeout(flashTimers.current[sid]);
    flashTimers.current[sid] = setTimeout(() => {
      setFlashIds((prev) => { const s = new Set(prev); s.delete(sid); return s; });
    }, 1500);
  }, []);

  const applyBracketSync = useCallback((matches) => {
    if (!Array.isArray(matches)) return;
    setMatchMap((prev) => {
      const next = { ...prev };
      matches.forEach((m) => { if (m?.id != null) next[m.id] = m; });
      return next;
    });
  }, []);

  const load = useCallback(async () => {
    if (!tournamentId) { setLoading(false); return; }
    setLoading(true);
    try {
      const matches = await getPublicMatches(tournamentId);
      const map = {};
      (matches || []).forEach((m) => { if (m?.id != null) map[m.id] = m; });
      setMatchMap(map);
    } catch { setMatchMap({}); }
    finally { setLoading(false); }
  }, [tournamentId]);

  useEffect(() => { load(); }, [load]);

  useTournamentSocket(tournamentId, {
    onMatchUpdate: upsertMatch,
    onBracketSync: applyBracketSync,
    onReconnect: load,
  });

  /* Chỉ giữ lại trận đang IN_PROGRESS — trận vừa COMPLETED/WALKOVER sẽ tự biến mất khỏi danh sách này. */
  const liveMatches = useMemo(() => {
    return Object.values(matchMap)
      .filter((m) => isMatchLive(m.status))
      .sort((a, b) => (a.tableNo ?? 9999) - (b.tableNo ?? 9999) || (a.id ?? 0) - (b.id ?? 0));
  }, [matchMap]);

  if (loading) {
    return <p className="text-center py-16 text-sm text-slate-400 dark:text-white/40">Đang tải...</p>;
  }

  if (!liveMatches.length) {
    return (
      <div className="rounded-3xl overflow-hidden shadow-sm flex flex-col items-center justify-center py-20 gap-2"
           style={{ background: "var(--evt-card-bg)", border: "1px solid var(--evt-card-border)" }}>
        <Radio size={28} className="text-slate-300 dark:text-white/15" />
        <p className="text-slate-400 dark:text-white/40 text-sm font-light">Hiện không có trận nào đang diễn ra</p>
      </div>
    );
  }

  return (
    <div className="rounded-3xl overflow-hidden shadow-sm"
         style={{ background: "var(--evt-card-bg)", border: "1px solid var(--evt-card-border)" }}>
      <div className="flex items-center justify-between px-5 py-2.5"
           style={{ background: "linear-gradient(135deg,#9b1c1c 0%,#7f1616 100%)" }}>
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
          <span className="text-xs font-semibold text-white tracking-wide">Đang diễn ra</span>
        </div>
        <span className="text-[10px] font-light text-white/70">{liveMatches.length} trận</span>
      </div>
      <div>
        {liveMatches.map((m) => (
          <MatchRow key={m.id} m={apiMatchToComp(m)} showRefs={false} flashIds={flashIds} />
        ))}
      </div>
    </div>
  );
};

/* ── Page ── */
const EventDetailPage = () => {
  const { id }         = useParams();
  const navigate       = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "info");
  const [tournament, setTournament] = useState(null);
  const [loading, setLoading]       = useState(true);
  const [myRegistration, setMyRegistration] = useState(null);
  const [participants, setParticipants]      = useState([]);
  const fallbackBanner = bannerFor(id);
  const { isAuthenticated, user } = useAuthStore();
  const isPlayer = isAuthenticated && user?.role === "PLAYER";

  /* Đổi tab + lưu vào URL (?tab=) để khi mở info cơ thủ rồi Quay lại vẫn về đúng tab */
  const changeTab = useCallback((id) => {
    setActiveTab(id);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (id === "info") next.delete("tab");
      else next.set("tab", id);
      return next;
    }, { replace: true });
  }, [setSearchParams]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [data, parts] = await Promise.all([
        getPublicTournamentDetail(Number(id)),
        listPublicParticipants(Number(id)).catch(() => []),
      ]);
      setTournament(data);
      // Hiện toàn bộ cơ thủ đã tham gia (kể cả những người đã bị loại ở các giai đoạn vòng tròn
      // loại dần — status INACTIVE), chỉ ẩn người đã rút lui đăng ký (WITHDRAWN).
      setParticipants(Array.isArray(parts) ? parts.filter((p) => p.status !== "WITHDRAWN") : []);
      if (isPlayer) {
        const allMyRegs = await getMyRegistrations({ page: 0, size: 100 }).catch(() => ({ content: [] }));
        const found = allMyRegs.content?.find((r) => r.tournamentId === Number(id)) ?? null;
        setMyRegistration(found);
      }
    } catch (err) {
      toast.error(getApiErrorMessage(err));
      navigate("/event");
    } finally {
      setLoading(false);
    }
  }, [id, navigate, isPlayer]);

  useEffect(() => { if (id) load(); }, [id, load]);

  /* Cuộn về đầu trang khi vào trang / đổi tab / tải xong.
     Tắt scrollRestoration để F5 không bị trình duyệt kéo về vị trí cuộn cũ (cuối trang). */
  useEffect(() => {
    if ("scrollRestoration" in window.history) window.history.scrollRestoration = "manual";
    window.scrollTo(0, 0);
  }, [id, activeTab, loading]);

  if (loading) {
    return (
      <div style={{ background: "#0c1527", minHeight: "50vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.875rem" }}>Đang tải...</p>
      </div>
    );
  }

  if (!tournament) return null;

  const isLive = tournament.status === "IN_PROGRESS";
  const matchesLocked = tournament.status === "OPEN_FOR_REGISTRATION";
  const handleRegister = () => navigate(`/player/tournaments/${id}/register`);
  const showInfoCard = !["players", "matches", "ranking"].includes(activeTab);

  const tournamentShim = {
    ...tournament,
    players: [], prizes: [],
    prizeFund: tournament.prizePool ? Number(tournament.prizePool) : null,
    image: tournament.thumbnailUrl || fallbackBanner,
    typeBadge: tournament.gameType, bracketType: "single_elimination",
  };

  return (
    <div style={{ background: "var(--evt-page-bg)", minHeight: "100vh", paddingBottom: "7rem" }}>

      {/* ── Hero banner (only on info / live) ── */}
      {showInfoCard ? (
        <div style={{ position: "relative", width: "100%", height: "300px", overflow: "hidden" }}>
          <img
            src={tournament.thumbnailUrl || fallbackBanner}
            alt=""
            onError={(e) => { e.currentTarget.src = fallbackBanner; }}
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" }}
          />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(12,21,39,0.55) 0%, rgba(12,21,39,0.25) 50%, rgba(232,232,232,0.15) 100%)" }} />

          {/* Back button */}
          <button type="button" className="ui-press" onClick={() => navigate("/event")}
            style={{
              position: "absolute", top: "1.25rem", left: "1.5rem",
              display: "flex", alignItems: "center", gap: "0.5rem",
              background: "rgba(255,255,255,0.1)", backdropFilter: "blur(8px)",
              border: "1px solid rgba(255,255,255,0.2)", borderRadius: "100px",
              padding: "0.4rem 0.9rem", color: "rgba(255,255,255,0.85)",
              fontSize: "0.8125rem", fontWeight: 600, cursor: "pointer",
            }}>
            <ArrowLeft size={14} /> Giải đấu
          </button>

          {/* Live indicator */}
          {isLive && (
            <button type="button" className="ui-press" onClick={() => changeTab("live")}
              style={{
                position: "absolute", top: "1.25rem", right: "1.5rem",
                display: "flex", alignItems: "center", gap: "0.4rem",
                background: "#ef342a", color: "#fff",
                fontSize: "0.625rem", fontWeight: 700, letterSpacing: "0.08em",
                padding: "0.4rem 0.85rem", borderRadius: "100px",
                border: "none", cursor: "pointer",
              }}>
              <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#fff", animation: "pulse 1.5s infinite" }} />
              Trực tiếp
            </button>
          )}
        </div>
      ) : (
        /* Slim back bar when banner is hidden */
        <div style={{ maxWidth: "min(1472px, calc(100% - 8rem))", margin: "0 auto", paddingTop: "1.25rem" }}>
          <button type="button" className="ui-press" onClick={() => navigate("/event")}
            style={{
              display: "inline-flex", alignItems: "center", gap: "0.5rem",
              background: "#fff", border: "1px solid #e2e8f0", borderRadius: "100px",
              padding: "0.4rem 0.9rem", color: "#0d1b2e",
              fontSize: "0.8125rem", fontWeight: 600, cursor: "pointer",
              boxShadow: "0 1px 3px rgba(15,23,42,0.06)",
            }}>
            <ArrowLeft size={14} /> Giải đấu
          </button>
        </div>
      )}

      {/* ── Floating info card ── */}
      <div style={{ position: "relative", zIndex: 10, maxWidth: "min(1472px, calc(100% - 8rem))", margin: showInfoCard ? "-60px auto 0" : "1rem auto 0" }}>
        {showInfoCard && (
          <div style={{
            background: "var(--evt-card-bg)", border: "1px solid var(--evt-card-border)", borderRadius: "1.25rem",
            boxShadow: "0 10px 40px rgba(0,0,0,0.15), 0 2px 8px rgba(0,0,0,0.08)",
            position: "relative", overflow: "visible",
          }}>
            {/* Floating pill */}
            <div style={{
              position: "absolute", top: 0, left: "50%",
              transform: "translate(-50%, -50%)",
              background: "#0c1527", borderRadius: "100px",
              padding: "0.55rem 2rem",
              display: "flex", alignItems: "center", gap: "0.75rem",
              whiteSpace: "nowrap", boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
            }}>
              <span style={{ width: "3px", height: "1rem", background: "rgba(255,255,255,0.8)", borderRadius: "2px", flexShrink: 0 }} aria-hidden />
              <span style={{ color: "#fff", fontWeight: 700, fontSize: "0.7rem", letterSpacing: "0.12em", textTransform: "uppercase" }}>
                Thông tin giải đấu
              </span>
            </div>

            {/* Tournament name */}
            <div style={{ textAlign: "center", padding: "2.5rem 2rem 1.5rem" }}>
              <h1 style={{
                fontWeight: 900, fontSize: "clamp(1.25rem, 3vw, 1.875rem)",
                color: "var(--evt-heading)", fontStyle: "italic",
                textTransform: "uppercase", letterSpacing: "-0.01em",
                lineHeight: 1.25, margin: 0,
              }}>
                {tournament.name}
              </h1>
            </div>

            {/* 4-column info bar */}
            <div style={{ borderTop: "1px solid var(--evt-card-border)", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))" }}>
              <InfoCol icon={Calendar} label="Ngày diễn ra"
                value={`${fmtDate(tournament.startAt)} – ${fmtDate(tournament.endAt)}`} />
              <InfoCol icon={Gamepad2} label="Loại bi"
                value={tournament.gameType || "—"} />
              <InfoCol icon={Award} label="Thể thức"
                value={`${tournament.formatName || tournament.format || "—"} · ${participantLabel(tournament.participantType)}`} />
              <InfoCol icon={Trophy} label="Tổng giải thưởng"
                value={fmtCurrency(tournament.prizePool)} />
            </div>
          </div>
        )}

        {/* ── Tab content ── */}
        <div style={{ marginTop: showInfoCard ? "1.5rem" : 0 }}>
          {activeTab === "info" && (
            <InfoTab
              t={tournament}
              onRegister={handleRegister}
              myRegistration={myRegistration}
              isPlayer={isPlayer}
              isAuthenticated={isAuthenticated}
            />
          )}
          {activeTab === "players" && <PlayersTab participants={participants} />}
          {activeTab === "matches" && tournament?.isPublicRatio && <MatchesTab tournament={tournamentShim} />}
          {activeTab === "live"    && tournament?.isPublicRatio && <LiveTab tournamentId={Number(id)} />}
          {activeTab === "ranking" && tournament?.isPublicRatio && <RankingTab tournament={tournamentShim} />}
        </div>
      </div>

      {/* ── Fixed bottom tab nav (original) ── */}
      <div className="fixed bottom-5 left-0 right-0 z-50 flex justify-center px-6">
        <div className="flex gap-1 p-1.5 rounded-2xl shadow-xl w-full max-w-lg"
          style={{ background: "rgba(13,27,46,0.95)", backdropFilter: "blur(12px)" }}>
          {TABS.filter((tab) => {
            if (!tournament?.isPublicRatio && (tab.id === "matches" || tab.id === "live" || tab.id === "ranking")) return false;
            return true;
          }).map((tab) => {
            const isActive   = activeTab === tab.id;
            const isDisabled = tab.id === "matches" && matchesLocked;
            return (
              <button key={tab.id} type="button"
                onClick={() => !isDisabled && changeTab(tab.id)}
                disabled={isDisabled}
                title={isDisabled ? "Lịch thi đấu chưa được xếp" : undefined}
                className={`flex-1 flex flex-col items-center justify-center gap-1 py-2.5 rounded-xl transition-all duration-200 ${
                  isDisabled ? "text-white/15 cursor-not-allowed"
                  : isActive  ? "bg-white text-[#0d1b2e]"
                  : "text-white/50 hover:text-white/80"
                }`}>
                <span className="relative">
                  <tab.Icon size={16} strokeWidth={isActive ? 2 : 1.5} />
                  {tab.live && isLive && (
                    <span className={`absolute -top-0.5 -right-1.5 w-1.5 h-1.5 rounded-full bg-[#ef342a] border ${isActive ? "border-white" : "border-[#0d1b2e]"}`} />
                  )}
                </span>
                <span className={`text-[10px] leading-none ${isActive ? "font-semibold" : "font-light"}`}>
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default EventDetailPage;
