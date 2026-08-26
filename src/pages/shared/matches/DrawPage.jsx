import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { toast } from "react-toastify";
import {
  Shuffle, Play, CheckCircle, AlertCircle, Trophy,
  ArrowLeft, ArrowLeftRight, Eye, Lock, Search, GripVertical,
  ChevronRight, Users, Swords, Zap, BarChart2,
  Loader2, X, MapPin, CheckSquare, List, GitBranch, UserCheck, Sparkles, Trash2,
} from "lucide-react";
import AdminButton from "../../../components/admin/ui/AdminButton";
import AdminCard from "../../../components/admin/ui/AdminCard";
import AdminModal from "../../../components/admin/ui/AdminModal";
import SocketConnectionBadge from "../../../components/shared/SocketConnectionBadge";
import SocketReconnectBanner from "../../../components/shared/SocketReconnectBanner";
import { getApiErrorMessage } from "../../../utils/apiError";
import { ownerTournamentApi, managerTournamentApi } from "../../../api/tournamentManagementApi";
import { useTournamentSocket } from "../../../hooks/useTournamentSocket";
import { useGoBack } from "../../../hooks/useGoBack";
import BracketDiagram, { buildFeedersMap } from "./BracketDiagram";
import DrawCeremonyOverlay from "./draw-ceremony/DrawCeremonyOverlay";
import { ceremonyAvailability, NON_RANDOM_SEEDING_LABEL } from "./draw-ceremony/buildDrawScript";

/* ══════════════════════════════════════════════════════════
   Constants & helpers
══════════════════════════════════════════════════════════ */
const AVATAR_COLORS = [
  "#6366f1","#8b5cf6","#0ea5e9","#10b981",
  "#f59e0b","#ef4444","#ec4899","#06b6d4",
];
const avatarColor  = (id) => AVATAR_COLORS[(id ?? 0) % AVATAR_COLORS.length];
const initials     = (name) => name ? name.trim().charAt(0).toUpperCase() : "?";

const ROUND_STYLE = {
  final:   { label: "🏆 Chung kết",  bg: "bg-amber-50",   text: "text-amber-700",  border: "border-amber-200" },
  semi:    { label: "Bán kết",        bg: "bg-violet-50",  text: "text-violet-700", border: "border-violet-200" },
  quarter: { label: "Tứ kết",         bg: "bg-blue-50",    text: "text-blue-700",   border: "border-blue-200" },
  round:   { label: "Vòng",           bg: "bg-slate-50 dark:bg-white/5",   text: "text-slate-600 dark:text-white/70",  border: "border-slate-200 dark:border-white/10" },
};

const STATUS_CFG = {
  PENDING:     { label: "Chờ",           dot: "bg-slate-400",    pill: "bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-white/70" },
  IN_PROGRESS: { label: "Đang diễn ra",  dot: "bg-blue-500 animate-pulse", pill: "bg-blue-100 text-blue-800" },
  COMPLETED:   { label: "Hoàn thành",    dot: "bg-emerald-500",  pill: "bg-emerald-100 text-emerald-800" },
  WALKOVER:    { label: "Xử thắng",       dot: "bg-amber-500",    pill: "bg-amber-100 text-amber-800" },
  BYE:         { label: "BYE",           dot: "bg-slate-300",    pill: "bg-slate-100 text-slate-400" },
};

/* Stage vòng tròn (mỗi cặp gặp nhau 1 lần) — mọi vòng chỉ là "Vòng N", KHÔNG có tứ/bán/chung kết. */
const LEAGUE_STAGE_TYPES = ["GROUP", "PROGRESSIVE_ROUND"];

/*
 * Nhánh Thắng/Thua (WINNERS/LOSERS) của loại kép KHÔNG dẫn thẳng tới chức vô địch — thắng xong vẫn
 * phải vào Last X (FINAL_BRACKET) đấu tiếp, nơi ĐÃ có Bán kết/Chung kết riêng của chính nó. Mượn
 * tên "Bán kết"/"Chung kết" cho nhánh Thắng/Thua sẽ đụng tên với Last X, khiến người xem tưởng đã
 * tới bán kết/chung kết thật trong khi còn phải đấu tiếp ở Last X. Luôn gọi trung tính "Vòng N".
 */
const NEUTRAL_ROUND_STAGE_TYPES = [...LEAGUE_STAGE_TYPES, "WINNERS", "LOSERS"];

function getRoundStyle(roundNo, totalRounds, stageType) {
  if (NEUTRAL_ROUND_STAGE_TYPES.includes(stageType)) {
    return { ...ROUND_STYLE.round, label: `Vòng ${roundNo}` };
  }
  const diff = totalRounds - roundNo;
  if (diff === 0) return { ...ROUND_STYLE.final,   label: ROUND_STYLE.final.label };
  if (diff === 1) return { ...ROUND_STYLE.semi,    label: ROUND_STYLE.semi.label };
  if (diff === 2) return { ...ROUND_STYLE.quarter, label: ROUND_STYLE.quarter.label };
  return { ...ROUND_STYLE.round, label: `Vòng ${roundNo}` };
}

const EDITABLE_STAGES = ["KNOCKOUT", "WINNERS"];

const MATCH_FILTERS = [
  { key: "ALL", label: "Tất cả" },
  { key: "IN_PROGRESS", label: "Đang diễn ra" },
  { key: "PENDING", label: "Chờ bắt đầu" },
  { key: "DONE", label: "Đã xong" },
  { key: "NO_TABLE", label: "Chưa gán bàn" },
  { key: "NO_SCHEDULE", label: "Chưa xếp giờ" },
];

/** Nhãn tải của trọng tài, hiện ngay trong <option> để chọn được mà không cần bấm thử. */
function refereeLoadLabel({ live, total, overlapping }) {
  if (total === 0) return "đang rảnh";
  const parts = [`${total} trận`];
  if (live > 0) parts.push(`${live} đang đấu`);
  if (overlapping > 0) parts.push(`${overlapping} trùng giờ`);
  return parts.join(" · ");
}

/** Trận có thể gán bàn/giờ — khoá lại khi đã resolved (khớp rule ở BE). */
function canAssignTable(match) {
  return !["COMPLETED", "WALKOVER", "BYE"].includes(match.status);
}

