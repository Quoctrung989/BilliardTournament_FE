import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import {
  Shuffle, Play, CheckCircle, AlertCircle, Trophy,
  ArrowLeftRight, Eye, Lock, Search, GripVertical,
  ChevronRight, Users, Swords, Zap, BarChart2, Scissors,
} from "lucide-react";
import AdminButton from "../../../components/admin/ui/AdminButton";
import AdminCard from "../../../components/admin/ui/AdminCard";
import AdminModal from "../../../components/admin/ui/AdminModal";
import { getApiErrorMessage } from "../../../utils/apiError";
import { useMatchWebSocket } from "../../../hooks/useMatchWebSocket";

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
  round:   { label: "Vòng",           bg: "bg-slate-50",   text: "text-slate-600",  border: "border-slate-200" },
};

const STATUS_CFG = {
  PENDING:     { label: "Chờ",           dot: "bg-slate-400",    pill: "bg-slate-100 text-slate-600" },
  IN_PROGRESS: { label: "Đang diễn ra",  dot: "bg-blue-500 animate-pulse", pill: "bg-blue-100 text-blue-800" },
  COMPLETED:   { label: "Hoàn thành",    dot: "bg-emerald-500",  pill: "bg-emerald-100 text-emerald-800" },
  WALKOVER:    { label: "Walkover",       dot: "bg-amber-500",    pill: "bg-amber-100 text-amber-800" },
  BYE:         { label: "BYE",           dot: "bg-slate-300",    pill: "bg-slate-100 text-slate-400" },
};

function getRoundStyle(roundNo, totalRounds) {
  const diff = totalRounds - roundNo;
  if (diff === 0) return { ...ROUND_STYLE.final,   label: ROUND_STYLE.final.label };
  if (diff === 1) return { ...ROUND_STYLE.semi,    label: ROUND_STYLE.semi.label };
  if (diff === 2) return { ...ROUND_STYLE.quarter, label: ROUND_STYLE.quarter.label };
  return { ...ROUND_STYLE.round, label: `Vòng ${roundNo}` };
}

const EDITABLE_STAGES = ["KNOCKOUT", "WINNERS"];

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

