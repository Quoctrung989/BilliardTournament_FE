import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import {
  Calendar, DollarSign,
  ArrowLeft, Info, List, Radio, BarChart2, Trophy, Users, CreditCard, UserCheck, Monitor, X,
} from "lucide-react";
import MatchesTab from "./MatchesTab";
import RankingTab from "./RankingTab";
import { getPublicTournamentDetail } from "../../api/publicTournamentApi";
import { getMyRegistrations } from "../../api/playerRegistrationApi";
import { listPublicParticipants } from "../../api/participantApi";
import { getApiErrorMessage } from "../../utils/apiError";
import { useAuthStore } from "../../store/authStore";
import {
  TOURNAMENT_STATUS_LABELS,
  TOURNAMENT_STATUS_STYLES,
} from "../../constants/tournamentConfig";

const FALLBACK_IMAGE =
  "https://matchroompool.com/wp-content/uploads/UK-OPEN-2026_1920x1080-1.webp";

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

/* "Vô địch 4tr | Á quân 2.4tr · Hạng 3 1.6tr" -> [{ label, value }] */
const parsePrizeTiers = (description) => {
  if (!description) return [];
  return description
    .split(/[|·•]/)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const words = part.split(/\s+/);
      const value = words.pop();
      return { label: words.join(" ") || "Giải thưởng", value };
    });
};

/* ─── Tabs ──────────────────────────────────────────────────────── */
const TABS = [
  { id: "info",         label: "Thông tin", Icon: Info      },
  { id: "players",      label: "Cơ thủ",    Icon: UserCheck },
  { id: "matches",      label: "Trận đấu",  Icon: List      },
  { id: "live",         label: "Trực tiếp", Icon: Radio,    live: true },
  { id: "ranking",      label: "Xếp hạng",  Icon: BarChart2 },
];

/* ─── Registration CTA ──────────────────────────────────────────── */
const REG_STATUS_LABELS = {
  PENDING_PAYMENT: "Chờ thanh toán",
  PAID: "Đã thanh toán",
  APPROVED: "Tham gia chính thức",
  REJECTED: "Không được tham dự",
  CANCELLED: "Đã hủy",
};

