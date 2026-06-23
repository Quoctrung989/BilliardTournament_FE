import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import {
  Calendar, DollarSign,
  ArrowLeft, Info, List, Radio, BarChart2, Trophy, Users, CreditCard, UserCheck,
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
    <div className="rounded-3xl overflow-hidden shadow-sm border border-gray-100 bg-white">
      {/* Header */}
      <div
        className="px-5 py-4 border-b border-gray-100"
        style={{ background: canRegister ? "linear-gradient(90deg,#0d1b2e,#1e3a5f)" : undefined }}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Users size={15} className={canRegister ? "text-white/60" : "text-slate-400"} />
            <span className={`text-[10px] font-bold tracking-[0.15em] uppercase ${canRegister ? "text-white/50" : "text-slate-400"}`}>
              Đăng ký tham dự
            </span>
          </div>
          {max > 0 && (
            <span className={`text-xs font-semibold ${isFull ? "text-red-400" : remaining <= 3 ? "text-amber-400" : canRegister ? "text-emerald-400" : "text-slate-400"}`}>
              {isFull ? "Đã đủ người" : `Còn ${remaining} slot`}
            </span>
          )}
        </div>
      </div>

      <div className="p-5 space-y-4">
        {/* Slot bar */}
        {max > 0 && (
          <div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden mb-1">
              <div
                className={`h-full rounded-full transition-all ${isFull ? "bg-red-400" : remaining <= 3 ? "bg-amber-400" : "bg-emerald-400"}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="text-xs text-slate-400">{approved} / {max} người tham gia đã xác nhận</p>
          </div>
        )}

        {/* Fee + deadline info */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-50 rounded-xl px-4 py-3">
            <p className="text-[9px] text-slate-400 uppercase tracking-wide mb-1">Phí tham dự</p>
            <p className={`text-sm font-bold ${hasEntryFee ? "text-[#0d1b2e]" : "text-emerald-600"}`}>
              {fmtCurrency(t.entryFee)}
            </p>
          </div>
          {t.registrationDeadline && (
            <div className="bg-slate-50 rounded-xl px-4 py-3">
              <p className="text-[9px] text-slate-400 uppercase tracking-wide mb-1">Hạn đăng ký</p>
              <p className="text-sm font-bold text-[#0d1b2e]">{fmtDate(t.registrationDeadline)}</p>
            </div>
          )}
        </div>

        {/* Action */}
        {alreadyRegistered ? (
          <div className="space-y-2">
            <div className="py-3 px-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-3">
              <span className="text-emerald-500 text-xl">✓</span>
              <div>
                <p className="text-sm font-bold text-emerald-800">Bạn đã đăng ký giải này</p>
                <p className="text-xs text-emerald-600">
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
              className="w-full py-2.5 rounded-2xl text-sm font-medium border border-emerald-200 text-emerald-700 hover:bg-emerald-50 transition-colors text-center"
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
          <div className="py-3 rounded-2xl bg-red-50 border border-red-100 text-center">
            <p className="text-sm font-semibold text-red-600">Giải đã đủ {max} người — không còn slot</p>
          </div>
        ) : !isOpen ? (
          <div className="py-3 rounded-2xl bg-slate-50 border border-slate-100 text-center">
            <p className="text-sm text-slate-500">
              {t.status === "IN_PROGRESS" ? "Giải đang diễn ra"
                : t.status === "COMPLETED" ? "Giải đã kết thúc"
                : t.status === "REGISTRATION_CLOSED" ? "Đã đóng đăng ký"
                : "Chưa mở đăng ký"}
            </p>
          </div>
        ) : (
          <div className="py-3 rounded-2xl bg-slate-50 border border-slate-100 text-center">
            <p className="text-sm text-slate-500">Giải này không nhận đăng ký online.</p>
          </div>
        )}
      </div>
    </div>
  );
};

/* ─── Info tab ──────────────────────────────────────────────────── */
const InfoTab = ({ t, onRegister, myRegistration }) => (
  <div className="space-y-4">
    {/* Registration CTA — luôn hiển thị đầu tiên */}
    <RegistrationCard t={t} onRegister={onRegister} myRegistration={myRegistration} />

    {/* Card: Meta + giải thưởng */}
    <div className="rounded-3xl overflow-hidden shadow-sm border border-gray-100">
      <div className="bg-white grid grid-cols-2 sm:grid-cols-3 divide-x divide-gray-100 border-b border-gray-100">
        {[
          { Icon: Calendar, label: "Thời gian", value: `${fmtDate(t.startAt)} – ${fmtDate(t.endAt)}` },
          { Icon: DollarSign, label: "Phí đăng ký", value: fmtCurrency(t.entryFee) },
          { Icon: Users, label: "Số người tối đa", value: `${t.maxParticipants} người` },
        ].map(({ Icon, label, value }) => (
          <div key={label} className="flex items-center gap-3 px-5 py-5">
            <Icon size={16} className="text-[#0d1b2e]/30 shrink-0" />
            <div className="min-w-0">
              <p className="text-[9px] text-gray-400 uppercase tracking-wide font-medium leading-none mb-1">{label}</p>
              <p className="text-sm font-semibold text-[#0d1b2e] truncate leading-snug">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {(t.prizePool || t.prizeDescription) && (
        <div className="px-5 py-6" style={{ background: "linear-gradient(180deg, #0f2035 0%, #0d1b2e 100%)" }}>
          <div className="flex items-center gap-1.5 mb-3">
            <Trophy size={13} className="text-yellow-400" />
            <span className="text-[10px] font-bold tracking-[0.18em] text-white/40 uppercase">Giải thưởng</span>
          </div>
          {t.prizePool && <p className="text-2xl font-black text-yellow-400 mb-2">{fmtCurrency(t.prizePool)}</p>}
          {t.prizeDescription && <p className="text-sm text-white/60 leading-relaxed">{t.prizeDescription}</p>}
        </div>
      )}
    </div>

    {/* Card: Mô tả & config */}
    {(t.description || t.configSummary) && (
      <div className="rounded-3xl overflow-hidden shadow-sm border border-gray-100 bg-white p-6 space-y-4">
        {t.description && (
          <div>
            <p className="text-[10px] font-bold tracking-[0.15em] text-slate-400 uppercase mb-2">Giới thiệu</p>
            <p className="text-sm text-slate-700 leading-relaxed">{t.description}</p>
          </div>
        )}
        {t.configSummary && (
          <div className="pt-3 border-t border-gray-100">
            <p className="text-[10px] font-bold tracking-[0.15em] text-slate-400 uppercase mb-3">Thể thức thi đấu</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                t.configSummary.seedingMethod && { label: "Xếp hạt giống", value: t.configSummary.seedingMethod === "RANDOM" ? "Ngẫu nhiên" : t.configSummary.seedingMethod === "ELO" ? "Theo ELO" : "Thủ công" },
                t.configSummary.bracketSize != null && { label: "Bracket", value: `${t.configSummary.bracketSize} slot` },
                t.configSummary.finalRaceTo != null && { label: "Race-to CK", value: `Race to ${t.configSummary.finalRaceTo}` },
                t.configSummary.breakRule && { label: "Luật break", value: t.configSummary.breakRule === "ALTERNATE_BREAK" ? "Luân phiên" : t.configSummary.breakRule === "WINNER_BREAK" ? "Người thắng" : "Người thua" },
                t.configSummary.thirdPlaceMatch != null && { label: "Tranh hạng 3", value: t.configSummary.thirdPlaceMatch ? "Có" : "Không" },
              ].filter(Boolean).map(({ label, value }) => (
                <div key={label} className="bg-slate-50 rounded-xl px-4 py-3 border border-slate-100">
                  <p className="text-[9px] text-slate-400 uppercase tracking-wide mb-1">{label}</p>
                  <p className="text-sm font-semibold text-slate-800">{value}</p>
                </div>
              ))}
            </div>
          </div>
        )}
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

const PlayersTab = ({ participants }) => {
  const [search, setSearch] = useState("");
  const filtered = participants.filter(
    (p) =>
      !search ||
      p.displayName?.toLowerCase().includes(search.toLowerCase()) ||
      p.phone?.includes(search)
  );
  return (
    <div className="rounded-3xl overflow-hidden shadow-sm border border-gray-100 bg-white">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100"
           style={{ background: "linear-gradient(90deg, #010851 0%, #0d1b2e 100%)" }}>
        <div className="flex items-center gap-2">
          <Users size={14} className="text-white/60" />
          <span className="text-[10px] font-bold tracking-[0.18em] text-white uppercase">
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
          className="w-full bg-[#f8f9fb] border border-transparent text-[#0d1b2e] text-sm font-light rounded-xl pl-4 pr-4 py-2 placeholder:text-gray-400 focus:outline-none focus:bg-white mb-4"
        />
        {filtered.length === 0 ? (
          <div className="text-center py-10 text-slate-400 text-sm">
            {participants.length === 0 ? "Danh sách cơ thủ chưa được công bố" : "Không tìm thấy"}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {filtered.map((p, i) => (
              <div
                key={p.id}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-[#f8f9fb] border border-gray-100"
              >
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-sm font-black text-white/70"
                  style={{ background: "linear-gradient(135deg,#010851,#0d1b2e)" }}
                >
                  {i + 1}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#010851] truncate">{p.displayName}</p>
                  {p.seedNo && (
                    <p className="text-[10px] text-slate-400">Hạt #{p.seedNo}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
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
        {activeTab === "info"    && <InfoTab t={tournament} onRegister={handleRegister} myRegistration={myRegistration} />}
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