/* ══════════════════════════════════════════════════════════
   Main Component
══════════════════════════════════════════════════════════ */
const DrawPage = ({ api, basePath }) => {
  const { id }         = useParams();
  const navigate       = useNavigate();
  const tournamentId   = Number(id);

  /* ── Core state ── */
  const [stages,       setStages]       = useState([]);
  const [tournament,   setTournament]   = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [noDrawYet,    setNoDrawYet]    = useState(false);

  /* ── Actions loading ── */
  const [drawing,      setDrawing]      = useState(false);
  const [confirming,   setConfirming]   = useState(false);
  const [swapping,     setSwapping]     = useState(false);
  const [saving,       setSaving]       = useState(false);

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
  const [eventsModal,  setEventsModal]  = useState(null);
  const [events,       setEvents]       = useState([]);

  /* ── CUT_TO_SE / GROUP_PLAYOFF actions ── */
  const [populating,     setPopulating]     = useState(false);
  const [generatingPO,   setGeneratingPO]   = useState(false);
  const [standings,      setStandings]      = useState([]);
  const [elimModal,      setElimModal]      = useState(false);
  const [keepCount,      setKeepCount]      = useState("");
  const [eliminating,    setEliminating]    = useState(false);

  const isPreview          = tournament?.status === "DRAW_PREVIEW";
  const isFinalBracketReady= tournament?.status === "FINAL_BRACKET_READY";
  const isGroupPlayoff     = tournament?.format === "GROUP_PLAYOFF";
  const isDoubleElim       = tournament?.format === "DOUBLE_ELIMINATION";
  const hasFinalBracket    = stages.some(s => s.stageType === "FINAL_BRACKET");

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

  useEffect(() => {
    if (!isPreview) { setEditMode(false); setSwapFirst(null); }
  }, [isPreview]);

  /* ══ WebSocket ══════════════════════════════════════════ */
  const handleMatchUpdate = useCallback((upd) => {
    setStages(prev => prev.map(stage => {
      if (!stage.matches) return stage;
      const idx = stage.matches.findIndex(m => Number(m.id) === Number(upd.id));
      if (idx === -1) return stage;
      const nm = [...stage.matches];
      nm[idx] = {
        ...nm[idx],
        player1Score: upd.player1Score, player2Score: upd.player2Score,
        status: upd.status, winner: upd.winner, loser: upd.loser,
        player1: upd.player1 ?? nm[idx].player1,
        player2: upd.player2 ?? nm[idx].player2,
      };
      return { ...stage, matches: nm };
    }));
  }, []);
  useMatchWebSocket(tournamentId, handleMatchUpdate);

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

  /* ══ GROUP_PLAYOFF: standings + eliminate + generate playoff ═ */
  const loadStandings = useCallback(async () => {
    try {
      const data = await api.getStandings(tournamentId);
      setStandings(Array.isArray(data) ? data : []);
    } catch { setStandings([]); }
  }, [api, tournamentId]);

  const handleEliminate = async () => {
    const k = parseInt(keepCount);
    if (!k || k < 2) { toast.warn("Nhập số người giữ lại hợp lệ (≥ 2)"); return; }
    setEliminating(true);
    try {
      await api.eliminateBottom(tournamentId, { keepCount: k });
      toast.success(`Đã loại bottom — giữ top ${k}`);
      setElimModal(false); setKeepCount("");
      load(); loadStandings();
    } catch (err) { toast.error(getApiErrorMessage(err)); }
    finally { setEliminating(false); }
  };

  const handleGeneratePlayoff = () => {
    showConfirm(
      "Tạo bracket playoff",
      "Lấy kết quả xếp hạng vòng tròn để tạo bracket playoff. Tất cả trận group phải hoàn thành.",
      async () => {
        setGeneratingPO(true);
        try {
          await api.generatePlayoff(tournamentId);
          toast.success("Đã tạo bracket playoff!");
          load();
        } catch (err) { toast.error(getApiErrorMessage(err)); }
        finally { setGeneratingPO(false); }
      },
      { okLabel: "Tạo playoff", okVariant: "primary" }
    );
  };

  /* ══ Match lifecycle ════════════════════════════════════ */
  const handleStart = async (matchId) => {
    try { await api.startMatch(matchId); toast.success("Đã bắt đầu trận"); load(); }
    catch (err) { toast.error(getApiErrorMessage(err)); }
  };

  const handleSaveScore = async () => {
    if (!scoreModal) return;
    const p1 = Number(scoreForm.p1), p2 = Number(scoreForm.p2);
    if (isNaN(p1)||isNaN(p2)||p1<0||p2<0) { toast.warn("Tỷ số không hợp lệ"); return; }
    setSaving(true);
    try {
      await api.updateScore(scoreModal.id, { player1Score: p1, player2Score: p2 });
      toast.success("Đã cập nhật tỷ số"); setScoreModal(null); load();
    } catch (err) { toast.error(getApiErrorMessage(err)); }
    finally { setSaving(false); }
  };

  const handleComplete = async (winnerId) => {
    if (!completeModal) return;
    setSaving(true);
    try {
      await api.completeMatch(completeModal.id, { winnerParticipantId: winnerId });
      toast.success("Trận kết thúc — người thắng đã được chuyển lên"); setCompleteModal(null); load();
    } catch (err) { toast.error(getApiErrorMessage(err)); }
    finally { setSaving(false); }
  };

  const handleWalkover = async (winnerId) => {
    if (!completeModal) return;
    setSaving(true);
    try {
      await api.walkover(completeModal.id, { winnerParticipantId: winnerId });
      toast.success("Walkover đã ghi nhận"); setCompleteModal(null); load();
    } catch (err) { toast.error(getApiErrorMessage(err)); }
    finally { setSaving(false); }
  };

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
      <p className="text-sm text-slate-400">Đang tải bracket...</p>
    </div>
  );

  return (
    <div className="space-y-5">

      {/* ── Top bar ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <AdminButton variant="secondary" onClick={() => navigate(`${basePath}/${tournamentId}`)}>
          ← Chi tiết giải
        </AdminButton>

        <div className="flex items-center gap-2 flex-wrap">
          {noDrawYet && (
            <AdminButton variant="primary" disabled={drawing} onClick={handleDraw}
                         className="flex items-center gap-2">
              <Shuffle size={15} />
              {drawing ? "Đang bốc thăm..." : "Sinh bracket (Bốc thăm)"}
            </AdminButton>
          )}

          {!noDrawYet && isPreview && (
            <>
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
                    : "bg-white text-slate-700 border-slate-200 hover:border-indigo-300 hover:text-indigo-700",
                ].join(" ")}>
                <ArrowLeftRight size={14} />
                {editMode ? "Đang chỉnh sửa…" : "Chỉnh sửa cặp đấu"}
              </button>

              <AdminButton variant="success" disabled={confirming||drawing||swapping} onClick={handleConfirmDraw}
                           className="flex items-center gap-2">
                <Lock size={14} />
                {confirming ? "Đang xác nhận..." : "Xác nhận bracket"}
              </AdminButton>
            </>
          )}

          {!noDrawYet && !isPreview && (
            <div className="flex items-center gap-3 flex-wrap">
              {/* Progress bar */}
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <span className="font-semibold text-slate-800">{doneMatches}</span>
                <span className="text-slate-400">/{totalMatches} trận</span>
                <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full transition-all"
                       style={{ width: `${progress}%` }} />
                </div>
                <span className="text-xs font-semibold text-emerald-600">{progress}%</span>
              </div>

              {/* CUT_TO_SE: populate final bracket button */}
              {isDoubleElim && hasFinalBracket && !isFinalBracketReady && (
                <AdminButton variant="primary" disabled={populating}
                             onClick={handlePopulateFinalBracket}
                             className="flex items-center gap-2">
                  <Zap size={14} />
                  {populating ? "Đang điền..." : "Điền bracket Last X"}
                </AdminButton>
              )}

              {/* GROUP_PLAYOFF: standings + eliminate + generate playoff */}
              {isGroupPlayoff && (
                <>
                  <AdminButton variant="secondary" onClick={() => { loadStandings(); setElimModal(true); }}
                               className="flex items-center gap-2">
                    <BarChart2 size={14} /> Xếp hạng & Loại bottom
                  </AdminButton>
                  <AdminButton variant="secondary" disabled={generatingPO}
                               onClick={handleGeneratePlayoff}
                               className="flex items-center gap-2">
                    <Trophy size={14} />
                    {generatingPO ? "Đang tạo..." : "Tạo bracket Playoff"}
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
            : "bg-slate-50 border-slate-200",
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
                <ArrowLeftRight size={14} className="text-slate-500 shrink-0" />
                <span className="text-slate-600">
                  Chế độ chỉnh sửa đang bật — <strong>kéo thả</strong> hoặc <strong>click</strong> vào người chơi ở Vòng 1 để đổi chỗ.
                  Nhấn <kbd className="px-1 py-0.5 bg-white border border-slate-200 rounded text-xs font-mono">🔍</kbd> để tìm kiếm.
                </span>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Empty state ── */}
      {noDrawYet ? (
        <AdminCard>
          <div className="py-20 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto">
              <Swords size={28} className="text-slate-400" />
            </div>
            <div>
              <p className="font-semibold text-slate-700">Chưa có bracket</p>
              <p className="text-sm text-slate-400 mt-1">
                Đảm bảo giải đang ở trạng thái <span className="font-medium">Đóng đăng ký</span> và có ít nhất 2 người tham gia.
              </p>
            </div>
            <AdminButton variant="primary" disabled={drawing} onClick={handleDraw}
                         className="inline-flex items-center gap-2 mx-auto">
              <Shuffle size={15} />
              {drawing ? "Đang bốc thăm..." : "Sinh bracket ngay"}
            </AdminButton>
          </div>
        </AdminCard>
      ) : (
        stages.map(stage => (
          <StageSection
            key={stage.id}
            stage={stage}
            editMode={editMode}
            swapFirst={swapFirst}
            dragSrc={dragSrc}
            dropTarget={dropTarget}
            swapping={swapping}
            isPreview={isPreview}
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
          />
        ))
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
        <p className="text-sm text-slate-600">{confirmModal?.body}</p>
      </AdminModal>

      {/* ── Standings + Eliminate Bottom (GROUP_PLAYOFF) ── */}
      <AdminModal
        open={elimModal}
        onClose={() => setElimModal(false)}
        title="Xếp hạng & Loại bottom (Progressive Elimination)"
        size="lg"
        footer={
          <>
            <AdminButton variant="secondary" onClick={() => setElimModal(false)}>Đóng</AdminButton>
            <AdminButton variant="danger" disabled={eliminating || !keepCount}
                         onClick={handleEliminate}
                         className="flex items-center gap-2">
              <Scissors size={13} />
              {eliminating ? "Đang loại..." : `Loại bottom — giữ top ${keepCount || "?"}`}
            </AdminButton>
          </>
        }
      >
        <div className="space-y-4">
          {/* Standings table */}
          <div className="max-h-64 overflow-y-auto border border-slate-100 rounded-xl">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
                <tr>
                  <th className="px-3 py-2 text-left">#</th>
                  <th className="px-3 py-2 text-left">Cơ thủ</th>
                  <th className="px-3 py-2 text-center">Thắng</th>
                  <th className="px-3 py-2 text-center">Hiệu số</th>
                  <th className="px-3 py-2 text-center">Frame</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {standings.length === 0 ? (
                  <tr><td colSpan={5} className="px-3 py-6 text-center text-slate-400 text-xs">Chưa có kết quả</td></tr>
                ) : standings.map(s => (
                  <tr key={s.participantId}
                      className={s.rank <= parseInt(keepCount || "0") ? "bg-emerald-50" : ""}>
                    <td className="px-3 py-2 font-mono text-slate-500">{s.rank}</td>
                    <td className="px-3 py-2 font-medium text-slate-800">{s.displayName}</td>
                    <td className="px-3 py-2 text-center text-slate-700">{s.wins}</td>
                    <td className={`px-3 py-2 text-center font-medium ${s.frameDiff >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                      {s.frameDiff >= 0 ? "+" : ""}{s.frameDiff}
                    </td>
                    <td className="px-3 py-2 text-center text-slate-500">{s.framesWon}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Keep count input */}
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-slate-700 shrink-0">Giữ lại top:</label>
            <input
              type="number" min={2} max={standings.length}
              className="admin-input w-24"
              placeholder="e.g. 8"
              value={keepCount}
              onChange={e => setKeepCount(e.target.value)}
            />
            <p className="text-xs text-slate-400">
              Loại {Math.max(0, standings.length - parseInt(keepCount || "0"))} người xếp cuối.
              Match còn lại của họ → Walkover tự động.
            </p>
          </div>
        </div>
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
        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
          <PlayerAvatar name={swapConfirm?.first.playerName} size="md" />
          <div className="text-sm">
            <p className="font-semibold text-slate-800">{swapConfirm?.first.playerName}</p>
            <p className="text-xs text-slate-400 font-mono">{swapConfirm?.first.matchCode} · {swapConfirm?.first.slot === "player1" ? "P1" : "P2"}</p>
          </div>
          <ArrowLeftRight size={16} className="text-indigo-400 mx-auto" />
          <PlayerAvatar name={swapConfirm?.second.playerName} size="md" />
          <div className="text-sm">
            <p className="font-semibold text-slate-800">{swapConfirm?.second.playerName}</p>
            <p className="text-xs text-slate-400 font-mono">{swapConfirm?.second.matchCode} · {swapConfirm?.second.slot === "player1" ? "P1" : "P2"}</p>
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
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
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
          <div className="max-h-72 overflow-y-auto divide-y divide-slate-50 border border-slate-100 rounded-xl">
            {loadingPtcp ? (
              <div className="py-6 text-center text-sm text-slate-400">Đang tải...</div>
            ) : filteredPtcp.length === 0 ? (
              <div className="py-6 text-center text-sm text-slate-400">Không tìm thấy</div>
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
                      : "hover:bg-slate-50 active:bg-slate-100 cursor-pointer",
                  ].join(" ")}
                >
                  <PlayerAvatar name={p.displayName} id={p.id} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-800 truncate">{p.displayName}</p>
                    {pos && (
                      <p className="text-xs text-slate-400 font-mono">
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
          <p className="text-xs text-slate-400">
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
        <p className="text-xs text-slate-400 mt-3">Race to: {scoreModal?.raceTo}</p>
      </AdminModal>

      {/* Complete / Walkover */}
      <AdminModal
        open={!!completeModal}
        onClose={() => setCompleteModal(null)}
        title={`Kết thúc trận — ${completeModal?.matchCode}`}
        footer={<AdminButton variant="secondary" onClick={() => setCompleteModal(null)}>Đóng</AdminButton>}
      >
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
                <AdminButton variant="secondary" disabled={saving} onClick={() => handleWalkover(p.id)}>
                  Walkover
                </AdminButton>
              </div>
            </div>
          ))}
        </div>
      </AdminModal>

      {/* Score events */}
      <AdminModal
        open={!!eventsModal}
        onClose={() => { setEventsModal(null); setEvents([]); }}
        title={`Lịch sử — ${eventsModal?.matchCode}`}
        footer={<AdminButton variant="secondary" onClick={() => { setEventsModal(null); setEvents([]); }}>Đóng</AdminButton>}
      >
        {events.length === 0 ? (
          <p className="text-slate-400 text-sm text-center py-6">Chưa có cập nhật nào.</p>
        ) : (
          <div className="space-y-1.5 max-h-72 overflow-y-auto">
            {events.map(ev => (
              <div key={ev.id}
                   className="flex items-center gap-3 text-sm bg-slate-50 px-3 py-2 rounded-lg">
                <span className={`px-2 py-0.5 rounded text-xs font-medium shrink-0 ${
                  ev.eventType === "MATCH_END" ? "bg-emerald-100 text-emerald-800"
                  : ev.eventType === "WALKOVER" ? "bg-amber-100 text-amber-800"
                  : "bg-blue-100 text-blue-800"}`}>
                  {ev.eventType}
                </span>
                <span className="font-mono font-bold text-slate-700">
                  {ev.player1ScoreAfter} — {ev.player2ScoreAfter}
                </span>
                <span className="text-slate-400 text-xs ml-auto truncate">
                  {ev.createdByName} · {ev.createdAt
                    ? new Date(ev.createdAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
                    : "—"}
                </span>
              </div>
            ))}
          </div>
        )}
      </AdminModal>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════
   StageSection
══════════════════════════════════════════════════════════ */
const StageSection = ({
  stage, editMode, swapFirst, dragSrc, dropTarget, swapping, isPreview,
  onSlotClick, onDragStart, onDragOver, onDragLeave, onDrop, onDragEnd,
  onOpenSearch, onStart, onScore, onComplete, onEvents,
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

  const STAGE_ICON = {
    KNOCKOUT:    <Swords size={14} />,
    WINNERS:     <Trophy size={14} />,
    LOSERS:      <ArrowLeftRight size={14} />,
    GRAND_FINAL: <Trophy size={14} className="text-amber-500" />,
  };

  return (
    <AdminCard padding={false}>
      {/* Stage header */}
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
            {STAGE_ICON[stage.stageType] ?? <Swords size={14} />}
          </div>
          <div>
            <p className="font-semibold text-slate-900 text-sm">{stage.name}</p>
            <p className="text-xs text-slate-400">{stage.stageType}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span>{doneCount}/{totalCount}</span>
          <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-400 rounded-full"
                 style={{ width: totalCount ? `${Math.round(doneCount/totalCount*100)}%` : "0%" }} />
          </div>
        </div>
      </div>

      {/* Rounds */}
      {sortedRounds.map(([roundNo, matches]) => {
        const rStyle = getRoundStyle(Number(roundNo), totalRounds);
        return (
          <div key={roundNo} className="border-b border-slate-50 last:border-0">
            {/* Round label */}
            <div className="px-5 py-2 flex items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${rStyle.bg} ${rStyle.text} ${rStyle.border}`}>
                {rStyle.label}
              </span>
              <span className="text-xs text-slate-300">{matches.length} trận</span>
            </div>

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
  match, stageType, editMode, isPreview, swapFirst, dragSrc, dropTarget, swapping,
  onSlotClick, onDragStart, onDragOver, onDragLeave, onDrop, onDragEnd,
  onOpenSearch, onStart, onScore, onComplete, onEvents,
}) => {
  const canEdit = editMode && match.roundNo === 1 && !["LOSERS","GRAND_FINAL"].includes(stageType);
  const sCfg    = STATUS_CFG[match.status] || STATUS_CFG.PENDING;
  const isBye   = match.status === "BYE";

  return (
    <div className={`rounded-xl my-1 transition-all ${isBye ? "opacity-60" : ""} ${
      canEdit ? "hover:bg-slate-50/80" : ""
    }`}>
      <div className="flex items-center gap-3 px-3 py-2.5">

        {/* Match code */}
        <span className="text-xs font-mono bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md shrink-0 w-[4.5rem] text-center">
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
              <span className="text-xs font-mono font-bold text-slate-700">
                {match.player1Score} — {match.player2Score}
              </span>
              <span className="text-xs text-slate-400">/ {match.raceTo}</span>
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
              <ActionBtn icon={<Play size={13} />} title="Bắt đầu"
                         cls="text-emerald-600 hover:bg-emerald-50"
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
            <ActionBtn icon={<Trophy size={12} />} title="Lịch sử tỷ số"
                       cls="text-slate-400 hover:bg-slate-100"
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
  player, isWinner, canEdit, isSelected, isDragSrc, isDropTarget,
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
          ? "opacity-40 scale-95 bg-slate-100"
          : isDropTarget
          ? "ring-2 ring-indigo-400 bg-indigo-50"
          : isSelected
          ? "ring-2 ring-blue-500 bg-blue-50"
          : canEdit
          ? "hover:bg-slate-100"
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
            : "text-slate-800"
          : "text-slate-300 italic",
      ].join(" ")}>
        {player?.displayName ?? "TBD"}
        {isWinner && " ✓"}
      </span>

      {/* Search icon */}
      {canEdit && (
        <button
          onClick={e => { e.stopPropagation(); onSearch(); }}
          title="Tìm kiếm người chơi"
          className="shrink-0 w-5 h-5 rounded flex items-center justify-center text-slate-300
                     group-hover:text-slate-500 hover:!text-indigo-600 hover:bg-indigo-50 transition-colors">
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

const ActionBtn = ({ icon, title, cls, onClick }) => (
  <button type="button" title={title} onClick={onClick}
          className={`admin-table-action ${cls}`}>
    {icon}
  </button>
);

export default DrawPage;