const RegistrationCard = ({ t, onRegister, myRegistration = null }) => {
  const navigate = useNavigate();
  const approved = t.approvedCount ?? 0;
  const max = t.maxParticipants ?? 0;
  const remaining = t.remainingSlots ?? Math.max(0, max - approved);
  const isFull = remaining <= 0 && max > 0;
  const isOpen = t.status === "OPEN_FOR_REGISTRATION";
  const alreadyRegistered = Boolean(myRegistration);
  const canRegister = isOpen && t.isRegister && !isFull && !alreadyRegistered;
  const hasEntryFee = t.entryFee && Number(t.entryFee) > 0;
  const pct = max > 0 ? Math.min(100, (approved / max) * 100) : 0;

  return (
    <div className="rounded-3xl overflow-hidden shadow-sm" style={{ background: "#1e293b" }}>
      {/* Header */}
      <div className="px-5 py-4 border-b border-white/10">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Users size={15} className="text-slate-200" />
            <span className="text-xs font-bold tracking-[0.15em] uppercase text-white/90">
              Đăng ký tham dự
            </span>
          </div>
          {max > 0 && (
            <span className={`text-xs font-semibold ${isFull ? "text-red-400" : remaining <= 3 ? "text-amber-400" : "text-emerald-400"}`}>
              {isFull ? "Đã đủ người" : `Còn ${remaining} slot`}
            </span>
          )}
        </div>
      </div>

      <div className="p-5 space-y-4">
        {/* Slot bar */}
        {max > 0 && (
          <div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden mb-1">
              <div
                className={`h-full rounded-full transition-all ${isFull ? "bg-red-400" : remaining <= 3 ? "bg-amber-400" : "bg-emerald-400"}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="text-xs text-white/50">{approved} / {max} người tham gia đã xác nhận</p>
          </div>
        )}

        {/* Fee + deadline info */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/[0.12] border border-white/10 rounded-xl px-4 py-3">
            <p className="text-[9px] text-white/60 uppercase tracking-wide mb-1">Phí tham dự</p>
            <p className={`text-sm font-bold ${hasEntryFee ? "text-white" : "text-emerald-400"}`}>
              {fmtCurrency(t.entryFee)}
            </p>
          </div>
          {t.registrationDeadline && (
            <div className="bg-white/[0.12] border border-white/10 rounded-xl px-4 py-3">
              <p className="text-[9px] text-white/60 uppercase tracking-wide mb-1">Hạn đăng ký</p>
              <p className="text-sm font-bold text-white">{fmtDate(t.registrationDeadline)}</p>
            </div>
          )}
        </div>

        {/* Action */}
        {alreadyRegistered ? (
          <div className="space-y-2">
            <div className="py-3 px-4 rounded-2xl bg-emerald-500/15 border border-emerald-400/30 flex items-center gap-3">
              <span className="text-emerald-400 text-xl">✓</span>
              <div>
                <p className="text-sm font-bold text-emerald-200">Bạn đã đăng ký giải này</p>
                <p className="text-xs text-emerald-300/80">
                  Trạng thái: <strong>{REG_STATUS_LABELS[myRegistration.status] || myRegistration.status}</strong>
                </p>
              </div>
            </div>
            {myRegistration.status === "PENDING_PAYMENT" && (
              <button
                type="button"
                onClick={() => navigate("/player/registrations")}
                className="w-full py-2.5 rounded-2xl font-bold text-sm text-white text-center"
                style={{ background: "#EF342A" }}
              >
                Thanh toán ngay →
              </button>
            )}
            <button
              type="button"
              onClick={() => navigate("/player/registrations")}
              className="w-full py-2.5 rounded-2xl text-sm font-medium border border-emerald-400/40 text-emerald-200 hover:bg-emerald-500/10 transition-colors text-center"
            >
              Xem đăng ký của tôi
            </button>
          </div>
        ) : canRegister ? (
          <button
            type="button"
            onClick={onRegister}
            className="w-full py-3 rounded-2xl font-black text-sm uppercase tracking-wider text-white transition-all active:scale-95 flex items-center justify-center gap-2"
            style={{ background: "linear-gradient(90deg,#ef342a,#d42a22)" }}
          >
            {hasEntryFee ? <CreditCard size={16} /> : <Users size={16} />}
            {hasEntryFee ? `Đăng ký & thanh toán ${fmtCurrency(t.entryFee)}` : "Đăng ký tham dự — Miễn phí"}
          </button>
        ) : isFull ? (
          <div className="py-3 rounded-2xl bg-red-500/15 border border-red-400/30 text-center">
            <p className="text-sm font-semibold text-red-300">Giải đã đủ {max} người — không còn slot</p>
          </div>
        ) : !isOpen ? (
          <div className="py-3 rounded-2xl bg-white/[0.06] border border-white/10 text-center">
            <p className="text-sm text-white/60">
              {t.status === "IN_PROGRESS" ? "Giải đang diễn ra"
                : t.status === "COMPLETED" ? "Giải đã kết thúc"
                : t.status === "REGISTRATION_CLOSED" ? "Đã đóng đăng ký"
                : "Chưa mở đăng ký"}
            </p>
          </div>
        ) : (
          <div className="py-3 rounded-2xl bg-white/[0.06] border border-white/10 text-center">
            <p className="text-sm text-white/60">Giải này không nhận đăng ký online.</p>
          </div>
        )}
      </div>
    </div>
  );
};

/* ─── Info tab ──────────────────────────────────────────────────── */
const InfoTab = ({ t, onRegister, myRegistration, onGoLive }) => (
  <div className="space-y-4">
    {/* Registration CTA — luôn hiển thị đầu tiên */}
    <RegistrationCard t={t} onRegister={onRegister} myRegistration={myRegistration} />

    {/* Card tổng: Meta + cơ cấu giải thưởng + trực tiếp (liền mạch) */}
    <div className="rounded-3xl overflow-hidden shadow-sm border border-gray-100">
      {/* Info bar */}
      <div className="bg-white grid grid-cols-2 divide-x divide-gray-100">
        {[
          { Icon: Calendar, label: "Ngày thi đấu", value: `${fmtDate(t.startAt)} – ${fmtDate(t.endAt)}` },
          { Icon: DollarSign, label: "Tổng giải thưởng", value: t.prizePool ? fmtCurrency(t.prizePool) : "—" },
        ].map(({ Icon, label, value }) => (
          <div key={label} className="flex items-center gap-3 px-5 py-5 sm:px-6">
            <Icon size={16} className="shrink-0 text-slate-300" />
            <div className="min-w-0">
              <p className="mb-1 text-[10px] font-medium uppercase leading-none tracking-wide text-slate-400">{label}</p>
              <p className="truncate text-sm font-semibold leading-snug text-[#0d1b2e] sm:text-base">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Khối tối: cơ cấu giải thưởng + trực tiếp */}
      {(t.prizeDescription || t.status === "IN_PROGRESS") && (
        <div style={{ background: "#131d30" }}>
          {/* Cơ cấu giải thưởng */}
          {t.prizeDescription && (
            <div className="px-5 py-6 sm:px-7">
              <div className="mb-4 flex items-center gap-2">
                <Trophy size={14} className="text-yellow-400" />
                <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/45">Cơ cấu giải thưởng</span>
              </div>
              {(() => {
                const tiers = parsePrizeTiers(t.prizeDescription);
                if (tiers.length === 0) {
                  return <p className="text-sm leading-relaxed text-white/60">{t.prizeDescription}</p>;
                }
                return (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {tiers.map((tier, i) => (
                      <div
                        key={`${tier.label}-${i}`}
                        className={`rounded-2xl border px-4 py-4 sm:px-5 ${
                          i === 0
                            ? "border-yellow-400/25 bg-yellow-400/[0.06]"
                            : "border-white/[0.06] bg-white/[0.04]"
                        }`}
                      >
                        <p className="mb-2 truncate text-[10px] uppercase tracking-[0.12em] text-white/40">{tier.label}</p>
                        <p className={`text-xl font-black leading-none sm:text-2xl ${i === 0 ? "text-yellow-400" : "text-white"}`}>
                          {tier.value}
                        </p>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          )}

          {/* Trực tiếp */}
          {t.status === "IN_PROGRESS" && (
            <button
              type="button"
              onClick={onGoLive}
              className="group relative block w-full overflow-hidden border-t border-white/5 text-left"
            >
              <img
                src={t.thumbnailUrl || FALLBACK_IMAGE}
                alt=""
                className="absolute inset-0 h-full w-full object-cover object-center opacity-70"
                onError={(e) => { e.target.src = FALLBACK_IMAGE; }}
              />
              <div
                className="absolute inset-0"
                style={{ background: "linear-gradient(90deg, rgba(19,29,48,0.97) 35%, rgba(19,29,48,0.6) 100%)" }}
              />
              <div className="relative flex items-center justify-between gap-4 px-5 py-4 sm:px-7 sm:py-5">
                <div className="flex items-center gap-3">
                  <Monitor size={18} className="shrink-0 text-white/50" />
                  <div className="leading-tight">
                    <p className="text-[10px] uppercase tracking-[0.15em] text-white/40">Trực tiếp tại</p>
                    <p className="text-base font-black uppercase italic tracking-tight text-white sm:text-lg">
                      Billiards <span className="text-[#ef342a]">Live</span> TV
                    </p>
                  </div>
                </div>
                <span className="shrink-0 rounded-full bg-[#ef342a] px-5 py-2 text-xs font-black uppercase italic tracking-wide text-white transition-transform group-hover:scale-105 sm:text-sm">
                  Xem ngay
                </span>
              </div>
            </button>
          )}
        </div>
      )}
    </div>

    {/* Card: Giới thiệu */}
    {t.description && (
      <div className="rounded-3xl shadow-sm border border-gray-100 bg-white p-6">
        <p className="text-[10px] font-bold tracking-[0.15em] text-slate-400 uppercase mb-2">Giới thiệu</p>
        <p className="text-sm text-slate-700 leading-relaxed">{t.description}</p>
      </div>
    )}

    {/* Card: Thể thức thi đấu — nền xám tối làm nổi bật */}
    {t.configSummary && (
      <div className="rounded-3xl shadow-sm px-5 py-6 sm:px-7" style={{ background: "#1e293b" }}>
        <div className="mb-4 flex items-center gap-2">
          <BarChart2 size={15} className="text-slate-200" />
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-white/90">Thể thức thi đấu</span>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {[
            t.configSummary.seedingMethod && { label: "Xếp hạt giống", value: t.configSummary.seedingMethod === "RANDOM" ? "Ngẫu nhiên" : t.configSummary.seedingMethod === "ELO" ? "Theo ELO" : "Thủ công" },
            t.configSummary.bracketSize != null && { label: "Bracket", value: `${t.configSummary.bracketSize} slot` },
            t.configSummary.finalRaceTo != null && { label: "Race-to CK", value: `Race to ${t.configSummary.finalRaceTo}` },
            t.configSummary.breakRule && { label: "Luật break", value: t.configSummary.breakRule === "ALTERNATE_BREAK" ? "Luân phiên" : t.configSummary.breakRule === "WINNER_BREAK" ? "Người thắng" : "Người thua" },
            t.configSummary.thirdPlaceMatch != null && { label: "Tranh hạng 3", value: t.configSummary.thirdPlaceMatch ? "Có" : "Không" },
          ].filter(Boolean).map(({ label, value }) => (
            <div key={label} className="rounded-xl border border-white/10 bg-white/[0.12] px-4 py-3">
              <p className="mb-1 text-[9px] uppercase tracking-wide text-white/60">{label}</p>
              <p className="text-sm font-semibold text-white">{value}</p>
            </div>
          ))}
        </div>
      </div>
    )}

    {/* Thời gian chi tiết */}
    {(t.startAt || t.endAt) && (
      <div className="rounded-3xl border border-slate-100 bg-white px-6 py-4">
        <p className="text-[10px] font-bold tracking-[0.15em] text-slate-400 uppercase mb-3">Lịch thi đấu</p>
        <div className="grid grid-cols-2 gap-3 text-sm">
          {t.startAt && (
            <div>
              <p className="text-xs text-slate-400 mb-0.5">Bắt đầu</p>
              <p className="font-semibold text-slate-800">{fmtDateTime(t.startAt)}</p>
            </div>
          )}
          {t.endAt && (
            <div>
              <p className="text-xs text-slate-400 mb-0.5">Kết thúc</p>
              <p className="font-semibold text-slate-800">{fmtDateTime(t.endAt)}</p>
            </div>
          )}
        </div>
      </div>
    )}
  </div>
);

const ComingSoon = ({ label }) => (
  <div className="bg-white rounded-3xl border border-gray-100 shadow-sm flex flex-col items-center justify-center py-28 gap-2">
    <p className="text-gray-200 text-4xl font-semibold">{label}</p>
    <p className="text-gray-400 text-sm font-light">Sắp ra mắt</p>
  </div>
);

const PARTICIPANT_STATUS_LABELS = {
  ACTIVE: "Đang thi đấu",
  WITHDRAWN: "Đã rút lui",
  ELIMINATED: "Đã bị loại",
};

/* Popup chi tiết cơ thủ đã đăng ký giải */
const ParticipantModal = ({ p, index, onClose }) => {
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!p) return null;

  const rows = [
    { label: "Số điện thoại", value: p.phone },
    { label: "Email", value: p.email },
    { label: "Câu lạc bộ", value: p.clubName || p.club },
    { label: "Địa chỉ", value: p.address },
    { label: "ELO", value: p.elo ?? p.rating },
    { label: "Số hạt giống", value: p.seedNo != null ? `#${p.seedNo}` : null },
    { label: "Ngày đăng ký", value: p.registeredAt ? fmtDate(p.registeredAt) : p.createdAt ? fmtDate(p.createdAt) : null },
    { label: "Trạng thái", value: PARTICIPANT_STATUS_LABELS[p.status] || p.status },
  ].filter((r) => r.value != null && r.value !== "");

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-md overflow-hidden rounded-3xl shadow-2xl"
        style={{ background: "#1e293b" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative border-b border-white/10 px-6 pb-6 pt-7 text-center">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 text-white/40 transition-colors hover:text-white"
          >
            <X size={20} />
          </button>
          <div
            className="mx-auto mb-3 flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl text-2xl font-black text-white/80"
            style={{ background: "linear-gradient(135deg,#010851,#1e3a5f)" }}
          >
            {p.avatarUrl
              ? <img src={p.avatarUrl} alt="" className="h-full w-full object-cover" />
              : (p.displayName?.charAt(0)?.toUpperCase() || "?")}
          </div>
          <h3 className="text-lg font-bold text-white">{p.displayName}</h3>
          {index != null && <p className="mt-0.5 text-xs text-white/40">Cơ thủ #{index}</p>}
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          {rows.length === 0 ? (
            <p className="py-4 text-center text-sm text-white/50">Chưa có thêm thông tin công khai.</p>
          ) : (
            <div className="space-y-3">
              {rows.map((r) => (
                <div key={r.label} className="flex items-center justify-between gap-4">
                  <span className="text-xs uppercase tracking-wide text-white/40">{r.label}</span>
                  <span className="text-right text-sm font-semibold text-white">{r.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const PlayersTab = ({ participants }) => {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const filtered = participants.filter(
    (p) =>
      !search ||
      p.displayName?.toLowerCase().includes(search.toLowerCase()) ||
      p.phone?.includes(search)
  );
  return (
    <div className="rounded-3xl overflow-hidden shadow-sm" style={{ background: "#1e293b" }}>
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Users size={14} className="text-slate-200" />
          <span className="text-[11px] font-bold tracking-[0.18em] text-white/90 uppercase">
            Danh sách cơ thủ
          </span>
        </div>
        <span className="text-[10px] text-white/50">{filtered.length}/{participants.length}</span>
      </div>
      <div className="px-4 pt-3 pb-5">
        <input
          type="text"
          placeholder="Tìm tên hoặc số điện thoại..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-white/[0.06] border border-white/10 text-white text-sm font-light rounded-xl pl-4 pr-4 py-2 placeholder:text-white/30 focus:outline-none focus:bg-white/10 mb-4"
        />
        {filtered.length === 0 ? (
          <div className="text-center py-10 text-white/40 text-sm">
            {participants.length === 0 ? "Danh sách cơ thủ chưa được công bố" : "Không tìm thấy"}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {filtered.map((p, i) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setSelected({ p, index: i + 1 })}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] text-left transition-colors hover:bg-white/[0.09] focus:outline-none focus:ring-1 focus:ring-white/20"
              >
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-sm font-black text-white/80 overflow-hidden"
                  style={{ background: "linear-gradient(135deg,#010851,#1e3a5f)" }}
                >
                  {p.avatarUrl
                    ? <img src={p.avatarUrl} alt="" className="h-full w-full object-cover" />
                    : i + 1}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{p.displayName}</p>
                  {p.seedNo != null && (
                    <p className="text-[10px] text-white/40">Hạt #{p.seedNo}</p>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <ParticipantModal
        p={selected?.p}
        index={selected?.index}
        onClose={() => setSelected(null)}
      />
    </div>
  );
};

/* ─── Page ──────────────────────────────────────────────────────── */
const EventDetailPage = () => {
  const { id }         = useParams();
  const navigate       = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "info");
  const [tournament, setTournament] = useState(null);
  const [loading, setLoading]       = useState(true);
  const [myRegistration, setMyRegistration] = useState(null);
  const [participants, setParticipants] = useState([]);
  const { isAuthenticated, user } = useAuthStore();
  const isPlayer = isAuthenticated && user?.role === "PLAYER";

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [data, parts] = await Promise.all([
        getPublicTournamentDetail(Number(id)),
        listPublicParticipants(Number(id)).catch(() => []),
      ]);
      setTournament(data);
      setParticipants(Array.isArray(parts) ? parts.filter((p) => p.status === "ACTIVE") : []);
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

  if (loading) {
    return <div className="flex items-center justify-center py-32"><p className="text-slate-400">Đang tải...</p></div>;
  }

  if (!tournament) return null;

  const isLive = tournament.status === "IN_PROGRESS";
  const matchesLocked = tournament.status === "OPEN_FOR_REGISTRATION";
  const statusLabel = TOURNAMENT_STATUS_LABELS[tournament.status] || tournament.status;
  const statusStyle = TOURNAMENT_STATUS_STYLES[tournament.status] || "bg-slate-100 text-slate-600";

  const handleRegister = () => navigate(`/player/tournaments/${id}/register`);

  const tournamentShim = {
    ...tournament,
    players: [],
    prizes: [],
    prizeFund: tournament.prizePool ? Number(tournament.prizePool) : null,
    image: tournament.thumbnailUrl || FALLBACK_IMAGE,
    typeBadge: tournament.gameType,
    bracketType: "single_elimination",
  };

  return (
    <div className="font-poppins w-full min-h-screen pb-28" style={{ background: "#f0f2f6" }}>
      {/* Hero */}
      <div className="relative w-full h-[290px] overflow-hidden">
        <img
          src={tournament.thumbnailUrl || FALLBACK_IMAGE}
          alt={tournament.name}
          className="absolute inset-0 w-full h-full object-cover object-top"
          onError={(e) => { e.target.src = FALLBACK_IMAGE; }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0d1b2e]/95 via-[#0d1b2e]/50 to-transparent" />

        <button
          onClick={() => navigate("/event")}
          className="absolute top-5 left-5 flex items-center gap-1.5 text-white/75 hover:text-white text-sm font-light bg-white/10 hover:bg-white/20 backdrop-blur-sm px-3.5 py-1.5 rounded-full transition-all"
        >
          <ArrowLeft size={13} />
          Giải đấu
        </button>

        {isLive && (
          <button
            onClick={() => setActiveTab("live")}
            className="absolute top-5 right-5 flex items-center gap-1.5 bg-[#ef342a] text-white text-[10px] font-medium px-3 py-1.5 rounded-full shadow-lg"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            Trực tiếp
          </button>
        )}

        {/* Tournament hero info */}
        <div className="absolute bottom-0 left-0 right-0 px-6 pb-6 max-w-[90%] mx-auto">
          <div className="flex items-center gap-2 mb-2">
            <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full ${statusStyle}`}>
              {statusLabel}
            </span>
            <span className="text-[10px] font-light text-white/45">{tournament.gameType}</span>
            {(tournament.approvedCount ?? 0) > 0 && tournament.maxParticipants && (
              <span className="text-[10px] text-white/40">
                · {tournament.approvedCount}/{tournament.maxParticipants} người
              </span>
            )}
          </div>
          <h2 className="text-white text-lg sm:text-xl font-semibold leading-tight drop-shadow-lg">
            {tournament.name}
          </h2>
          <p className="text-white/50 text-xs mt-1">
            {tournament.formatName || tournament.format}
            {tournament.participantType && ` · ${tournament.participantType === "SINGLE" ? "Đơn" : tournament.participantType === "DOUBLE" ? "Đôi" : "Đội"}`}
          </p>
        </div>
      </div>

      {/* Tab content */}
      <div className="w-full max-w-[1400px] mx-auto px-2 sm:px-3 py-4 rounded-3xl overflow-hidden">
        {activeTab === "info"    && <InfoTab t={tournament} onRegister={handleRegister} myRegistration={myRegistration} onGoLive={() => setActiveTab("live")} />}
        {activeTab === "players" && <PlayersTab participants={participants} />}
        {activeTab === "matches" && <MatchesTab tournament={tournamentShim} />}
        {activeTab === "live"    && <ComingSoon label="Trực tiếp" />}
        {activeTab === "ranking" && <RankingTab tournament={tournamentShim} />}
      </div>

      {/* Bottom nav */}
      <div className="fixed bottom-5 left-0 right-0 z-50 flex justify-center px-6">
        <div
          className="flex gap-1 p-1.5 rounded-2xl shadow-xl w-full max-w-lg"
          style={{ background: "rgba(13,27,46,0.95)", backdropFilter: "blur(12px)" }}
        >
          {TABS.map((tab) => {
            const isActive   = activeTab === tab.id;
            const isDisabled = tab.id === "matches" && matchesLocked;
            return (
              <button
                key={tab.id}
                onClick={() => !isDisabled && setActiveTab(tab.id)}
                disabled={isDisabled}
                title={isDisabled ? "Lịch thi đấu chưa được xếp" : undefined}
                className={`flex-1 flex flex-col items-center justify-center gap-1 py-2.5 rounded-xl transition-all duration-200 ${
                  isDisabled ? "text-white/15 cursor-not-allowed"
                  : isActive ? "bg-white text-[#0d1b2e]"
                  : "text-white/50 hover:text-white/80"
                }`}
              >
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
