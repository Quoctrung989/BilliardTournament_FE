import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { Shuffle, Play, CheckCircle, AlertCircle, Trophy, RefreshCw } from "lucide-react";
import AdminButton from "../../../components/admin/ui/AdminButton";
import AdminCard from "../../../components/admin/ui/AdminCard";
import AdminModal from "../../../components/admin/ui/AdminModal";
import { getApiErrorMessage } from "../../../utils/apiError";
import { useMatchWebSocket } from "../../../hooks/useMatchWebSocket";

/* ── Status config ── */
const MATCH_STATUS = {
  PENDING:     { label: "Chờ",            cls: "bg-slate-100 text-slate-600" },
  IN_PROGRESS: { label: "Đang diễn ra",   cls: "bg-blue-100 text-blue-800"  },
  COMPLETED:   { label: "Hoàn thành",     cls: "bg-emerald-100 text-emerald-800" },
  WALKOVER:    { label: "Walkover",        cls: "bg-amber-100 text-amber-800" },
  BYE:         { label: "BYE",             cls: "bg-slate-100 text-slate-400" },
};

const StatusBadge = ({ status }) => {
  const cfg = MATCH_STATUS[status] || MATCH_STATUS.PENDING;
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
};

const DrawPage = ({ api, basePath }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const tournamentId = Number(id);

  const [stages, setStages]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [drawing, setDrawing]   = useState(false);
  const [noDrawYet, setNoDrawYet] = useState(false);

  /* Score modal */
  const [scoreModal, setScoreModal] = useState(null);
  const [scoreForm, setScoreForm]   = useState({ p1: "", p2: "" });
  const [saving, setSaving]         = useState(false);

  /* Complete modal */
  const [completeModal, setCompleteModal] = useState(null);

  /* Events modal */
  const [eventsModal, setEventsModal]   = useState(null);
  const [events, setEvents]             = useState([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getStages(tournamentId);
      if (!Array.isArray(data) || data.length === 0) {
        setNoDrawYet(true);
        setStages([]);
      } else {
        setNoDrawYet(false);
        setStages(data);
      }
    } catch {
      setNoDrawYet(true);
    } finally {
      setLoading(false);
    }
  }, [api, tournamentId]);

  useEffect(() => { load(); }, [load]);

  /* ── WebSocket: cập nhật bracket realtime khi nhận score update ── */
  const handleMatchUpdate = useCallback((updatedMatch) => {
    setStages(prev => prev.map(stage => {
      if (!stage.matches) return stage;
      const idx = stage.matches.findIndex(m => Number(m.id) === Number(updatedMatch.id));
      if (idx === -1) return stage;
      const newMatches = [...stage.matches];
      newMatches[idx] = {
        ...newMatches[idx],
        player1Score: updatedMatch.player1Score,
        player2Score: updatedMatch.player2Score,
        status: updatedMatch.status,
        winner: updatedMatch.winner,
        loser: updatedMatch.loser,
        player1: updatedMatch.player1 ?? newMatches[idx].player1,
        player2: updatedMatch.player2 ?? newMatches[idx].player2,
      };
      return { ...stage, matches: newMatches };
    }));
  }, []);

  useMatchWebSocket(tournamentId, handleMatchUpdate);

  /* ── Actions ── */
  const handleDraw = async () => {
    if (!window.confirm("Sinh bracket từ danh sách người tham gia? Thao tác này không thể hoàn tác.")) return;
    setDrawing(true);
    try {
      await api.generateDraw(tournamentId);
      toast.success("Bốc thăm thành công!");
      load();
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setDrawing(false);
    }
  };

  const handleStart = async (matchId) => {
    try {
      await api.startMatch(matchId);
      toast.success("Đã bắt đầu trận");
      load();
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  const openScore = (match) => {
    setScoreModal(match);
    setScoreForm({ p1: String(match.player1Score ?? 0), p2: String(match.player2Score ?? 0) });
  };

  const handleSaveScore = async () => {
    if (!scoreModal) return;
    const p1 = Number(scoreForm.p1);
    const p2 = Number(scoreForm.p2);
    if (isNaN(p1) || isNaN(p2) || p1 < 0 || p2 < 0) {
      toast.warn("Tỷ số không hợp lệ");
      return;
    }
    setSaving(true);
    try {
      await api.updateScore(scoreModal.id, { player1Score: p1, player2Score: p2 });
      toast.success("Đã cập nhật tỷ số");
      setScoreModal(null);
      load();
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleComplete = async (winnerId) => {
    if (!completeModal) return;
    setSaving(true);
    try {
      await api.completeMatch(completeModal.id, { winnerParticipantId: winnerId });
      toast.success("Trận đã kết thúc — người thắng đã được chuyển lên vòng sau");
      setCompleteModal(null);
      load();
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleWalkover = async (winnerId) => {
    if (!completeModal) return;
    setSaving(true);
    try {
      await api.walkover(completeModal.id, { winnerParticipantId: winnerId });
      toast.success("Walkover đã được ghi nhận");
      setCompleteModal(null);
      load();
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const loadEvents = async (matchId, matchCode) => {
    setEventsModal({ matchId, matchCode });
    try {
      const { getMatchEvents } = await import("../../../api/matchApi");
      const data = await getMatchEvents(matchId);
      setEvents(Array.isArray(data) ? data : []);
    } catch { setEvents([]); }
  };

  const fmtTime = (iso) => iso
    ? new Date(iso).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
    : "—";

  /* ── Total match count ── */
  const totalMatches = stages.reduce((sum, s) => sum + (s.matches?.length ?? 0), 0);
  const doneMatches  = stages.reduce((sum, s) =>
    sum + (s.matches?.filter((m) => ["COMPLETED","WALKOVER","BYE"].includes(m.status)).length ?? 0), 0);

  if (loading) return <div className="text-center py-20 text-slate-400">Đang tải...</div>;

  return (
    <div className="space-y-6">
      {/* Back + generate */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <AdminButton variant="secondary" onClick={() => navigate(`${basePath}/${tournamentId}`)}>
          ← Chi tiết giải
        </AdminButton>
        {noDrawYet && (
          <AdminButton variant="primary" disabled={drawing} onClick={handleDraw}
                       className="flex items-center gap-2">
            <Shuffle size={16} />
            {drawing ? "Đang bốc thăm..." : "Sinh bracket (Bốc thăm)"}
          </AdminButton>
        )}
        {!noDrawYet && (
          <div className="flex items-center gap-3 text-sm text-slate-500">
            <span>Tiến độ: <strong>{doneMatches}/{totalMatches}</strong> trận hoàn thành</span>
          </div>
        )}
      </div>

      {noDrawYet ? (
        <AdminCard>
          <div className="py-16 text-center">
            <Shuffle size={40} className="mx-auto mb-3 text-slate-300" />
            <p className="text-slate-500 font-medium">Chưa có bracket</p>
            <p className="text-xs text-slate-400 mt-1">
              Đảm bảo giải đang ở trạng thái <strong>Đóng đăng ký</strong> và có ít nhất 2 người tham gia.
            </p>
          </div>
        </AdminCard>
      ) : (
        stages.map((stage) => (
          <AdminCard key={stage.id} padding={false}>
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-slate-900">{stage.name}</h3>
                <p className="text-xs text-slate-400 mt-0.5">{stage.stageType}</p>
              </div>
              <span className="text-xs text-slate-400">
                {stage.matches?.filter((m) => m.status === "COMPLETED").length ?? 0}/
                {stage.matches?.length ?? 0} hoàn thành
              </span>
            </div>

            {/* Rounds */}
            {(() => {
              const rounds = {};
              (stage.matches || []).forEach((m) => {
                if (!rounds[m.roundNo]) rounds[m.roundNo] = [];
                rounds[m.roundNo].push(m);
              });
              return Object.entries(rounds).sort(([a], [b]) => Number(a) - Number(b)).map(([round, matches]) => (
                <div key={round} className="border-b border-slate-50 last:border-0">
                  <div className="px-5 py-2 bg-slate-50/60">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      {getRoundLabel(round, rounds)}
                    </span>
                  </div>
                  <div className="divide-y divide-slate-50">
                    {matches.map((m) => (
                      <MatchRow
                        key={m.id}
                        match={m}
                        onStart={handleStart}
                        onScore={openScore}
                        onComplete={setCompleteModal}
                        onEvents={loadEvents}
                      />
                    ))}
                  </div>
                </div>
              ));
            })()}
          </AdminCard>
        ))
      )}

      {/* Score modal */}
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
          <div>
            <label className="admin-label">
              {scoreModal?.player1?.displayName ?? "Player 1"}
            </label>
            <input type="number" min={0} className="admin-input w-full mt-1"
              value={scoreForm.p1}
              onChange={(e) => setScoreForm((f) => ({ ...f, p1: e.target.value }))} />
          </div>
          <div>
            <label className="admin-label">
              {scoreModal?.player2?.displayName ?? "Player 2"}
            </label>
            <input type="number" min={0} className="admin-input w-full mt-1"
              value={scoreForm.p2}
              onChange={(e) => setScoreForm((f) => ({ ...f, p2: e.target.value }))} />
          </div>
        </div>
        <p className="text-xs text-slate-400 mt-3">Race to: {scoreModal?.raceTo}</p>
      </AdminModal>

      {/* Complete / Walkover modal */}
      <AdminModal
        open={!!completeModal}
        onClose={() => setCompleteModal(null)}
        title={`Kết thúc trận — ${completeModal?.matchCode}`}
        footer={<AdminButton variant="secondary" onClick={() => setCompleteModal(null)}>Đóng</AdminButton>}
      >
        <p className="text-sm text-slate-600 mb-4">Chọn người thắng trận này:</p>
        <div className="space-y-2">
          {[completeModal?.player1, completeModal?.player2].filter(Boolean).map((p) => (
            <div key={p.id} className="flex items-center justify-between bg-slate-50 px-4 py-3 rounded-xl">
              <span className="font-medium text-slate-900">{p.displayName}</span>
              <div className="flex gap-2">
                <AdminButton variant="primary" disabled={saving} onClick={() => handleComplete(p.id)}>
                  <CheckCircle size={14} className="mr-1" /> Thắng
                </AdminButton>
                <AdminButton variant="secondary" disabled={saving} onClick={() => handleWalkover(p.id)}>
                  Walkover
                </AdminButton>
              </div>
            </div>
          ))}
        </div>
      </AdminModal>

      {/* Score events modal */}
      <AdminModal
        open={!!eventsModal}
        onClose={() => { setEventsModal(null); setEvents([]); }}
        title={`Lịch sử tỷ số — ${eventsModal?.matchCode}`}
        footer={<AdminButton variant="secondary" onClick={() => { setEventsModal(null); setEvents([]); }}>Đóng</AdminButton>}
      >
        {events.length === 0 ? (
          <p className="text-slate-400 text-sm text-center py-4">Chưa có cập nhật nào.</p>
        ) : (
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {events.map((ev) => (
              <div key={ev.id} className="flex items-center gap-3 text-sm bg-slate-50 px-3 py-2 rounded-lg">
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${ev.eventType === "MATCH_END" ? "bg-emerald-100 text-emerald-800" : ev.eventType === "WALKOVER" ? "bg-amber-100 text-amber-800" : "bg-blue-100 text-blue-800"}`}>
                  {ev.eventType}
                </span>
                <span className="font-mono font-semibold">{ev.player1ScoreAfter} — {ev.player2ScoreAfter}</span>
                <span className="text-slate-400 text-xs ml-auto">
                  {ev.createdByName} · {fmtTime(ev.createdAt)}
                </span>
              </div>
            ))}
          </div>
        )}
      </AdminModal>
    </div>
  );
};

/* ── Match row ── */
const MatchRow = ({ match, onStart, onScore, onComplete, onEvents }) => (
  <div className={`flex items-center gap-4 px-5 py-3 hover:bg-slate-50/50 ${match.status === "BYE" ? "opacity-50" : ""}`}>
    {/* Code */}
    <span className="text-xs font-mono text-slate-400 w-16 shrink-0">{match.matchCode}</span>

    {/* Players + score */}
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2">
        <PlayerName name={match.player1?.displayName} isWinner={match.winner?.id === match.player1?.id} />
        <span className="text-slate-300 text-xs">vs</span>
        <PlayerName name={match.player2?.displayName} isWinner={match.winner?.id === match.player2?.id} />
      </div>
      {(match.status === "IN_PROGRESS" || match.status === "COMPLETED" || match.status === "WALKOVER") && (
        <div className="text-xs font-mono text-slate-700 mt-0.5">
          {match.player1Score} — {match.player2Score}
          <span className="text-slate-400 ml-1">/ {match.raceTo}</span>
        </div>
      )}
    </div>

    {/* Status */}
    <StatusBadge status={match.status} />

    {/* Actions */}
    <div className="flex gap-1 shrink-0">
      {match.status === "PENDING" && match.player1 && match.player2 && (
        <button type="button"
          className="admin-table-action text-emerald-600"
          title="Bắt đầu trận"
          onClick={() => onStart(match.id)}>
          <Play size={14} />
        </button>
      )}
      {match.status === "IN_PROGRESS" && (
        <>
          <button type="button" className="admin-table-action" title="Cập nhật tỷ số"
            onClick={() => onScore(match)}>
            <AlertCircle size={14} />
          </button>
          <button type="button" className="admin-table-action text-emerald-600" title="Kết thúc trận"
            onClick={() => onComplete(match)}>
            <CheckCircle size={14} />
          </button>
        </>
      )}
      <button type="button" className="admin-table-action text-slate-400" title="Lịch sử tỷ số"
        onClick={() => onEvents(match.id, match.matchCode)}>
        <Trophy size={13} />
      </button>
    </div>
  </div>
);

const PlayerName = ({ name, isWinner }) => (
  <span className={`text-sm ${name ? (isWinner ? "font-bold text-emerald-700" : "text-slate-800") : "text-slate-300 italic"}`}>
    {name ?? "TBD"}
    {isWinner && " ✓"}
  </span>
);

const getRoundLabel = (round, allRounds) => {
  const total = Object.keys(allRounds).length;
  const r = Number(round);
  if (r === total) return "🏆 Chung kết";
  if (r === total - 1) return "Bán kết";
  if (r === total - 2) return "Tứ kết";
  return `Vòng ${round}`;
};

export default DrawPage;