function formatScheduledAt(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** ISO (UTC) → giá trị cho <input type="datetime-local"> theo giờ local trình duyệt. */
function toDatetimeLocalValue(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Giá trị <input type="datetime-local"> → ISO string (UTC) để gửi lên BE. */
function fromDatetimeLocalValue(value) {
  if (!value) return null;
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d.toISOString();
}

/* Ước lượng thời lượng 1 trận (phút) — PHẢI khớp hằng số BE (MatchSchedulingServiceImpl). */
const MINUTES_PER_RACK = { "9_BALL": 6, "10_BALL": 7, "8_BALL": 8 };
function estMatchMinutes(raceTo, gameType) {
  const mpr = MINUTES_PER_RACK[gameType] ?? 7;
  return Math.ceil((1.5 * (raceTo || 5) * mpr) / 5) * 5;
}
/** Giờ kết thúc dự kiến (ms) của 1 trận, ưu tiên estimatedEndAt, fallback start + ước lượng. */
function matchEndMs(m, gameType) {
  if (m.estimatedEndAt) return new Date(m.estimatedEndAt).getTime();
  if (m.scheduledAt) return new Date(m.scheduledAt).getTime() + estMatchMinutes(m.raceTo, gameType) * 60000;
  return null;
}

function matchPassesFilter(m, statusFilter, query) {
  if (statusFilter === "DONE") {
    if (!["COMPLETED", "WALKOVER", "BYE"].includes(m.status)) return false;
  } else if (statusFilter === "NO_TABLE") {
    if (m.tableId || m.tableNo) return false;
  } else if (statusFilter === "NO_SCHEDULE") {
    if (m.scheduledAt) return false;
  } else if (statusFilter !== "ALL" && m.status !== statusFilter) {
    return false;
  }
  if (query) {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    const hay = [m.matchCode, m.player1?.displayName, m.player2?.displayName]
      .filter(Boolean).join(" ").toLowerCase();
    if (!hay.includes(q)) return false;
  }
  return true;
}

/** Vòng "đang cần chú ý" đầu tiên (còn trận chưa xong); nếu cả stage đã xong thì fallback vòng cuối. */
function computeDefaultRound(sortedRounds) {
  for (const [roundNo, matches] of sortedRounds) {
    if (matches.some(m => !["COMPLETED", "WALKOVER", "BYE"].includes(m.status))) return Number(roundNo);
  }
  return sortedRounds.length ? Number(sortedRounds[sortedRounds.length - 1][0]) : null;
}

/* Pure helper: swap two player slots in local stages state immediately */
function swapPlayersInState(stages, mId1, sl1, mId2, sl2) {
  let p1 = null, p2 = null;
  for (const stage of stages) {
    for (const m of (stage.matches ?? [])) {
      if (Number(m.id) === Number(mId1)) p1 = sl1 === "player1" ? m.player1 : m.player2;
      if (Number(m.id) === Number(mId2)) p2 = sl2 === "player1" ? m.player1 : m.player2;
    }
  }
  return stages.map(stage => ({
    ...stage,
    matches: stage.matches?.map(m => {
      const isM1 = Number(m.id) === Number(mId1);
      const isM2 = Number(m.id) === Number(mId2);
      if (!isM1 && !isM2) return m;
      const next = { ...m };
      if (isM1) { if (sl1 === "player1") next.player1 = p2; else next.player2 = p2; }
      else       { if (sl2 === "player1") next.player1 = p1; else next.player2 = p1; }
      if (next.player1 && !next.player2) return { ...next, isBye: true,  status: "BYE",     winner: next.player1 };
      return                                    { ...next, isBye: false, status: "PENDING", winner: null };
    }),
  }));
}

/* Nút mở lễ bốc thăm công khai — cố tình KHÔNG dùng AdminButton: đây là hành
   động trình diễn trước khán giả, cần nổi hẳn khỏi dàn nút quản trị xung quanh. */
const CeremonyButton = ({ drawing, disabled, onClick, redo }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={drawing || disabled}
    title="Trình chiếu bốc thăm cho cơ thủ theo dõi"
    className={[
      "inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-bold text-white transition-all",
      "bg-gradient-to-r from-amber-500 to-orange-500 shadow-md shadow-amber-200 dark:shadow-none",
      "hover:brightness-110 hover:shadow-lg",
      (drawing || disabled) ? "opacity-50 cursor-not-allowed" : "",
    ].join(" ")}
  >
    <Sparkles size={15} />
    {drawing ? "Đang bốc thăm..." : redo ? "Bốc thăm công khai lại" : "Bốc thăm công khai"}
  </button>
);

/* ══════════════════════════════════════════════════════════
   Main Component
══════════════════════════════════════════════════════════ */
const DrawPage = ({ api, basePath }) => {
  const { id }         = useParams();
  const tournamentId   = Number(id);
  const goBack         = useGoBack(`${basePath}/${tournamentId}`);

  /* ── Core state ── */
  const [stages,       setStages]       = useState([]);
  const [tournament,   setTournament]   = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [noDrawYet,    setNoDrawYet]    = useState(false);

  /* ── Actions loading ── */
  const [drawing,      setDrawing]      = useState(false);
  const [confirming,   setConfirming]   = useState(false);
  const [startingTournament, setStartingTournament] = useState(false);
  const [swapping,     setSwapping]     = useState(false);
  const [saving,       setSaving]       = useState(false);

  /* ── View mode: danh sách (mặc định) hoặc sơ đồ cây bracket ── */
  const [viewMode,     setViewMode]     = useState("list"); // "list" | "diagram"

  /* ── Edit / swap mode ── */
  const [editMode,     setEditMode]     = useState(false);
  const [swapFirst,    setSwapFirst]    = useState(null);   // { matchId, slot, playerName, matchCode }
  const [swapConfirm,  setSwapConfirm]  = useState(null);   // { first, second }

  /* ── Drag-and-drop ── */
  const [dragSrc,      setDragSrc]      = useState(null);   // { matchId, slot }
  const [dropTarget,   setDropTarget]   = useState(null);   // { matchId, slot }
  const dragRef                         = useRef(null);

  /* ── Search / assign ── */
  const [participants, setParticipants] = useState([]);
  const [searchModal,  setSearchModal]  = useState(null);   // { matchId, slot, matchCode, currentPlayer }
  const [searchQuery,  setSearchQuery]  = useState("");
  const [loadingPtcp,  setLoadingPtcp]  = useState(false);

  /* ── Generic confirm modal (replaces window.confirm) ── */
  const [confirmModal, setConfirmModal] = useState(null); // { title, body, onOk, okLabel?, okVariant? }
  const showConfirm = useCallback((title, body, onOk, opts = {}) => {
    setConfirmModal({ title, body, onOk, okLabel: opts.okLabel ?? "Xác nhận", okVariant: opts.okVariant ?? "primary" });
  }, []);

  /* ── Match modals ── */
  const [scoreModal,   setScoreModal]   = useState(null);
  const [scoreForm,    setScoreForm]    = useState({ p1: "", p2: "" });
  const [completeModal,setCompleteModal]= useState(null);
  /* Xử thắng: bước 2 của modal kết thúc trận — chọn cơ thủ rồi mới nhập lý do.
     Lý do KHÔNG được lưu (Match entity không có field nào chứa), chỉ hiển thị lại
     cho người ghi nhận xác nhận mình bấm đúng người. */
  const [walkoverTarget, setWalkoverTarget] = useState(null);
  const [walkoverReason, setWalkoverReason] = useState("");
  const [eventsModal,  setEventsModal]  = useState(null);
  const [events,       setEvents]       = useState([]);

  /* ── Per-match action loading (không khoá toàn trang) ── */
  const [startingId,   setStartingId]   = useState(null);

  /* ── Gán bàn & giờ thi đấu (đơn + bulk) ── */
  const [bulkMode,     setBulkMode]     = useState(false);
  const [selectedIds,  setSelectedIds]  = useState(() => new Set());
  const [assignModal,  setAssignModal]  = useState(null);  // { matchIds: number[] }
  const [assignForm,   setAssignForm]   = useState({ tableNo: "", scheduledAt: "", clearTable: false, clearScheduledAt: false });
  const [assigning,    setAssigning]    = useState(false);
  const [referees,     setReferees]     = useState([]);
  /* ── Gán trọng tài (tách riêng) ── */
  const [refereeModal, setRefereeModal] = useState(null);  // { match }
  const [refereeStaffId, setRefereeStaffId] = useState("");
  const [savingReferee, setSavingReferee]   = useState(false);

  /* ── Tìm kiếm / lọc trận đấu (giúp quản lý dễ hơn khi nhiều trận) ── */
  const [matchQuery,   setMatchQuery]   = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  /* ── CUT_TO_SE actions ── */
  const [populating,     setPopulating]     = useState(false);
  const [advancing,      setAdvancing]      = useState(false);
  const [progStandings,  setProgStandings]  = useState(null); // { stageName, rows } | null
  const [loadingProgStd, setLoadingProgStd] = useState(false);
  const [activeStageId,  setActiveStageId]  = useState(null); // tab giai đoạn đang xem

  /* ── Lễ bốc thăm công khai ── */
  // Giữ lại DrawResultResponse của lần bốc vừa rồi làm kịch bản trình chiếu.
  const [ceremonyResult, setCeremonyResult] = useState(null);
  const [cancellingDraw, setCancellingDraw] = useState(false);

  const isPreview          = tournament?.status === "DRAW_PREVIEW";
  // Bracket đã chốt nhưng giải chưa chạy — đây là lúc cần nút "Bắt đầu giải đấu"
  // ngay tại đây, thay vì bắt Owner quay về trang chi tiết giải.
  const isDrawDone         = tournament?.status === "DRAW_DONE";
  const isFinalBracketReady= tournament?.status === "FINAL_BRACKET_READY";
  const isProgressive      = tournament?.format === "PROGRESSIVE_ROUND_ROBIN";
  const isDoubleElim       = tournament?.format === "DOUBLE_ELIMINATION";
  const hasFinalBracket    = stages.some(s => s.stageType === "FINAL_BRACKET");

  /* ── PROGRESSIVE_ROUND_ROBIN: giai đoạn hiện tại + có thể chuyển tiếp ──
     Toàn bộ khung (mọi GĐ + playoff) đã tạo sẵn từ draw. GĐ "hiện tại" = GĐ League chưa
     COMPLETED có orderNo NHỎ NHẤT (đang thi đấu, đã có người thật). GĐ sau còn placeholder. */
  const FINISHED_STATUSES = ["COMPLETED", "WALKOVER", "BYE"];
  const currentProgressiveStage = stages
    .filter(s => s.stageType === "PROGRESSIVE_ROUND" && s.status !== "COMPLETED")
    .sort((a, b) => (a.orderNo ?? 0) - (b.orderNo ?? 0))[0] || null;
  // "Đã thi đấu" = có ít nhất 1 trận đã gán người (không phải toàn placeholder trống)
  const currentStageMatches = currentProgressiveStage?.matches || [];
  const currentStageHasPlayers = currentStageMatches.some(m => m.player1 || m.player2);
  const currentStageComplete = currentStageHasPlayers
    && currentStageMatches.length > 0
    && currentStageMatches.every(m => FINISHED_STATUSES.includes(m.status));
  const canAdvanceStage = isProgressive && currentStageComplete;

  /* ══ Load data ══════════════════════════════════════════ */
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [stagesData, tournamentData] = await Promise.all([
        api.getStages(tournamentId),
        api.getTournament(tournamentId),
      ]);
      const hasStages = Array.isArray(stagesData) && stagesData.length > 0;
      setNoDrawYet(!hasStages);
      setStages(hasStages ? stagesData : []);
      setTournament(tournamentData);
    } catch {
      setNoDrawYet(true);
    } finally {
      setLoading(false);
    }
  }, [api, tournamentId]);

  useEffect(() => { load(); }, [load]);

  // Giữ tab giai đoạn đang chọn hợp lệ; mặc định chọn giai đoạn đầu tiên khi mới tải
  useEffect(() => {
    if (!stages.length) { setActiveStageId(null); return; }
    setActiveStageId(prev => (stages.some(s => s.id === prev) ? prev : stages[0].id));
  }, [stages]);

  // Danh sách trọng tài của chi nhánh giải (để gán cho trận)
  useEffect(() => {
    api.getReferees(tournamentId)
      .then(data => setReferees(Array.isArray(data) ? data : []))
      .catch(() => setReferees([]));
  }, [api, tournamentId]);

  useEffect(() => {
    if (!isPreview) { setEditMode(false); setSwapFirst(null); }
  }, [isPreview]);

  useEffect(() => {
    if (!bulkMode) setSelectedIds(new Set());
  }, [bulkMode]);

  /* ══ WebSocket — cập nhật tại chỗ, không reload cả trang ══ */
  const [flashIds, setFlashIds] = useState(() => new Set());
  const flashTimers = useRef({});

  const flashMatch = useCallback((id) => {
    const numId = Number(id);
    setFlashIds(prev => { const s = new Set(prev); s.add(numId); return s; });
    clearTimeout(flashTimers.current[numId]);
    flashTimers.current[numId] = setTimeout(() => {
      setFlashIds(prev => { const s = new Set(prev); s.delete(numId); return s; });
    }, 1500);
  }, []);

  /** Patch 1 trận vào state cục bộ — dùng cho cả WS message lẫn response API trực tiếp. */
  const applyMatchToStages = useCallback((upd) => {
    if (!upd?.id) return;
    setStages(prev => prev.map(stage => {
      if (!stage.matches) return stage;
      const idx = stage.matches.findIndex(m => Number(m.id) === Number(upd.id));
      if (idx === -1) return stage;
      const nm = [...stage.matches];
      nm[idx] = { ...nm[idx], ...upd };
      return { ...stage, matches: nm };
    }));
    flashMatch(upd.id);
  }, [flashMatch]);

  /** BRACKET_SYNC — server đẩy toàn bộ match sau complete/walkover (bao gồm cả trận kế tiếp được cập nhật). */
  const handleBracketSync = useCallback((matches) => {
    if (!Array.isArray(matches) || matches.length === 0) return;
    const byId = new Map(matches.map(m => [Number(m.id), m]));
    setStages(prev => prev.map(stage => ({
      ...stage,
      matches: stage.matches?.map(m => {
        const upd = byId.get(Number(m.id));
        if (!upd) return m;
        if (upd.status !== m.status || upd.player1?.id !== m.player1?.id ||
            upd.player2?.id !== m.player2?.id || upd.player1Score !== m.player1Score ||
            upd.player2Score !== m.player2Score) {
          flashMatch(upd.id);
        }
        return { ...m, ...upd };
      }),
    })));
  }, [flashMatch]);

  const { connectionState } = useTournamentSocket(tournamentId, {
    enabled: !noDrawYet,
    onMatchUpdate: applyMatchToStages,
    onBracketSync: handleBracketSync,
    onReconnect: load,
  });

  /** Tải lại nhẹ (không bật spinner toàn trang) — dùng làm lưới an toàn khi mất kết nối realtime. */
  const silentResync = useCallback(async () => {
    try {
      const stagesData = await api.getStages(tournamentId);
      if (Array.isArray(stagesData)) setStages(stagesData);
    } catch { /* giữ nguyên state hiện tại nếu lỗi */ }
  }, [api, tournamentId]);

  /* ══ R1 position map (for search modal) ═════════════════ */
  const r1PlayerMap = useMemo(() => {
    const map = new Map(); // participantId → { matchId, slot, matchCode }
    stages.forEach(stage => {
      if (!EDITABLE_STAGES.includes(stage.stageType)) return;
      stage.matches?.forEach(m => {
        if (m.roundNo !== 1) return;
        if (m.player1) map.set(m.player1.id, { matchId: m.id, slot: "player1", matchCode: m.matchCode });
        if (m.player2) map.set(m.player2.id, { matchId: m.id, slot: "player2", matchCode: m.matchCode });
      });
    });
    return map;
  }, [stages]);

  // matchId (đích) -> { player1: matchCode|null, player2: matchCode|null } của 2 trận nguồn,
  // dùng để hiện "Thắng RxMy" thay vì "TBD" khi chưa xác định người chơi.
  const listFeedersMap = useMemo(
    () => buildFeedersMap(stages.flatMap(s => s.matches ?? [])),
    [stages]
  );

  /* ══ Stats ══════════════════════════════════════════════ */
  const totalMatches = stages.reduce((s, st) => s + (st.matches?.length ?? 0), 0);
  const doneMatches  = stages.reduce((s, st) =>
    s + (st.matches?.filter(m => ["COMPLETED","WALKOVER","BYE"].includes(m.status)).length ?? 0), 0);
  const progress     = totalMatches ? Math.round((doneMatches / totalMatches) * 100) : 0;

  /* ══ Swap helper — optimistic update, then sync with server ══ */
  const performSwap = useCallback(async (mId1, sl1, mId2, sl2) => {
    if (mId1 === mId2 && sl1 === sl2) return;
    if (swapping) return;

    // 1. Update UI immediately — no wait
    setStages(prev => swapPlayersInState(prev, mId1, sl1, mId2, sl2));
    setSwapping(true);

    try {
      // 2. Server call — response contains full updated stages (incl. R2+ BYE propagation)
      const serverStages = await api.swapPlayers(tournamentId, { matchId1: mId1, slot1: sl1, matchId2: mId2, slot2: sl2 });
      if (Array.isArray(serverStages)) setStages(serverStages);
    } catch (err) {
      // 3. On error: revert by reloading from server
      toast.error(getApiErrorMessage(err));
      load();
    } finally {
      setSwapping(false);
    }
  }, [api, tournamentId, load, swapping]);

  /* ══ Drag-and-drop handlers ═════════════════════════════ */
  const onDragStart = useCallback((e, matchId, slot) => {
    dragRef.current = { matchId, slot };
    setDragSrc({ matchId, slot });
    e.dataTransfer.effectAllowed = "move";
  }, []);

  const onDragOver = useCallback((e, matchId, slot) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDropTarget({ matchId, slot });
  }, []);

  const onDragLeave = useCallback(() => setDropTarget(null), []);

  const onDrop = useCallback((e, matchId, slot) => {
    e.preventDefault();
    setDropTarget(null);
    const src = dragRef.current;
    // Clear drag visual state immediately — don't wait for API
    dragRef.current = null;
    setDragSrc(null);
    if (!src || (src.matchId === matchId && src.slot === slot)) return;
    performSwap(src.matchId, src.slot, matchId, slot);
  }, [performSwap]);

  const onDragEnd = useCallback(() => {
    setDragSrc(null);
    setDropTarget(null);
    dragRef.current = null;
  }, []);

  /* ══ Click-to-swap handlers ═════════════════════════════ */
  const handleSlotClick = useCallback((match, slot, player, stageType) => {
    if (!editMode || match.roundNo !== 1 || !EDITABLE_STAGES.includes(stageType)) return;
    const sel = { matchId: match.id, slot, playerName: player?.displayName ?? "TBD", matchCode: match.matchCode };
    if (!swapFirst) { setSwapFirst(sel); return; }
    if (swapFirst.matchId === sel.matchId && swapFirst.slot === sel.slot) { setSwapFirst(null); return; }
    setSwapConfirm({ first: swapFirst, second: sel });
    setSwapFirst(null);
  }, [editMode, swapFirst]);

  /* ══ Search / assign handlers ═══════════════════════════ */
  const openSearch = useCallback(async (match, slot, stageType) => {
    if (!EDITABLE_STAGES.includes(stageType)) return;
    const player = slot === "player1" ? match.player1 : match.player2;
    setSearchModal({ matchId: match.id, slot, matchCode: match.matchCode, currentPlayer: player });
    setSearchQuery("");
    if (participants.length === 0) {
      setLoadingPtcp(true);
      try {
        const data = await api.getParticipants(tournamentId);
        setParticipants(Array.isArray(data) ? data : []);
      } catch { /* keep empty */ }
      finally { setLoadingPtcp(false); }
    }
  }, [api, tournamentId, participants.length]);

  const handleAssign = useCallback(async (participant) => {
    if (!searchModal) return;
    const targetPos = r1PlayerMap.get(participant.id);
    if (!targetPos) { toast.error("Không tìm thấy vị trí của người chơi này"); return; }
    if (targetPos.matchId === searchModal.matchId && targetPos.slot === searchModal.slot) {
      setSearchModal(null); return;
    }
    setSearchModal(null);
    await performSwap(searchModal.matchId, searchModal.slot, targetPos.matchId, targetPos.slot);
  }, [searchModal, r1PlayerMap, performSwap]);

  const filteredPtcp = useMemo(() =>
    participants.filter(p =>
      !searchQuery || p.displayName?.toLowerCase().includes(searchQuery.toLowerCase())
    ), [participants, searchQuery]);

  /* ══ Bracket actions ════════════════════════════════════ */
  const handleDraw = () => {
    const isRedo = isPreview;
    showConfirm(
      isRedo ? "Bốc thăm lại?" : "Sinh bracket",
      isRedo
        ? "Kết quả bốc thăm hiện tại sẽ bị xóa và xáo trộn ngẫu nhiên lại. Tiếp tục?"
        : "Sinh bracket ngẫu nhiên từ danh sách người tham gia?",
      async () => {
        setDrawing(true); setEditMode(false); setSwapFirst(null);
        try {
          await api.generateDraw(tournamentId);
          toast.success(isRedo ? "Đã bốc thăm lại!" : "Bốc thăm thành công!");
          setParticipants([]);
          load();
        } catch (err) { toast.error(getApiErrorMessage(err)); }
        finally { setDrawing(false); }
      },
      { okLabel: isRedo ? "Bốc thăm lại" : "Sinh bracket", okVariant: isRedo ? "danger" : "primary" }
    );
  };

  /* ══ Bốc thăm công khai ═════════════════════════════════
     Vẫn gọi đúng API sinh bracket như nút thường — chỉ khác ở chỗ GIỮ LẠI
     response để trình chiếu thay vì bỏ đi rồi load() ngay. Logic bốc thăm
     nằm trọn ở BE, FE không xáo trộn lại gì.                              */
  const seedingMethod = tournament?.configSummary?.seedingMethod;
  const ceremony = ceremonyAvailability(tournament?.format, seedingMethod);
  const ceremonySupported = ceremony.available;
  /* Xếp theo hạng/hạt giống thì cặp đấu tính trước được → không có lễ bốc thăm.
     Nói rõ lý do, nếu không BQT sẽ tưởng nút bị lỗi hoặc thiếu quyền. */
  const ceremonyBlockedBySeeding = ceremony.blockedBy === "seeding";
  const seedingLabel = NON_RANDOM_SEEDING_LABEL[seedingMethod];

  const handlePublicDraw = () => {
    const isRedo = isPreview;
    showConfirm(
      "Bốc thăm công khai",
      isRedo
        ? "Kết quả bốc thăm hiện tại sẽ bị xóa và bốc lại ngẫu nhiên ngay trên màn chiếu. Tiếp tục?"
        : "Màn hình sẽ chuyển sang chế độ trình chiếu và bốc từng cơ thủ vào cây thi đấu. Tiếp tục?",
      async () => {
        setDrawing(true); setEditMode(false); setSwapFirst(null);
        try {
          const result = await api.generateDraw(tournamentId);
          setCeremonyResult(result);
        } catch (err) { toast.error(getApiErrorMessage(err)); }
        finally { setDrawing(false); }
      },
      { okLabel: "Bắt đầu bốc thăm", okVariant: isRedo ? "danger" : "primary" }
    );
  };

  /* Đóng màn chiếu → quay về đúng luồng cũ: nạp lại stages + tournament. */
  const handleCeremonyClose = useCallback(() => {
    setCeremonyResult(null);
    setParticipants([]);
    toast.success("Bốc thăm thành công!");
    load();
  }, [load]);

  /* Dừng giữa buổi và bỏ hết. Bracket đã nằm trong DB từ lúc bấm bốc, nên "thoát" thôi
     không đủ — phải gọi BE xoá, nếu không mọi cặp đấu vẫn còn dù chưa công bố hết.
     Lỗi thì GIỮ overlay lại: đóng luôn sẽ để lại bracket mà người dùng tưởng đã xoá. */
  const handleCeremonyCancel = useCallback(async () => {
    setCancellingDraw(true);
    try {
      await api.cancelDraw(tournamentId);
      setCeremonyResult(null);
      setParticipants([]);
      toast.info("Đã huỷ bốc thăm — bracket vừa sinh đã được xóa.");
      load();
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setCancellingDraw(false);
    }
  }, [api, tournamentId, load]);

  /* Huỷ bốc thăm từ chính trang quản lý (ngoài màn chiếu). */
  const handleCancelDraw = () => {
    showConfirm(
      "Hủy bốc thăm",
      "Toàn bộ cặp đấu vừa sinh sẽ bị xóa và giải trở về trạng thái Đóng đăng ký. Lần bốc thăm sau sẽ cho kết quả ngẫu nhiên khác. Tiếp tục?",
      async () => {
        setCancellingDraw(true);
        try {
          await api.cancelDraw(tournamentId);
          setParticipants([]);
          setEditMode(false); setSwapFirst(null);
          toast.info("Đã hủy bốc thăm.");
          load();
        } catch (err) { toast.error(getApiErrorMessage(err)); }
        finally { setCancellingDraw(false); }
      },
      { okLabel: "Hủy bốc thăm", okVariant: "danger" }
    );
  };

  const handleConfirmDraw = () => {
    showConfirm(
      "Xác nhận bracket",
      "Sau khi xác nhận, bracket sẽ được khóa lại và không thể bốc thăm lại. Tiếp tục?",
      async () => {
        setConfirming(true);
        try {
          await api.confirmDraw(tournamentId);
          toast.success("Bracket đã xác nhận! Giải đấu bắt đầu.");
          setEditMode(false); setSwapFirst(null);
          load();
        } catch (err) { toast.error(getApiErrorMessage(err)); }
        finally { setConfirming(false); }
      },
      { okLabel: "Xác nhận & Khóa bracket", okVariant: "success" }
    );
  };

  /* ══ Bắt đầu giải đấu ═════════════════════════════════ */
  // DrawPage nhận matchApi qua prop, không có patchStatus — lấy thêm tournamentApi
  // theo basePath, cùng cách ParticipantListPage đang làm.
  const tournamentApi = basePath.startsWith("/owner") ? ownerTournamentApi : managerTournamentApi;

  const handleStartTournament = () => {
    showConfirm(
      "Bắt đầu giải đấu",
      "Giải sẽ chuyển sang trạng thái Đang thi đấu. Các trận đã có thể nhập tỉ số.",
      async () => {
        setStartingTournament(true);
        try {
          await tournamentApi.patchStatus(tournamentId, { status: "IN_PROGRESS" });
          toast.success("Giải đấu đã bắt đầu!");
          load();
        } catch (err) { toast.error(getApiErrorMessage(err)); }
        finally { setStartingTournament(false); }
      },
      { okLabel: "Bắt đầu", okVariant: "success" }
    );
  };

  /* ══ CUT_TO_SE: populate final bracket ═════════════════ */
  const handlePopulateFinalBracket = () => {
    showConfirm(
      "Điền bracket loại trực tiếp",
      "Lấy kết quả từ nhánh thắng và nhánh thua để điền vào bracket Last " +
        (stages.find(s => s.stageType === "FINAL_BRACKET")?.name ?? "SE") +
        ". Thao tác không thể hoàn tác.",
      async () => {
        setPopulating(true);
        try {
          await api.populateFinalBracket(tournamentId);
          toast.success("Đã điền bracket loại trực tiếp!");
          load();
        } catch (err) { toast.error(getApiErrorMessage(err)); }
        finally { setPopulating(false); }
      },
      { okLabel: "Điền bracket", okVariant: "primary" }
    );
  };

  /* ══ PROGRESSIVE_ROUND_ROBIN: xem standings GĐ + chuyển giai đoạn ══ */
  const openProgStandings = async (stage) => {
    if (!stage) return;
    setLoadingProgStd(true);
    setProgStandings({ stageName: stage.name, rows: [] });
    try {
      const rows = await api.getStageStandings(tournamentId, stage.id);
      setProgStandings({ stageName: stage.name, rows: Array.isArray(rows) ? rows : [] });
    } catch (err) {
      toast.error(getApiErrorMessage(err));
      setProgStandings(null);
    } finally { setLoadingProgStd(false); }
  };

  const handleAdvanceStage = () => {
    showConfirm(
      "Chuyển giai đoạn tiếp theo",
      "Hệ thống tính bảng xếp hạng giai đoạn hiện tại, loại người ngoài nhóm đi tiếp (chuyển INACTIVE), rồi sinh giai đoạn kế tiếp — vòng tròn mới hoặc bracket Playoff. Thao tác này không thể hoàn tác.",
      async () => {
        setAdvancing(true);
        try {
          await api.advanceStage(tournamentId);
          toast.success("Đã chuyển giai đoạn!");
          load();
        } catch (err) { toast.error(getApiErrorMessage(err)); }
        finally { setAdvancing(false); }
      },
      { okLabel: "Chuyển giai đoạn", okVariant: "primary" }
    );
  };

  /* ══ Match lifecycle — patch tại chỗ, không reload cả trang ══ */
  const handleStart = async (matchId) => {
    if (startingId) return;
    setStartingId(matchId);
    try {
      const updated = await api.startMatch(matchId);
      applyMatchToStages(updated);
      toast.success("Đã bắt đầu trận");
    } catch (err) { toast.error(getApiErrorMessage(err)); }
    finally { setStartingId(null); }
  };

  const handleSaveScore = async () => {
    if (!scoreModal) return;
    const p1 = Number(scoreForm.p1), p2 = Number(scoreForm.p2);
    if (isNaN(p1)||isNaN(p2)||p1<0||p2<0) { toast.warn("Tỷ số không hợp lệ"); return; }
    setSaving(true);
    try {
      const updated = await api.updateScore(scoreModal.id, { player1Score: p1, player2Score: p2 });
      applyMatchToStages(updated);
      toast.success("Đã cập nhật tỷ số"); setScoreModal(null);
    } catch (err) { toast.error(getApiErrorMessage(err)); }
    finally { setSaving(false); }
  };

  const handleComplete = async (winnerId) => {
    if (!completeModal) return;
    setSaving(true);
    try {
      const updated = await api.completeMatch(completeModal.id, { winnerParticipantId: winnerId });
      applyMatchToStages(updated);
      toast.success("Trận kết thúc — người thắng đã được chuyển lên"); closeCompleteModal();
      // Việc chuyển người thắng lên trận kế tiếp được đồng bộ qua BRACKET_SYNC (realtime);
      // nếu socket đang mất kết nối thì tải nhẹ để không bị lệch dữ liệu.
      if (connectionState !== "connected") silentResync();
    } catch (err) { toast.error(getApiErrorMessage(err)); }
    finally { setSaving(false); }
  };

  const closeCompleteModal = () => {
    setCompleteModal(null);
    setWalkoverTarget(null);
    setWalkoverReason("");
  };

  const handleWalkover = async (winnerId) => {
    if (!completeModal) return;
    setSaving(true);
    try {
      const updated = await api.walkover(completeModal.id, { winnerParticipantId: winnerId });
      applyMatchToStages(updated);
      const who = walkoverTarget?.displayName ?? "cơ thủ";
      const why = walkoverReason.trim();
      toast.success(why ? `Xử thắng cho ${who} — ${why}` : `Đã xử thắng cho ${who}`);
      closeCompleteModal();
      if (connectionState !== "connected") silentResync();
    } catch (err) { toast.error(getApiErrorMessage(err)); }
    finally { setSaving(false); }
  };

  /* ══ Gán bàn & giờ thi đấu ══════════════════════════════ */
  const toggleSelect = useCallback((matchId) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(matchId)) next.delete(matchId); else next.add(matchId);
      return next;
    });
  }, []);

  const openAssignSingle = useCallback((match) => {
    setAssignModal({ matchIds: [match.id] });
    setAssignForm({
      tableNo: match.tableNo != null ? String(match.tableNo) : "",
      scheduledAt: toDatetimeLocalValue(match.scheduledAt),
      clearTable: false,
      clearScheduledAt: false,
    });
  }, []);

  const openAssignBulk = useCallback(() => {
    if (selectedIds.size === 0) return;
    const picked = stages.flatMap(s => s.matches || []).filter(m => selectedIds.has(m.id));

    // Điền sẵn khi MỌI trận được chọn cùng một giá trị — thường gặp nhất là chọn đúng
    // một trận đã có bàn/giờ. Nếu các trận đang khác nhau thì để trống, vì không có
    // giá trị nào đại diện đúng cho cả nhóm và hiển thị bừa sẽ khiến người dùng vô tình
    // ghi đè giờ của trận này lên trận kia khi bấm Lưu.
    const distinct = (vals) => [...new Set(vals)];
    const tables = distinct(picked.map(m => m.tableNo ?? null));
    const times  = distinct(picked.map(m => m.scheduledAt ?? null));

    setAssignModal({ matchIds: Array.from(selectedIds) });
    setAssignForm({
      tableNo: tables.length === 1 && tables[0] != null ? String(tables[0]) : "",
      scheduledAt: times.length === 1 && times[0] ? toDatetimeLocalValue(times[0]) : "",
      clearTable: false,
      clearScheduledAt: false,
    });
  }, [selectedIds, stages]);

  const allMatches = useCallback(() => stages.flatMap(s => s.matches || []), [stages]);
  const findMatchById = useCallback((id) => allMatches().find(m => m.id === id) || null, [allMatches]);

  /** Trùng bàn + khung giờ: cùng số bàn, [start,end) giao [oStart,oEnd) với trận chưa kết thúc. */
  const findTableConflict = useCallback((excludeIds, tableNo, scheduledAtIso, target) => {
    if (!tableNo || !scheduledAtIso || !target) return null;
    const gameType = tournament?.gameType;
    const start = new Date(scheduledAtIso).getTime();
    const end = start + estMatchMinutes(target.raceTo, gameType) * 60000;
    for (const m of allMatches()) {
      if (excludeIds.includes(m.id)) continue;
      if (["BYE", "COMPLETED", "WALKOVER"].includes(m.status)) continue;
      if (String(m.tableNo ?? "") !== String(tableNo)) continue;
      if (!m.scheduledAt) continue;
      const oStart = new Date(m.scheduledAt).getTime();
      const oEnd = matchEndMs(m, gameType);
      if (oEnd == null) continue;
      if (start < oEnd && oStart < end) return m; // giao khung giờ
    }
    return null;
  }, [allMatches, tournament]);

  /** Phụ thuộc: trận không được bắt đầu trước khi các trận nguồn (feeder) kết thúc. Trả về feeder vi phạm sớm nhất. */
  const findFeederViolation = useCallback((targetId, scheduledAtIso) => {
    if (!scheduledAtIso) return null;
    const gameType = tournament?.gameType;
    const start = new Date(scheduledAtIso).getTime();
    let worst = null;
    for (const m of allMatches()) {
      if (m.id === targetId) continue;
      const feeds = m.nextMatchWinId === targetId || m.nextMatchLoseId === targetId;
      if (!feeds) continue;
      const fEnd = matchEndMs(m, gameType);
      if (fEnd != null && start < fEnd) {
        if (!worst || fEnd > worst.end) worst = { match: m, end: fEnd };
      }
    }
    return worst;
  }, [allMatches, tournament]);

  /**
   * Tải hiện tại của trọng tài `staffId` — bao nhiêu trận chưa kết thúc đang gán cho họ.
   *
   * Một trọng tài ĐƯỢC phép phụ trách nhiều trận cùng lúc (họ đứng giữa vài bàn kề nhau
   * và ghi tỉ số qua lại), nên hàm này KHÔNG còn để chặn như trước — chỉ để hiện số liệu
   * cho người phân công tự cân. `overlapping` vẫn tính riêng vì trùng giờ là thứ đáng
   * cảnh báo, dù không cấm.
   *
   * Chỉ xét trong giải hiện tại; trọng tài có thể còn trận ở giải khác mà FE không thấy.
   */
  const refereeLoadInfo = useCallback((staffId, targetMatch) => {
    const gameType = tournament?.gameType;
    const tStart = targetMatch?.scheduledAt ? new Date(targetMatch.scheduledAt).getTime() : null;
    const tEnd = tStart != null ? tStart + estMatchMinutes(targetMatch?.raceTo, gameType) * 60000 : null;
    let live = 0, upcoming = 0, overlapping = 0;
    for (const m of allMatches()) {
      if (targetMatch && m.id === targetMatch.id) continue;
      if (["BYE", "COMPLETED", "WALKOVER"].includes(m.status)) continue;
      if (String(m.assignedStaff?.id ?? "") !== String(staffId)) continue;
      if (m.status === "IN_PROGRESS") live += 1; else upcoming += 1;
      if (tStart != null && tEnd != null && m.scheduledAt) {
        const oStart = new Date(m.scheduledAt).getTime();
        const oEnd = matchEndMs(m, gameType);
        if (oEnd != null && tStart < oEnd && oStart < tEnd) overlapping += 1;
      }
    }
    return { live, upcoming, overlapping, total: live + upcoming };
  }, [allMatches, tournament]);

  const doSaveAssign = useCallback(async (opts = {}) => {
    if (!assignModal) return;
    const { matchIds } = assignModal;
    const body = {
      tableNo: assignForm.clearTable || !assignForm.tableNo ? null : Number(assignForm.tableNo),
      clearTable: assignForm.clearTable,
      scheduledAt: assignForm.clearScheduledAt ? null : fromDatetimeLocalValue(assignForm.scheduledAt),
      clearScheduledAt: assignForm.clearScheduledAt,
      ignoreTableConflict: !!opts.ignoreTableConflict,
    };
    setAssigning(true);
    try {
      if (matchIds.length === 1) {
        await api.assignMatch(matchIds[0], body);
      } else {
        await api.bulkAssignMatches({ matchIds, ...body });
      }
      toast.success("Đã lưu bàn & giờ thi đấu");
      setAssignModal(null);
      setBulkMode(false);
      load(); // reschedule ở BE có thể đổi giờ nhiều trận → tải lại
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setAssigning(false);
    }
  }, [assignModal, assignForm, api, load]);

  const handleResetAuto = useCallback(async () => {
    if (!assignModal) return;
    setAssigning(true);
    try {
      const { matchIds } = assignModal;
      if (matchIds.length === 1) {
        await api.assignMatch(matchIds[0], { resetToAuto: true });
      } else {
        await api.bulkAssignMatches({ matchIds, resetToAuto: true });
      }
      toast.success("Đã trả về tự động xếp lịch");
      setAssignModal(null);
      setBulkMode(false);
      load();
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setAssigning(false);
    }
  }, [assignModal, api, load]);

  const handleSaveAssign = useCallback(() => {
    if (!assignModal) return;
    const scheduledAtIso = assignForm.clearScheduledAt ? null : fromDatetimeLocalValue(assignForm.scheduledAt);

    // Không cho xếp trước giờ bắt đầu giải (áp dụng cả gán đơn lẫn bulk)
    if (scheduledAtIso && tournament?.startAt
        && new Date(scheduledAtIso).getTime() < new Date(tournament.startAt).getTime()) {
      toast.error(`Giờ thi đấu không được trước giờ bắt đầu giải (${formatScheduledAt(tournament.startAt)}).`);
      return;
    }

    const single = assignModal.matchIds.length === 1;
    const target = findMatchById(assignModal.matchIds[0]);

    // 1) Phụ thuộc — CHẶN cứng, không cho lưu. Chỉ áp dụng khi gán 1 trận, vì mỗi trận
    //    có tập trận nguồn riêng.
    if (single && scheduledAtIso) {
      const violation = target ? findFeederViolation(target.id, scheduledAtIso) : null;
      if (violation) {
        toast.error(
          `Không thể xếp trước trận nguồn "${violation.match.matchCode}" (dự kiến kết thúc ${formatScheduledAt(new Date(violation.end).toISOString())}).`
        );
        return;
      }
    }

    // 2) Trùng bàn & giờ — cảnh báo, cho phép vẫn lưu.
    //
    //    Ô "Số bàn" để trống nghĩa là GIỮ NGUYÊN bàn hiện tại (BE coi tableNo=null kèm
    //    clearTable=false là không đổi). Trước đây chỗ này soát theo đúng ô đang trống nên
    //    thoát sớm và không cảnh báo gì — đổi mỗi giờ thi đấu là lọt lưới hoàn toàn.
    //    Giờ lấy bàn thật của trận làm mốc soát.
    const effectiveTableNo = assignForm.clearTable
      ? null
      : (assignForm.tableNo || (single ? target?.tableNo : null) || null);

    if (scheduledAtIso && effectiveTableNo) {
      const conflict = findTableConflict(assignModal.matchIds, effectiveTableNo, scheduledAtIso, target);
      if (conflict) {
        showConfirm(
          "Trùng bàn & giờ?",
          `Bàn ${effectiveTableNo} đã có trận ${conflict.matchCode} lúc ${formatScheduledAt(conflict.scheduledAt)} trong khung giờ này — vẫn lưu?`,
          () => doSaveAssign({ ignoreTableConflict: true }),
          { okLabel: "Vẫn lưu", okVariant: "primary" }
        );
        return;
      }
    }
    doSaveAssign();
  }, [assignModal, assignForm, tournament, findMatchById, findFeederViolation, findTableConflict, doSaveAssign, showConfirm]);

  /* ── Gán trọng tài (tách riêng) ── */
  const openReferee = useCallback((match) => {
    setRefereeModal({ match });
    setRefereeStaffId(match.assignedStaff?.id != null ? String(match.assignedStaff.id) : "");
  }, []);

  const saveReferee = useCallback(async (clear = false) => {
    if (!refereeModal) return;
    const matchId = refereeModal.match.id;
    setSavingReferee(true);
    try {
      if (clear) {
        await api.assignMatch(matchId, { clearAssignedStaff: true });
        toast.success("Đã bỏ gán trọng tài");
      } else {
        if (!refereeStaffId) { toast.warn("Chọn trọng tài trước"); setSavingReferee(false); return; }
        await api.assignMatch(matchId, { assignedStaffId: Number(refereeStaffId) });
        toast.success("Đã gán trọng tài");
      }
      setRefereeModal(null);
      load();
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setSavingReferee(false);
    }
  }, [refereeModal, refereeStaffId, api, load]);

  const loadEvents = async (matchId, matchCode) => {
    setEventsModal({ matchId, matchCode }); setEvents([]);
    try {
      const { getMatchEvents } = await import("../../../api/matchApi");
      const data = await getMatchEvents(matchId);
      setEvents(Array.isArray(data) ? data : []);
    } catch { setEvents([]); }
  };

  /* ══ Render ═════════════════════════════════════════════ */
  if (loading) return (
    <div className="flex flex-col items-center justify-center py-24 gap-3">
      <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      <p className="text-sm text-slate-400 dark:text-white/40">Đang tải bracket...</p>
    </div>
  );

  return (
    <div className="space-y-5">

      {/* ── Top bar ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <AdminButton variant="secondary" onClick={goBack}>
            <ArrowLeft size={14} /> Quay lại
          </AdminButton>
          {!noDrawYet && (
            <SocketConnectionBadge connectionState={connectionState} compact />
          )}
          {!noDrawYet && (
            <div className="inline-flex items-center rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#161a22] p-0.5 text-sm">
              <button
                onClick={() => setViewMode("list")}
                className={[
                  "inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md font-semibold transition-colors",
                  viewMode === "list" ? "bg-indigo-600 text-white" : "text-slate-500 dark:text-white/60 hover:text-slate-700 dark:hover:text-white/75",
                ].join(" ")}>
                <List size={14} /> Danh sách
              </button>
              <button
                onClick={() => setViewMode("diagram")}
                className={[
                  "inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md font-semibold transition-colors",
                  viewMode === "diagram" ? "bg-indigo-600 text-white" : "text-slate-500 dark:text-white/60 hover:text-slate-700 dark:hover:text-white/75",
                ].join(" ")}>
                <GitBranch size={14} /> Sơ đồ
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {noDrawYet && (
            <>
              {ceremonySupported && (
                <CeremonyButton drawing={drawing} onClick={handlePublicDraw} />
              )}
              <AdminButton variant={ceremonySupported ? "secondary" : "primary"} disabled={drawing} onClick={handleDraw}
                           className="flex items-center gap-2">
                <Shuffle size={15} />
                {drawing ? "Đang bốc thăm..." : "Sinh bracket (Bốc thăm)"}
              </AdminButton>
            </>
          )}

          {!noDrawYet && isPreview && (
            <>
              {ceremonySupported && (
                <CeremonyButton drawing={drawing} disabled={confirming||swapping} onClick={handlePublicDraw} redo />
              )}
              <AdminButton variant="secondary" disabled={drawing||confirming||swapping} onClick={handleDraw}
                           className="flex items-center gap-2">
                <Shuffle size={14} />
                {drawing ? "Đang bốc thăm..." : "Bốc thăm lại"}
              </AdminButton>

              <button
                onClick={() => { setEditMode(v => !v); setSwapFirst(null); }}
                className={[
                  "inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-all border",
                  editMode
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-200"
                    : "bg-white dark:bg-[#161a22] text-slate-700 dark:text-white/75 border-slate-200 dark:border-white/10 hover:border-indigo-300 hover:text-indigo-700",
                ].join(" ")}>
                <ArrowLeftRight size={14} />
                {editMode ? "Đang chỉnh sửa…" : "Chỉnh sửa cặp đấu"}
              </button>

              <AdminButton variant="success" disabled={confirming||drawing||swapping} onClick={handleConfirmDraw}
                           className="flex items-center gap-2">
                <Lock size={14} />
                {confirming ? "Đang xác nhận..." : "Xác nhận bracket"}
              </AdminButton>

              {/* Cùng một hành động với "Huỷ bốc thăm" trong màn chiếu — người dẫn có thể
                  chọn "Giữ kết quả & đóng" rồi mới quyết định bỏ, nên phải có cả ở đây. */}
              <AdminButton variant="danger" disabled={cancellingDraw||confirming||drawing||swapping}
                           onClick={handleCancelDraw} className="flex items-center gap-2">
                <Trash2 size={14} />
                {cancellingDraw ? "Đang hủy..." : "Hủy bốc thăm"}
              </AdminButton>
            </>
          )}

          {!noDrawYet && !isPreview && (
            <div className="flex items-center gap-3 flex-wrap">
              {/* Progress bar */}
              <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-white/60">
                <span className="font-semibold text-slate-800 dark:text-white/85">{doneMatches}</span>
                <span className="text-slate-400 dark:text-white/40">/{totalMatches} trận</span>
                <div className="w-24 h-2 bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full transition-all"
                       style={{ width: `${progress}%` }} />
                </div>
                <span className="text-xs font-semibold text-emerald-600">{progress}%</span>
              </div>

              <button
                onClick={() => setBulkMode(v => !v)}
                className={[
                  "inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-all border",
                  bulkMode
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-200"
                    : "bg-white dark:bg-[#161a22] text-slate-700 dark:text-white/75 border-slate-200 dark:border-white/10 hover:border-indigo-300 hover:text-indigo-700",
                ].join(" ")}>
                <CheckSquare size={14} />
                {bulkMode ? "Đang chọn nhiều…" : "Chọn nhiều — gán bàn/giờ"}
              </button>

              {/* Bracket đã chốt, giải chưa chạy — bắt đầu ngay tại đây, khỏi quay về trang chi tiết */}
              {isDrawDone && (
                <AdminButton variant="success" disabled={startingTournament}
                             onClick={handleStartTournament}
                             className="flex items-center gap-2">
                  <Play size={14} />
                  {startingTournament ? "Đang bắt đầu..." : "Bắt đầu giải đấu"}
                </AdminButton>
              )}

              {/* CUT_TO_SE: populate final bracket button */}
              {isDoubleElim && hasFinalBracket && !isFinalBracketReady && (
                <AdminButton variant="primary" disabled={populating}
                             onClick={handlePopulateFinalBracket}
                             className="flex items-center gap-2">
                  <Zap size={14} />
                  {populating ? "Đang điền..." : "Điền bracket Last X"}
                </AdminButton>
              )}


              {/* PROGRESSIVE_ROUND_ROBIN: standings từng GĐ + chuyển giai đoạn */}
              {isProgressive && currentProgressiveStage && (
                <>
                  <AdminButton variant="secondary"
                               onClick={() => openProgStandings(currentProgressiveStage)}
                               className="flex items-center gap-2">
                    <BarChart2 size={14} /> Xếp hạng giai đoạn
                  </AdminButton>
                  <AdminButton variant="primary" disabled={advancing || !canAdvanceStage}
                               onClick={handleAdvanceStage}
                               className="flex items-center gap-2"
                               title={canAdvanceStage ? "" : "Hoàn thành tất cả trận của giai đoạn hiện tại trước"}>
                    <ChevronRight size={14} />
                    {advancing ? "Đang chuyển..." : "Chuyển giai đoạn tiếp theo"}
                  </AdminButton>
                </>
              )}
            </div>
          )}

          {/* FINAL_BRACKET_READY banner */}
          {isFinalBracketReady && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-50 border border-emerald-200 text-sm text-emerald-700 font-medium">
              <CheckCircle size={14} /> Bracket Last X đã sẵn sàng — đang thi đấu loại trực tiếp
            </div>
          )}
        </div>
      </div>

      {/* ── Preview banner ── */}
      {!noDrawYet && isPreview && (
        <div className="rounded-xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 px-5 py-3.5">
          <div className="flex items-start gap-3">
            <Eye size={16} className="text-amber-500 mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-amber-800">Chế độ xem trước (Preview)</p>
              <p className="text-xs text-amber-600 mt-0.5">
                Bracket chưa được xác nhận. Bạn có thể bốc thăm lại hoặc chỉnh sửa cặp đấu ở Vòng 1 trước khi xác nhận.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit mode instruction bar ── */}
      {editMode && (
        <div className={[
          "rounded-xl border px-4 py-3 transition-all",
          swapFirst
            ? "bg-indigo-50 border-indigo-300"
            : "bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10",
        ].join(" ")}>
          <div className="flex items-center gap-2 text-sm">
            {swapFirst ? (
              <>
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse shrink-0" />
                  <span className="text-indigo-700">
                    Đã chọn <strong>{swapFirst.playerName}</strong>
                    <span className="font-mono text-xs ml-1 text-indigo-500">({swapFirst.matchCode})</span>
                    — click người chơi khác ở Vòng 1 để đổi chỗ
                  </span>
                </div>
                <button onClick={() => setSwapFirst(null)}
                        className="shrink-0 text-xs text-indigo-400 hover:text-indigo-700 underline">
                  Bỏ chọn
                </button>
              </>
            ) : (
              <>
                <ArrowLeftRight size={14} className="text-slate-500 dark:text-white/60 shrink-0" />
                <span className="text-slate-600 dark:text-white/70">
                  Chế độ chỉnh sửa đang bật — <strong>kéo thả</strong> hoặc <strong>click</strong> vào người chơi ở Vòng 1 để đổi chỗ.
                  Nhấn <kbd className="px-1 py-0.5 bg-white dark:bg-[#161a22] border border-slate-200 dark:border-white/10 rounded text-xs font-mono">🔍</kbd> để tìm kiếm.
                </span>
              </>
            )}
          </div>
        </div>
      )}

      {!noDrawYet && (
        <SocketReconnectBanner connectionState={connectionState} />
      )}

      {/* ── Bulk-select action bar ── */}
      {bulkMode && (
        <div className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl bg-indigo-50 border border-indigo-200">
          <span className="text-sm text-indigo-700">
            Đã chọn <strong>{selectedIds.size}</strong> trận — tick vào các trận muốn gán cùng lúc.
          </span>
          <div className="flex items-center gap-2 shrink-0">
            <AdminButton variant="secondary" onClick={() => setSelectedIds(new Set())} disabled={selectedIds.size === 0}>
              Bỏ chọn
            </AdminButton>
            <AdminButton variant="primary" disabled={selectedIds.size === 0} onClick={openAssignBulk}
                         className="flex items-center gap-2">
              <MapPin size={14} /> Gán bàn & giờ ({selectedIds.size})
            </AdminButton>
          </div>
        </div>
      )}

      {/* ── Tìm kiếm / lọc trận đấu ── */}
      {!noDrawYet && !isPreview && (
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-white/40" />
            <input
              type="text"
              className="admin-input w-full pl-8 pr-8 text-sm"
              placeholder="Tìm mã trận hoặc tên cơ thủ..."
              value={matchQuery}
              onChange={e => setMatchQuery(e.target.value)}
            />
            {matchQuery && (
              <button
                onClick={() => setMatchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-300 dark:text-white/30 hover:text-slate-500 dark:hover:text-white/60"
                aria-label="Xoá tìm kiếm"
              >
                <X size={13} />
              </button>
            )}
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            {MATCH_FILTERS.map(f => (
              <button
                key={f.key}
                onClick={() => setStatusFilter(f.key)}
                className={[
                  "px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors",
                  statusFilter === f.key
                    ? "bg-indigo-600 text-white border-indigo-600"
                    : "bg-white dark:bg-[#161a22] text-slate-600 dark:text-white/70 border-slate-200 dark:border-white/10 hover:border-indigo-300 hover:text-indigo-700",
                ].join(" ")}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Empty state ── */}
      {noDrawYet ? (
        <AdminCard>
          <div className="py-20 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-white/10 flex items-center justify-center mx-auto">
              <Swords size={28} className="text-slate-400 dark:text-white/40" />
            </div>
            <div>
              <p className="font-semibold text-slate-700 dark:text-white/75">Chưa có bracket</p>
              <p className="text-sm text-slate-400 dark:text-white/40 mt-1">
                Đảm bảo giải đang ở trạng thái <span className="font-medium">Đóng đăng ký</span> và có ít nhất 2 người tham gia.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 flex-wrap">
              {ceremonySupported && (
                <CeremonyButton drawing={drawing} onClick={handlePublicDraw} />
              )}
              <AdminButton variant={ceremonySupported ? "secondary" : "primary"} disabled={drawing} onClick={handleDraw}
                           className="inline-flex items-center gap-2">
                <Shuffle size={15} />
                {drawing ? "Đang bốc thăm..." : "Sinh bracket ngay"}
              </AdminButton>
            </div>
            {ceremonySupported && (
              <p className="text-xs text-slate-400 dark:text-white/40">
                Bốc thăm công khai: cùng một kết quả, nhưng trình chiếu từng cơ thủ vào cây thi đấu để khán giả theo dõi.
              </p>
            )}
            {ceremonyBlockedBySeeding && (
              <p className="text-xs text-slate-400 dark:text-white/40 max-w-lg mx-auto">
                Giải này xếp cặp <span className="font-medium">{seedingLabel ?? "theo cấu hình sẵn"}</span>, không
                phải bốc thăm ngẫu nhiên — nên không có phần bốc thăm công khai. Vị trí các cơ thủ do cấu hình quyết
                định, ban tổ chức chỉnh lại cặp đấu sau khi sinh bracket.
              </p>
            )}
          </div>
        </AdminCard>
      ) : viewMode === "diagram" ? (
        <BracketDiagram
          stages={stages}
          startingId={startingId}
          flashIds={flashIds}
          onStart={handleStart}
          onScore={(m) => { setScoreModal(m); setScoreForm({ p1: String(m.player1Score??0), p2: String(m.player2Score??0) }); }}
          onComplete={setCompleteModal}
          ListStageSection={StageSection}
          listProps={{
            editMode, swapFirst, dragSrc, dropTarget, swapping, isPreview,
            matchQuery, statusFilter, startingId, bulkMode, selectedIds,
            onSlotClick: handleSlotClick, onDragStart, onDragOver, onDragLeave, onDrop, onDragEnd,
            onOpenSearch: openSearch, onStart: handleStart,
            onScore: (m) => { setScoreModal(m); setScoreForm({ p1: String(m.player1Score??0), p2: String(m.player2Score??0) }); },
            onComplete: setCompleteModal, onEvents: loadEvents,
            onToggleSelect: toggleSelect, onOpenAssign: openAssignSingle, flashIds,
            feedersMap: listFeedersMap,
          }}
        />
      ) : (
        <>
          {/* Thanh tab giai đoạn — mỗi giai đoạn là 1 trang, click để chuyển */}
          {stages.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {stages.map(stage => {
                const ms = stage.matches || [];
                const done = ms.filter(m => ["COMPLETED","WALKOVER","BYE"].includes(m.status)).length;
                const total = ms.length;
                const active = stage.id === activeStageId;
                const isDone = total > 0 && done === total;
                return (
                  <button
                    key={stage.id}
                    onClick={() => setActiveStageId(stage.id)}
                    className={[
                      "shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-all",
                      active
                        ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-200"
                        : "bg-white dark:bg-[#161a22] text-slate-600 dark:text-white/70 border-slate-200 dark:border-white/10 hover:border-indigo-300 hover:text-indigo-700",
                    ].join(" ")}
                  >
                    <span className="truncate max-w-[180px]">{stage.name}</span>
                    <span className={[
                      "text-[11px] font-medium px-1.5 py-0.5 rounded-md",
                      active ? "bg-white/15 text-white"
                        : isDone ? "bg-emerald-100 text-emerald-700"
                        : "bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-white/60",
                    ].join(" ")}>
                      {done}/{total}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {stages.filter(stage => stages.length === 1 || stage.id === activeStageId).map(stage => (
          <StageSection
            key={stage.id}
            stage={stage}
            feedersMap={listFeedersMap}
            editMode={editMode}
            swapFirst={swapFirst}
            dragSrc={dragSrc}
            dropTarget={dropTarget}
            swapping={swapping}
            isPreview={isPreview}
            matchQuery={matchQuery}
            statusFilter={statusFilter}
            startingId={startingId}
            bulkMode={bulkMode}
            selectedIds={selectedIds}
            onSlotClick={handleSlotClick}
            onDragStart={onDragStart}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            onDragEnd={onDragEnd}
            onOpenSearch={openSearch}
            onStart={handleStart}
            onScore={(m) => { setScoreModal(m); setScoreForm({ p1: String(m.player1Score??0), p2: String(m.player2Score??0) }); }}
            onComplete={setCompleteModal}
            onEvents={loadEvents}
            onToggleSelect={toggleSelect}
            onOpenAssign={openAssignSingle}
            onOpenReferee={openReferee}
            flashIds={flashIds}
          />
          ))}
        </>
      )}

      {/* ══ Modals ═══════════════════════════════════════════════ */}

      {/* Generic confirm (replaces window.confirm) */}
      <AdminModal
        open={!!confirmModal}
        onClose={() => setConfirmModal(null)}
        title={confirmModal?.title}
        footer={
          <>
            <AdminButton variant="secondary" onClick={() => setConfirmModal(null)}>Hủy</AdminButton>
            <AdminButton
              variant={confirmModal?.okVariant ?? "primary"}
              onClick={() => { const cb = confirmModal?.onOk; setConfirmModal(null); cb?.(); }}>
              {confirmModal?.okLabel ?? "Xác nhận"}
            </AdminButton>
          </>
        }
      >
        <p className="text-sm text-slate-600 dark:text-white/70">{confirmModal?.body}</p>
      </AdminModal>

      {/* PROGRESSIVE: standings từng giai đoạn (read-only) */}
      <AdminModal
        open={!!progStandings}
        onClose={() => setProgStandings(null)}
        title={`Bảng xếp hạng — ${progStandings?.stageName || ""}`}
        size="lg"
        footer={<AdminButton variant="secondary" onClick={() => setProgStandings(null)}>Đóng</AdminButton>}
      >
        <div className="max-h-72 overflow-y-auto border border-slate-100 dark:border-white/10 rounded-xl">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-white/5 text-slate-500 dark:text-white/60 text-xs uppercase">
              <tr>
                <th className="px-3 py-2 text-left">#</th>
                <th className="px-3 py-2 text-left">Cơ thủ</th>
                <th className="px-3 py-2 text-center">Thắng</th>
                <th className="px-3 py-2 text-center">Hiệu số</th>
                <th className="px-3 py-2 text-center">Frame</th>
                <th className="px-3 py-2 text-center">Đi tiếp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loadingProgStd ? (
                <tr><td colSpan={6} className="px-3 py-6 text-center text-slate-400 dark:text-white/40 text-xs">Đang tải...</td></tr>
              ) : (progStandings?.rows || []).length === 0 ? (
                <tr><td colSpan={6} className="px-3 py-6 text-center text-slate-400 dark:text-white/40 text-xs">Chưa có kết quả</td></tr>
              ) : progStandings.rows.map(s => (
                <tr key={s.participantId} className={s.advancesToPlayoff ? "bg-emerald-50" : (s.advancesToPlayoff === false ? "bg-red-50/40" : "")}>
                  <td className="px-3 py-2 font-mono text-slate-500 dark:text-white/60">{s.rank}</td>
                  <td className="px-3 py-2 font-medium text-slate-800 dark:text-white/85">{s.displayName}</td>
                  <td className="px-3 py-2 text-center text-slate-700 dark:text-white/75">{s.wins}</td>
                  <td className={`px-3 py-2 text-center font-medium ${s.frameDiff >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                    {s.frameDiff >= 0 ? "+" : ""}{s.frameDiff}
                  </td>
                  <td className="px-3 py-2 text-center text-slate-500 dark:text-white/60">{s.framesWon}</td>
                  <td className="px-3 py-2 text-center">
                    {s.advancesToPlayoff === true ? (
                      <span className="text-emerald-600 text-xs font-semibold">Đi tiếp</span>
                    ) : s.advancesToPlayoff === false ? (
                      <span className="text-red-500 text-xs">Bị loại</span>
                    ) : <span className="text-slate-300">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-slate-400 dark:text-white/40">
          Tiêu chí: Điểm (thắng) → Hiệu số rack → Rack thắng → Đối đầu trực tiếp. Hàng xanh = nhóm đi tiếp.
        </p>
      </AdminModal>

      {/* Swap confirm */}
      <AdminModal
        open={!!swapConfirm}
        onClose={() => setSwapConfirm(null)}
        title="Xác nhận đổi chỗ"
        footer={
          <>
            <AdminButton variant="secondary" disabled={swapping} onClick={() => setSwapConfirm(null)}>Hủy</AdminButton>
            <AdminButton variant="primary" disabled={swapping}
                         onClick={async () => {
                           await performSwap(swapConfirm.first.matchId, swapConfirm.first.slot,
                                             swapConfirm.second.matchId, swapConfirm.second.slot);
                           setSwapConfirm(null);
                         }}>
              {swapping ? "Đang đổi..." : "Xác nhận"}
            </AdminButton>
          </>
        }
      >
        <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-white/5 rounded-lg">
          <PlayerAvatar name={swapConfirm?.first.playerName} size="md" />
          <div className="text-sm">
            <p className="font-semibold text-slate-800 dark:text-white/85">{swapConfirm?.first.playerName}</p>
            <p className="text-xs text-slate-400 dark:text-white/40 font-mono">{swapConfirm?.first.matchCode} · {swapConfirm?.first.slot === "player1" ? "P1" : "P2"}</p>
          </div>
          <ArrowLeftRight size={16} className="text-indigo-400 mx-auto" />
          <PlayerAvatar name={swapConfirm?.second.playerName} size="md" />
          <div className="text-sm">
            <p className="font-semibold text-slate-800 dark:text-white/85">{swapConfirm?.second.playerName}</p>
            <p className="text-xs text-slate-400 dark:text-white/40 font-mono">{swapConfirm?.second.matchCode} · {swapConfirm?.second.slot === "player1" ? "P1" : "P2"}</p>
          </div>
        </div>
      </AdminModal>

      {/* Player search / assign */}
      <AdminModal
        open={!!searchModal}
        onClose={() => setSearchModal(null)}
        title={`Chọn người chơi — ${searchModal?.matchCode} (${searchModal?.slot === "player1" ? "Người chơi 1" : "Người chơi 2"})`}
        size="lg"
        footer={<AdminButton variant="secondary" onClick={() => setSearchModal(null)}>Đóng</AdminButton>}
      >
        <div className="space-y-3">
          {/* Current assignment */}
          {searchModal?.currentPlayer && (
            <div className="flex items-center gap-2 text-sm p-2 bg-indigo-50 rounded-lg border border-indigo-100">
              <PlayerAvatar name={searchModal.currentPlayer.displayName} size="sm" />
              <span className="text-indigo-700">
                Hiện tại: <strong>{searchModal.currentPlayer.displayName}</strong>
              </span>
            </div>
          )}

          {/* Search box */}
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-white/40" />
            <input
              type="text"
              className="admin-input pl-9"
              placeholder="Tìm theo tên..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              autoFocus
            />
          </div>

          {/* Participant list */}
          <div className="max-h-72 overflow-y-auto divide-y divide-slate-50 border border-slate-100 dark:border-white/10 rounded-xl">
            {loadingPtcp ? (
              <div className="py-6 text-center text-sm text-slate-400 dark:text-white/40">Đang tải...</div>
            ) : filteredPtcp.length === 0 ? (
              <div className="py-6 text-center text-sm text-slate-400 dark:text-white/40">Không tìm thấy</div>
            ) : filteredPtcp.map(p => {
              const pos = r1PlayerMap.get(p.id);
              const isCurrent = pos && pos.matchId === searchModal?.matchId && pos.slot === searchModal?.slot;
              return (
                <button
                  key={p.id}
                  disabled={isCurrent || swapping}
                  onClick={() => handleAssign(p)}
                  className={[
                    "w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors",
                    isCurrent
                      ? "bg-indigo-50 cursor-default"
                      : "hover:bg-slate-50 dark:hover:bg-white/5 active:bg-slate-100 dark:active:bg-white/10 cursor-pointer",
                  ].join(" ")}
                >
                  <PlayerAvatar name={p.displayName} id={p.id} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-800 dark:text-white/85 truncate">{p.displayName}</p>
                    {pos && (
                      <p className="text-xs text-slate-400 dark:text-white/40 font-mono">
                        {pos.matchCode} · {pos.slot === "player1" ? "P1" : "P2"}
                      </p>
                    )}
                  </div>
                  {isCurrent && (
                    <span className="text-xs px-2 py-0.5 bg-indigo-100 text-indigo-600 rounded-full font-medium shrink-0">
                      Hiện tại
                    </span>
                  )}
                  {!isCurrent && pos && (
                    <ChevronRight size={14} className="text-slate-300 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
          <p className="text-xs text-slate-400 dark:text-white/40">
            <Users size={11} className="inline mr-1" />
            {filteredPtcp.length} người chơi · Click để đổi chỗ với người chơi đã chọn
          </p>
        </div>
      </AdminModal>

      {/* Score */}
      <AdminModal
        open={!!scoreModal}
        onClose={() => setScoreModal(null)}
        title={`Cập nhật tỷ số — ${scoreModal?.matchCode}`}
        footer={
          <>
            <AdminButton variant="secondary" onClick={() => setScoreModal(null)}>Hủy</AdminButton>
            <AdminButton variant="primary" disabled={saving} onClick={handleSaveScore}>
              {saving ? "Đang lưu..." : "Lưu tỷ số"}
            </AdminButton>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-4">
          {[
            { key: "p1", label: scoreModal?.player1?.displayName ?? "Player 1" },
            { key: "p2", label: scoreModal?.player2?.displayName ?? "Player 2" },
          ].map(({ key, label }) => (
            <div key={key}>
              <label className="admin-label">{label}</label>
              <input type="number" min={0} className="admin-input w-full mt-1"
                value={scoreForm[key]}
                onChange={e => setScoreForm(f => ({ ...f, [key]: e.target.value }))} />
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-400 dark:text-white/40 mt-3">Đánh tới: {scoreModal?.raceTo} ván</p>
      </AdminModal>

      {/* Complete / Walkover */}
      <AdminModal
        open={!!completeModal}
        onClose={closeCompleteModal}
        title={walkoverTarget
          ? `Xử thắng — ${completeModal?.matchCode}`
          : `Kết thúc trận — ${completeModal?.matchCode}`}
        footer={walkoverTarget ? (
          <>
            <AdminButton variant="secondary" disabled={saving}
                         onClick={() => { setWalkoverTarget(null); setWalkoverReason(""); }}>
              Quay lại
            </AdminButton>
            <AdminButton variant="primary" disabled={saving}
                         onClick={() => handleWalkover(walkoverTarget.id)}>
              {saving ? "Đang ghi nhận..." : "Xác nhận xử thắng"}
            </AdminButton>
          </>
        ) : (
          <AdminButton variant="secondary" onClick={closeCompleteModal}>Đóng</AdminButton>
        )}
      >
        {walkoverTarget ? (
          <>
            <div className="flex items-center gap-3 bg-amber-50 px-4 py-3 rounded-xl border border-amber-200 mb-4">
              <PlayerAvatar name={walkoverTarget.displayName} id={walkoverTarget.id} size="sm" />
              <div className="min-w-0">
                <p className="font-semibold text-slate-800 truncate">{walkoverTarget.displayName}</p>
                <p className="text-xs text-amber-700">Được xử thắng, trận không thi đấu</p>
              </div>
            </div>
            <label className="admin-label">Lý do xử thắng</label>
            <div className="flex flex-wrap gap-2 mt-1.5 mb-2">
              {["Đối thủ vắng mặt", "Đối thủ bỏ cuộc", "Đối thủ đến muộn quá giờ", "Đối thủ bị loại"]
                .map(preset => (
                  <button key={preset} type="button" onClick={() => setWalkoverReason(preset)}
                          className={[
                            "px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors",
                            walkoverReason === preset
                              ? "bg-indigo-600 text-white border-indigo-600"
                              : "bg-white text-slate-600 border-slate-200 hover:border-indigo-300",
                          ].join(" ")}>
                    {preset}
                  </button>
                ))}
            </div>
            <textarea
              className="admin-input w-full min-h-[70px]"
              placeholder="Nhập lý do hoặc chọn nhanh ở trên..."
              value={walkoverReason}
              onChange={e => setWalkoverReason(e.target.value)}
            />
            <p className="text-xs text-slate-400 mt-2">
              Lý do chỉ hiển thị lại để bạn xác nhận thao tác, <span className="font-medium">hệ thống
              chưa lưu lại</span>. Cần lưu vĩnh viễn thì ghi vào biên bản của Ban tổ chức.
            </p>
          </>
        ) : (
          <>
            <p className="text-sm text-slate-500 mb-4">Chọn người thắng trận này:</p>
            <div className="space-y-2">
              {[completeModal?.player1, completeModal?.player2].filter(Boolean).map(p => (
                <div key={p.id}
                     className="flex items-center gap-3 bg-slate-50 px-4 py-3 rounded-xl border border-slate-100">
                  <PlayerAvatar name={p.displayName} id={p.id} size="sm" />
                  <span className="flex-1 font-medium text-slate-800">{p.displayName}</span>
                  <div className="flex gap-2">
                    <AdminButton variant="primary" disabled={saving} onClick={() => handleComplete(p.id)}
                                 className="flex items-center gap-1">
                      <CheckCircle size={13} /> Thắng
                    </AdminButton>
                    <AdminButton variant="secondary" disabled={saving}
                                 onClick={() => { setWalkoverTarget(p); setWalkoverReason(""); }}
                                 title="Đối thủ vắng mặt hoặc bỏ cuộc — xử thắng mà không thi đấu">
                      Xử thắng
                    </AdminButton>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-400 mt-4 pt-3 border-t border-slate-100">
              <span className="font-medium text-slate-500">Thắng</span> — hai bên đã thi đấu và có kết quả.{" "}
              <span className="font-medium text-slate-500">Xử thắng</span> — đối thủ vắng mặt, bỏ cuộc hoặc
              bị loại, trận không diễn ra.
            </p>
          </>
        )}
      </AdminModal>

      {/* Score events */}
      <AdminModal
        open={!!eventsModal}
        onClose={() => { setEventsModal(null); setEvents([]); }}
        title={`Lịch sử — ${eventsModal?.matchCode}`}
        footer={<AdminButton variant="secondary" onClick={() => { setEventsModal(null); setEvents([]); }}>Đóng</AdminButton>}
      >
        {events.length === 0 ? (
          <p className="text-slate-400 dark:text-white/40 text-sm text-center py-6">Chưa có cập nhật nào.</p>
        ) : (
          <div className="space-y-1.5 max-h-72 overflow-y-auto">
            {events.map(ev => (
              <div key={ev.id}
                   className="flex items-center gap-3 text-sm bg-slate-50 dark:bg-white/5 px-3 py-2 rounded-lg">
                <span className={`px-2 py-0.5 rounded text-xs font-medium shrink-0 ${
                  ev.eventType === "MATCH_END" ? "bg-emerald-100 text-emerald-800"
                  : ev.eventType === "WALKOVER" ? "bg-amber-100 text-amber-800"
                  : "bg-blue-100 text-blue-800"}`}>
                  {ev.eventType}
                </span>
                <span className="font-mono font-bold text-slate-700 dark:text-white/75">
                  {ev.player1ScoreAfter} — {ev.player2ScoreAfter}
                </span>
                <span className="text-slate-400 dark:text-white/40 text-xs ml-auto truncate">
                  {ev.createdByName} · {ev.createdAt
                    ? new Date(ev.createdAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
                    : "—"}
                </span>
              </div>
            ))}
          </div>
        )}
      </AdminModal>

      {/* Gán bàn & giờ thi đấu (đơn + bulk) */}
      <AdminModal
        open={!!assignModal}
        onClose={() => !assigning && setAssignModal(null)}
        title={
          assignModal?.matchIds.length === 1
            ? "Gán bàn & giờ thi đấu"
            : `Gán bàn & giờ cho ${assignModal?.matchIds.length ?? 0} trận`
        }
        footer={
          <>
            <AdminButton variant="secondary" onClick={handleResetAuto} disabled={assigning}>
              Trả về tự động
            </AdminButton>
            <AdminButton variant="secondary" onClick={() => setAssignModal(null)} disabled={assigning}>
              Hủy
            </AdminButton>
            <AdminButton variant="primary" onClick={handleSaveAssign} disabled={assigning}>
              {assigning ? "Đang lưu…" : "Lưu"}
            </AdminButton>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="admin-label">Số bàn (1 – {tournament?.tableCount ?? 1})</label>
            <input
              type="number"
              min={1}
              max={tournament?.tableCount ?? 1}
              className="admin-input mt-1 w-full"
              placeholder="Không đổi / chưa chọn"
              value={assignForm.clearTable ? "" : assignForm.tableNo}
              disabled={assignForm.clearTable}
              onChange={(e) => setAssignForm(f => ({ ...f, tableNo: e.target.value }))}
            />
            <label className="mt-2 inline-flex items-center gap-2 text-xs text-slate-500 dark:text-white/60">
              <input
                type="checkbox"
                checked={assignForm.clearTable}
                onChange={(e) => setAssignForm(f => ({ ...f, clearTable: e.target.checked, tableNo: e.target.checked ? "" : f.tableNo }))}
              />
              Bỏ gán bàn
            </label>
          </div>

          <div>
            <label className="admin-label">Giờ thi đấu</label>
            <input
              type="datetime-local"
              className="admin-input mt-1 w-full"
              min={tournament?.startAt ? toDatetimeLocalValue(tournament.startAt) : undefined}
              value={assignForm.clearScheduledAt ? "" : assignForm.scheduledAt}
              disabled={assignForm.clearScheduledAt}
              onChange={(e) => setAssignForm(f => ({ ...f, scheduledAt: e.target.value }))}
            />
            {tournament?.startAt && (
              <p className="mt-1 text-[11px] text-slate-400 dark:text-white/40">
                Không sớm hơn giờ bắt đầu giải: {formatScheduledAt(tournament.startAt)}
              </p>
            )}
            <label className="mt-2 inline-flex items-center gap-2 text-xs text-slate-500 dark:text-white/60">
              <input
                type="checkbox"
                checked={assignForm.clearScheduledAt}
                onChange={(e) => setAssignForm(f => ({ ...f, clearScheduledAt: e.target.checked, scheduledAt: e.target.checked ? "" : f.scheduledAt }))}
              />
              Bỏ giờ thi đấu
            </label>
          </div>

          {assignModal?.matchIds.length > 1 && (
            <p className="text-xs text-slate-400 dark:text-white/40">
              Chỉ những trường có thay đổi (không để trống, không tick &quot;Bỏ&quot;) mới được áp dụng cho tất cả các trận đã chọn.
            </p>
          )}
        </div>
      </AdminModal>

      {/* Gán trọng tài (riêng) */}
      <AdminModal
        open={!!refereeModal}
        onClose={() => !savingReferee && setRefereeModal(null)}
        title="Gán trọng tài điều hành"
        footer={
          <>
            {refereeModal?.match?.assignedStaff && (
              <AdminButton variant="secondary" onClick={() => saveReferee(true)} disabled={savingReferee}>
                Bỏ trọng tài
              </AdminButton>
            )}
            <AdminButton variant="secondary" onClick={() => setRefereeModal(null)} disabled={savingReferee}>
              Hủy
            </AdminButton>
            <AdminButton variant="primary" onClick={() => saveReferee(false)} disabled={savingReferee || !refereeStaffId}>
              {savingReferee ? "Đang lưu…" : "Gán"}
            </AdminButton>
          </>
        }
      >
        {(() => {
          if (!refereeModal) return null;
          const target = refereeModal.match;
          /* KHÔNG lọc bỏ ai. Một trọng tài phụ trách được nhiều trận cùng lúc, nên việc
             của màn này là cho thấy ai đang gánh nhiều để người phân công tự cân —
             xếp người rảnh nhất lên đầu thay vì ẩn người đang bận. */
          const options = referees
            .map(r => ({ ...r, load: refereeLoadInfo(r.id, target) }))
            .sort((a, b) => a.load.total - b.load.total
              || String(a.displayName).localeCompare(String(b.displayName), "vi"));
          const picked = options.find(r => String(r.id) === String(refereeStaffId));
          return (
            <div className="space-y-3">
              <p className="text-xs text-slate-500 dark:text-white/60">
                Trận <span className="font-mono font-semibold">{target.matchCode}</span>
                {target.tableNo != null && <> · Bàn {target.tableNo}</>}
                {target.scheduledAt && <> · {formatScheduledAt(target.scheduledAt)}</>}
              </p>
              <div>
                <label className="admin-label">Chọn trọng tài</label>
                <select
                  className="admin-select mt-1 w-full"
                  value={refereeStaffId}
                  onChange={(e) => setRefereeStaffId(e.target.value)}
                >
                  <option value="">— Chọn trọng tài —</option>
                  {options.map(r => (
                    <option key={r.id} value={r.id}>
                      {r.displayName} — {refereeLoadLabel(r.load)}
                    </option>
                  ))}
                </select>
              </div>

              {picked && picked.load.total > 0 && (
                <div className={[
                  "rounded-lg px-3 py-2 text-[11px] border",
                  picked.load.overlapping > 0
                    ? "bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-400/10 dark:border-amber-400/30 dark:text-amber-300"
                    : "bg-slate-50 border-slate-200 text-slate-600 dark:bg-white/5 dark:border-white/10 dark:text-white/60",
                ].join(" ")}>
                  <span className="font-semibold">{picked.displayName}</span> đang giữ {picked.load.total} trận
                  chưa kết thúc
                  {picked.load.live > 0 && <> ({picked.load.live} đang đấu)</>}
                  {picked.load.overlapping > 0 && (
                    <>, trong đó <span className="font-semibold">{picked.load.overlapping} trận trùng khung giờ</span> với
                    trận này. Vẫn gán được — chỉ cần chắc là bàn đủ gần để một người bao được.</>
                  )}
                  {picked.load.overlapping === 0 && <>. Không trận nào trùng giờ với trận này.</>}
                </div>
              )}
              {referees.length === 0 ? (
                <p className="text-[11px] text-amber-600">
                  Chi nhánh của giải chưa có nhân viên (staff) nào để làm trọng tài.
                </p>
              ) : (
                <p className="text-[11px] text-slate-400 dark:text-white/40">
                  Một trọng tài có thể phụ trách nhiều trận cùng lúc và ghi tỉ số cho tất cả
                  các trận được gán. Danh sách xếp người đang giữ ít trận lên trước.
                </p>
              )}
            </div>
          );
        })()}
      </AdminModal>

      {/* ── Lễ bốc thăm công khai ──
          Bracket đã nằm trên server ngay khi API trả về; overlay chỉ trình diễn
          lại kết quả đó. Đóng overlay mới nạp lại trang như luồng cũ. */}
      {ceremonyResult && (
        <DrawCeremonyOverlay
          drawResult={ceremonyResult}
          tournament={tournament}
          onClose={handleCeremonyClose}
          onCancel={handleCeremonyCancel}
          cancelling={cancellingDraw}
        />
      )}
    </div>
  );
};

/* ══════════════════════════════════════════════════════════
   StageSection
══════════════════════════════════════════════════════════ */
const STAGE_ICON = {
  KNOCKOUT:    <Swords size={14} />,
  WINNERS:     <Trophy size={14} />,
  LOSERS:      <ArrowLeftRight size={14} />,
  GRAND_FINAL: <Trophy size={14} className="text-amber-500" />,
};

export const StageSection = ({
  stage, editMode, swapFirst, dragSrc, dropTarget, swapping, isPreview,
  matchQuery, statusFilter, startingId, bulkMode, selectedIds,
  onSlotClick, onDragStart, onDragOver, onDragLeave, onDrop, onDragEnd,
  onOpenSearch, onStart, onScore, onComplete, onEvents, onToggleSelect, onOpenAssign, onOpenReferee, flashIds,
  feedersMap,
}) => {
  const rounds = {};
  (stage.matches || []).forEach(m => {
    if (!rounds[m.roundNo]) rounds[m.roundNo] = [];
    rounds[m.roundNo].push(m);
  });
  const sortedRounds = Object.entries(rounds).sort(([a],[b]) => Number(a) - Number(b));
  const totalRounds  = sortedRounds.length;
  const doneCount    = stage.matches?.filter(m => ["COMPLETED","WALKOVER","BYE"].includes(m.status)).length ?? 0;
  const totalCount   = stage.matches?.length ?? 0;
  const isEditable   = EDITABLE_STAGES.includes(stage.stageType);

  // Vòng đang chọn để xem — mặc định vòng đầu tiên còn trận chưa xong (giúp không phải cuộn qua
  // cả bracket khi có nhiều trận). Giữ state cục bộ theo key=stage.id nên không bị reset khi WS cập nhật.
  const [activeRound, setActiveRound] = useState(() => computeDefaultRound(sortedRounds));
  useEffect(() => {
    if (activeRound == null && sortedRounds.length) setActiveRound(computeDefaultRound(sortedRounds));
  }, [sortedRounds, activeRound]);

  const isSearching = Boolean(matchQuery.trim()) || statusFilter !== "ALL";

  const visibleRounds = isSearching
    ? sortedRounds
    : sortedRounds.filter(([roundNo]) => Number(roundNo) === activeRound);

  const filteredRounds = visibleRounds
    .map(([roundNo, matches]) => [roundNo, matches.filter(m => matchPassesFilter(m, statusFilter, matchQuery))])
    .filter(([, matches]) => matches.length > 0);

  return (
    <AdminCard padding={false}>
      {/* Stage header */}
      <div className="px-5 py-4 border-b border-slate-100 dark:border-white/10 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-white/10 flex items-center justify-center text-slate-500 dark:text-white/60">
            {STAGE_ICON[stage.stageType] ?? <Swords size={14} />}
          </div>
          <div>
            <p className="font-semibold text-slate-900 dark:text-white text-sm">{stage.name}</p>
            <p className="text-xs text-slate-400 dark:text-white/40">{stage.stageType}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-white/60">
          <span>{doneCount}/{totalCount}</span>
          <div className="w-16 h-1.5 bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-400 rounded-full"
                 style={{ width: totalCount ? `${Math.round(doneCount/totalCount*100)}%` : "0%" }} />
          </div>
        </div>
      </div>

      {/* Round tabs — ẩn khi đang tìm kiếm/lọc (lúc đó hiện phẳng tất cả vòng khớp) */}
      {!isSearching && totalRounds > 1 && (
        <div className="flex items-center gap-1.5 px-5 py-2.5 border-b border-slate-50 overflow-x-auto">
          {sortedRounds.map(([roundNo, matches]) => {
            const rStyle = getRoundStyle(Number(roundNo), totalRounds, stage.stageType);
            const rDone = matches.filter(m => ["COMPLETED","WALKOVER","BYE"].includes(m.status)).length;
            const active = Number(roundNo) === activeRound;
            return (
              <button
                key={roundNo}
                onClick={() => setActiveRound(Number(roundNo))}
                className={[
                  "shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-colors",
                  active
                    ? `${rStyle.bg} ${rStyle.text} ${rStyle.border} ring-1 ring-inset ring-current/20`
                    : "bg-white dark:bg-[#161a22] text-slate-400 dark:text-white/40 border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/15 hover:text-slate-600 dark:hover:text-white/70",
                ].join(" ")}
              >
                {rStyle.label}
                <span className="text-[10px] opacity-70">{rDone}/{matches.length}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Rounds */}
      {totalCount === 0 ? (
        <p className="text-sm text-slate-400 dark:text-white/40 text-center py-8">Chưa có trận nào.</p>
      ) : filteredRounds.length === 0 ? (
        <p className="text-sm text-slate-400 dark:text-white/40 text-center py-8">
          Không có trận nào khớp bộ lọc.
        </p>
      ) : filteredRounds.map(([roundNo, matches]) => {
        const rStyle = getRoundStyle(Number(roundNo), totalRounds, stage.stageType);
        return (
          <div key={roundNo} className="border-b border-slate-50 last:border-0">
            {/* Round label — chỉ hiện khi đang tìm kiếm/lọc (round tab đã thay thế vai trò này) */}
            {isSearching && (
              <div className="px-5 py-2 flex items-center gap-2">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${rStyle.bg} ${rStyle.text} ${rStyle.border}`}>
                  {rStyle.label}
                </span>
                <span className="text-xs text-slate-300">{matches.length} trận</span>
              </div>
            )}

            {/* Matches */}
            <div className="divide-y divide-slate-50 px-2 pb-2">
              {matches.map(m => (
                <MatchRow
                  key={m.id}
                  match={m}
                  stageType={stage.stageType}
                  editMode={editMode && isEditable}
                  isPreview={isPreview}
                  swapFirst={swapFirst}
                  dragSrc={dragSrc}
                  dropTarget={dropTarget}
                  swapping={swapping}
                  starting={startingId === m.id}
                  bulkMode={bulkMode}
                  isSelected={selectedIds?.has(m.id)}
                  onSlotClick={onSlotClick}
                  onDragStart={onDragStart}
                  onDragOver={onDragOver}
                  onDragLeave={onDragLeave}
                  onDrop={onDrop}
                  onDragEnd={onDragEnd}
                  onOpenSearch={onOpenSearch}
                  onStart={onStart}
                  onScore={onScore}
                  onComplete={onComplete}
                  onEvents={onEvents}
                  onToggleSelect={onToggleSelect}
                  onOpenAssign={onOpenAssign}
                  onOpenReferee={onOpenReferee}
                  flashIds={flashIds}
                  feeders={feedersMap?.get(m.id)}
                />
              ))}
            </div>
          </div>
        );
      })}
    </AdminCard>
  );
};

/* ══════════════════════════════════════════════════════════
   MatchRow
══════════════════════════════════════════════════════════ */
const MatchRow = ({
  match, stageType, editMode, isPreview, swapFirst, dragSrc, dropTarget, swapping, starting,
  bulkMode, isSelected,
  onSlotClick, onDragStart, onDragOver, onDragLeave, onDrop, onDragEnd,
  onOpenSearch, onStart, onScore, onComplete, onEvents, onToggleSelect, onOpenAssign, onOpenReferee, flashIds,
  feeders,
}) => {
  const canEdit    = editMode && match.roundNo === 1 && !["LOSERS","GRAND_FINAL"].includes(stageType);
  const sCfg       = STATUS_CFG[match.status] || STATUS_CFG.PENDING;
  const isBye      = match.status === "BYE";
  const isFlashing = flashIds?.has(Number(match.id));
  const assignable = canAssignTable(match);
  const scheduledLabel = formatScheduledAt(match.scheduledAt);
  const tableLabel = match.tableNo != null ? `Bàn ${match.tableNo}` : null;
  const isScheduleLocked = !!match.scheduleLocked;
  const refereeName = match.assignedStaff?.displayName || null;

  return (
    <div className={`rounded-xl my-1 transition-all ${isBye ? "opacity-60" : ""} ${
      canEdit ? "hover:bg-slate-50/80 dark:hover:bg-white/5" : ""
    } ${isFlashing ? "ws-flash" : ""}`}>
      <div className="flex items-center gap-3 px-3 py-2.5">

        {/* Bulk-select checkbox */}
        {bulkMode && assignable && (
          <input
            type="checkbox"
            className="shrink-0 w-4 h-4 rounded border-slate-300 dark:border-white/15 text-indigo-600 focus:ring-indigo-500"
            checked={!!isSelected}
            onChange={() => onToggleSelect(match.id)}
          />
        )}

        {/* Match code */}
        <span className="text-xs font-mono bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-white/60 px-2 py-0.5 rounded-md shrink-0 w-[4.5rem] text-center">
          {match.matchCode}
        </span>

        {/* Players */}
        <div className="flex-1 min-w-0 space-y-1">
          {[
            { slot: "player1", player: match.player1 },
            { slot: "player2", player: match.player2 },
          ].map(({ slot, player }) => {
            const isWinner   = match.winner?.id === player?.id;
            const isDragSrc  = dragSrc?.matchId === match.id && dragSrc?.slot === slot;
            const isDropTgt  = dropTarget?.matchId === match.id && dropTarget?.slot === slot;
            const isSelected = swapFirst?.matchId === match.id && swapFirst?.slot === slot;
            const isByeSlot  = isBye && slot === "player2";

            return (
              <PlayerSlot
                key={slot}
                player={player}
                isWinner={isWinner}
                canEdit={canEdit && !isByeSlot}
                isSelected={isSelected}
                isDragSrc={isDragSrc}
                isDropTarget={isDropTgt}
                feeder={feeders?.[slot]}
                onSlotClick={() => onSlotClick(match, slot, player, stageType)}
                onDragStart={e => onDragStart(e, match.id, slot)}
                onDragOver={e => onDragOver(e, match.id, slot)}
                onDragLeave={onDragLeave}
                onDrop={e => onDrop(e, match.id, slot)}
                onDragEnd={onDragEnd}
                onSearch={() => onOpenSearch(match, slot, stageType)}
              />
            );
          })}

          {/* Score */}
          {["IN_PROGRESS","COMPLETED","WALKOVER"].includes(match.status) && (
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-xs font-mono font-bold text-slate-700 dark:text-white/75">
                {match.player1Score} — {match.player2Score}
              </span>
              <span className="text-xs text-slate-400 dark:text-white/40">/ {match.raceTo}</span>
            </div>
          )}

          {/* Bàn & giờ thi đấu */}
          {!isBye && (
            <div className="flex items-center gap-1.5 mt-1 text-[11px]">
              <span className={tableLabel ? "text-slate-500 dark:text-white/60 font-medium" : "text-slate-300"}>
                {tableLabel || "Chưa gán bàn"}
              </span>
              <span className="text-slate-300">·</span>
              <span className={scheduledLabel ? "text-slate-500 dark:text-white/60 font-medium" : "text-slate-300"}>
                {scheduledLabel || "Chưa xếp giờ"}
              </span>
              {isScheduleLocked && (
                <span className="ml-1 inline-flex items-center gap-0.5 text-[10px] text-amber-600" title="Đã chỉnh tay — auto không đổi">
                  <Lock size={9} /> khóa
                </span>
              )}
              {refereeName && (
                <>
                  <span className="text-slate-300">·</span>
                  <span className="inline-flex items-center gap-0.5 text-indigo-600 font-medium" title="Trọng tài điều hành">
                    <UserCheck size={10} /> {refereeName}
                  </span>
                </>
              )}
            </div>
          )}
        </div>

        {/* Status */}
        <div className="flex items-center gap-1.5 shrink-0">
          <span className={`w-1.5 h-1.5 rounded-full ${sCfg.dot}`} />
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${sCfg.pill}`}>
            {sCfg.label}
          </span>
        </div>

        {/* Action buttons: hidden in edit mode and in preview mode */}
        {!editMode && !isPreview && (
          <div className="flex gap-1 shrink-0">
            {match.status === "PENDING" && match.player1 && match.player2 && (
              <ActionBtn
                icon={starting ? <Loader2 size={13} className="animate-spin" /> : <Play size={13} />}
                title="Bắt đầu"
                cls="text-emerald-600 hover:bg-emerald-50"
                disabled={starting}
                onClick={() => onStart(match.id)} />
            )}
            {match.status === "IN_PROGRESS" && (
              <>
                <ActionBtn icon={<AlertCircle size={13} />} title="Cập nhật tỷ số"
                           cls="text-blue-600 hover:bg-blue-50"
                           onClick={() => onScore(match)} />
                <ActionBtn icon={<CheckCircle size={13} />} title="Kết thúc trận"
                           cls="text-emerald-600 hover:bg-emerald-50"
                           onClick={() => onComplete(match)} />
              </>
            )}
            {assignable && (
              <ActionBtn icon={<MapPin size={13} />} title="Gán bàn & giờ thi đấu"
                         cls="text-indigo-600 hover:bg-indigo-50"
                         onClick={() => onOpenAssign(match)} />
            )}
            {assignable && (
              <ActionBtn icon={<UserCheck size={13} />} title="Gán trọng tài"
                         cls={match.assignedStaff ? "text-indigo-700 bg-indigo-50 hover:bg-indigo-100" : "text-slate-400 dark:text-white/40 hover:bg-slate-100 dark:hover:bg-white/10"}
                         onClick={() => onOpenReferee(match)} />
            )}
            <ActionBtn icon={<Trophy size={12} />} title="Lịch sử tỷ số"
                       cls="text-slate-400 dark:text-white/40 hover:bg-slate-100 dark:hover:bg-white/10"
                       onClick={() => onEvents(match.id, match.matchCode)} />
          </div>
        )}
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════
   PlayerSlot
══════════════════════════════════════════════════════════ */
const PlayerSlot = ({
  player, isWinner, canEdit, isSelected, isDragSrc, isDropTarget, feeder,
  onSlotClick, onDragStart, onDragOver, onDragLeave, onDrop, onDragEnd, onSearch,
}) => {
  return (
    <div
      className={[
        "flex items-center gap-2 rounded-lg px-2 py-1 transition-all select-none",
        canEdit
          ? "cursor-pointer group"
          : "",
        isDragSrc
          ? "opacity-40 scale-95 bg-slate-100 dark:bg-white/10"
          : isDropTarget
          ? "ring-2 ring-indigo-400 bg-indigo-50"
          : isSelected
          ? "ring-2 ring-blue-500 bg-blue-50"
          : canEdit
          ? "hover:bg-slate-100 dark:hover:bg-white/10"
          : "",
      ].join(" ")}
      draggable={canEdit}
      onClick={canEdit ? onSlotClick : undefined}
      onDragStart={canEdit ? onDragStart : undefined}
      onDragOver={canEdit ? onDragOver : undefined}
      onDragLeave={canEdit ? onDragLeave : undefined}
      onDrop={canEdit ? onDrop : undefined}
      onDragEnd={canEdit ? onDragEnd : undefined}
    >
      {/* Drag handle */}
      {canEdit && (
        <GripVertical size={12}
          className="text-slate-300 group-hover:text-slate-400 shrink-0 cursor-grab transition-colors" />
      )}

      {/* Avatar */}
      <PlayerAvatar name={player?.displayName} id={player?.id} size="xs" />

      {/* Name */}
      <span className={[
        "text-sm truncate flex-1",
        player
          ? isWinner
            ? "font-bold text-emerald-700"
            : "text-slate-800 dark:text-white/85"
          : "text-slate-300 italic",
      ].join(" ")}>
        {player?.displayName ?? (feeder ? `${feeder.type === "win" ? "Thắng" : "Thua"} ${feeder.code}` : "TBD")}
        {isWinner && " ✓"}
      </span>

      {/* Search icon */}
      {canEdit && (
        <button
          onClick={e => { e.stopPropagation(); onSearch(); }}
          title="Tìm kiếm người chơi"
          className="shrink-0 w-5 h-5 rounded flex items-center justify-center text-slate-300
                     group-hover:text-slate-500 dark:group-hover:text-white/60 hover:!text-indigo-600 dark:hover:!text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-500/12 transition-colors">
          <Search size={11} />
        </button>
      )}
    </div>
  );
};

/* ══════════════════════════════════════════════════════════
   Small reusable atoms
══════════════════════════════════════════════════════════ */
const PlayerAvatar = ({ name, id, size = "sm" }) => {
  const sz   = size === "xs" ? "w-5 h-5 text-[9px]" : size === "sm" ? "w-6 h-6 text-[10px]" : "w-8 h-8 text-xs";
  const color = avatarColor(id);
  return (
    <span
      className={`${sz} rounded-full flex items-center justify-center font-bold text-white shrink-0`}
      style={{ backgroundColor: color }}>
      {initials(name)}
    </span>
  );
};

const ActionBtn = ({ icon, title, cls, onClick, disabled }) => (
  <button type="button" title={title} onClick={onClick} disabled={disabled}
          className={`admin-table-action ${cls} disabled:opacity-50 disabled:pointer-events-none`}>
    {icon}
  </button>
);

export default DrawPage;
