import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { X, Swords, Calendar } from "lucide-react";
import { getMyMatches } from "../../api/matchApi";
import { getApiErrorMessage } from "../../utils/apiError";
import { useReveal } from "../../hooks/useReveal";
import "../Profile/profile.scss";

const STATUS_CFG = {
  PENDING:     { label: "Chờ thi đấu",  cls: "bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-white/70",    dot: "bg-slate-400",   bar: "#94a3b8" },
  IN_PROGRESS: { label: "Đang diễn ra", cls: "bg-blue-100 text-blue-800",       dot: "bg-blue-500",    bar: "#3b82f6" },
  COMPLETED:   { label: "Hoàn thành",   cls: "bg-emerald-100 text-emerald-800", dot: "bg-emerald-500", bar: "#10b981" },
  WALKOVER:    { label: "Walkover",      cls: "bg-amber-100 text-amber-800",     dot: "bg-amber-500",   bar: "#f59e0b" },
  BYE:         { label: "BYE",           cls: "bg-slate-100 dark:bg-white/10 text-slate-400 dark:text-white/40",     dot: "bg-slate-300",   bar: "#cbd5e1" },
};

const fmtDate = (iso) => {
  if (!iso) return "Chưa có lịch";
  return new Date(iso).toLocaleString("vi-VN", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
};

const StatusBadge = ({ status }) => {
  const c = STATUS_CFG[status] || STATUS_CFG.PENDING;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${c.cls}`}
      style={{ width: "fit-content" }}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${c.dot}`} />
      {c.label}
    </span>
  );
};

const PlayerMatchSchedulePage = () => {
  const navigate = useNavigate();
  const gridRef = useReveal({ threshold: 0.08 });
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMatch, setSelectedMatch] = useState(null);

  useEffect(() => {
    getMyMatches()
      .then((data) => setMatches(Array.isArray(data) ? data : []))
      .catch((err) => toast.error(getApiErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  const grouped = matches.reduce((acc, m) => {
    const key = m.tournamentId;
    if (!acc[key]) acc[key] = { matches: [] };
    acc[key].matches.push(m);
    return acc;
  }, {});

  return (
    <div className="profile-page content-dark">
      <div className="profile-page-inner">
        <div className="profile-prefs-card">
          <div className="profile-prefs-tab">
            <span className="profile-prefs-tab-line" aria-hidden />
            <span className="profile-prefs-tab-text">Lịch sử thi đấu</span>
          </div>

          <div className="profile-prefs-body">
            <p className="profile-prefs-lead">Tất cả trận đấu bạn tham gia</p>

            {loading ? (
              <div className="profile-prefs-empty">Đang tải...</div>
            ) : matches.length === 0 ? (
              <div className="profile-prefs-empty">
                <p className="mb-4">Bạn chưa có trận đấu nào.</p>
                <button type="button" className="profile-btn-save" onClick={() => navigate("/event")}>
                  Xem giải đấu
                </button>
              </div>
            ) : (
              <div ref={gridRef} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {Object.entries(grouped).map(([tournamentId, group], groupIndex) => {
                  const tourName = group.matches[0]?.tournamentName;
                  const stageType = group.matches[0]?.stageType;
                  return (
                    <div key={tournamentId} className="ui-stagger flex" style={{ "--i": Math.min(groupIndex, 11) }}>
                    <div className="ui-card bg-white dark:bg-[#131c2e] border border-slate-200 dark:border-white/10 rounded-xl overflow-hidden w-full"
                      style={{ boxShadow: "0 1px 3px rgba(15,23,42,0.06), 0 4px 12px rgba(15,23,42,0.04)" }}>
                      {/* Group header */}
                      <div className="px-4 py-3 bg-slate-800 flex items-center gap-3">
                        <Swords size={14} className="text-slate-300 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-semibold text-sm truncate">
                            {tourName || stageType || "Giải đấu"}
                          </p>
                          <p className="text-slate-400 dark:text-white/40 text-xs">
                            {stageType && `${stageType} · `}{group.matches.length} trận
                          </p>
                        </div>
                        <button type="button" onClick={() => navigate(`/event/${tournamentId}`)}
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-300 border border-slate-600 hover:bg-slate-700 transition-colors flex-shrink-0">
                          Xem giải →
                        </button>
                      </div>

                      {/* Match rows */}
                      <div className="divide-y divide-slate-100">
                        {group.matches
                          .sort((a, b) => a.roundNo - b.roundNo || a.positionNo - b.positionNo)
                          .map((m) => {
                            const isWinner1 = m.winner?.id === m.player1?.id;
                            const isWinner2 = m.winner?.id === m.player2?.id;
                            return (
                              <button key={m.id} type="button" onClick={() => setSelectedMatch(m)}
                                className="ui-row w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-white/5 border-l-2 border-l-transparent">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-xs text-slate-400 dark:text-white/40 font-mono">{m.matchCode}</span>
                                  <StatusBadge status={m.status} />
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className={`flex-1 text-sm truncate ${isWinner1 ? "font-bold text-emerald-600" : "font-medium text-slate-800 dark:text-white"}`}>
                                    {m.player1?.displayName ?? "TBD"}
                                  </span>
                                  <span className="text-xs text-slate-300 flex-shrink-0">
                                    {(m.status === "IN_PROGRESS" || m.status === "COMPLETED")
                                      ? `${m.player1Score} — ${m.player2Score}`
                                      : "vs"
                                    }
                                  </span>
                                  <span className={`flex-1 text-sm text-right truncate ${isWinner2 ? "font-bold text-emerald-600" : "font-medium text-slate-800 dark:text-white"}`}>
                                    {m.player2?.displayName ?? "TBD"}
                                  </span>
                                </div>
                                <p className="flex items-center gap-1 text-xs text-slate-400 dark:text-white/40 mt-1.5">
                                  <Calendar size={10} />{fmtDate(m.scheduledAt)}
                                </p>
                              </button>
                            );
                          })}
                      </div>
                    </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Match Detail Modal — giống AdminModal ── */}
      {selectedMatch && (() => {
        const m = selectedMatch;
        const isWinner1 = m.winner?.id === m.player1?.id;
        const isWinner2 = m.winner?.id === m.player2?.id;
        const hasScore = m.status === "IN_PROGRESS" || m.status === "COMPLETED";
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="ui-modal-backdrop absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setSelectedMatch(null)} role="presentation" />

            <div className="ui-modal-panel relative bg-white dark:bg-[#131c2e] border border-slate-200 dark:border-white/10 rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col">
              {/* Header */}
              <div className="px-6 py-4 border-b border-slate-200 dark:border-white/10 shrink-0 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Chi tiết trận đấu</h3>
                <button type="button" onClick={() => setSelectedMatch(null)}
                  className="text-slate-400 dark:text-white/40 hover:text-slate-600 dark:hover:text-white/70 transition-colors p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10">
                  <X size={18} />
                </button>
              </div>

              {/* Body */}
              <div className="px-6 py-4 text-sm text-slate-600 dark:text-white/70 overflow-y-auto flex-1 space-y-4">
                {/* Stage info */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-mono text-slate-400 dark:text-white/40 bg-slate-100 dark:bg-white/10 px-2 py-0.5 rounded">{m.matchCode}</span>
                  <StatusBadge status={m.status} />
                  {m.roundNo && (
                    <span className="text-xs text-slate-500 dark:text-white/60 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 px-2 py-0.5 rounded">
                      Vòng {m.roundNo}
                    </span>
                  )}
                </div>

                {/* VS display */}
                <div className="rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 text-center">
                      <p className={`font-semibold text-sm ${isWinner1 ? "text-emerald-600" : "text-slate-900 dark:text-white"}`}>
                        {m.player1?.displayName ?? "TBD"}
                      </p>
                      {isWinner1 && <p className="text-xs font-bold text-emerald-600 mt-0.5">🏆 Thắng</p>}
                    </div>

                    <div className="flex-shrink-0 text-center min-w-[5rem]">
                      {hasScore ? (
                        <>
                          <p className="text-2xl font-black text-slate-900 dark:text-white font-mono leading-none">
                            {m.player1Score}
                            <span className="text-slate-300 mx-1">—</span>
                            {m.player2Score}
                          </p>
                          {m.raceTo && <p className="text-xs text-slate-400 dark:text-white/40 mt-1">Đánh tới {m.raceTo} ván</p>}
                        </>
                      ) : (
                        <p className="text-base font-bold text-slate-300">vs</p>
                      )}
                    </div>

                    <div className="flex-1 text-center">
                      <p className={`font-semibold text-sm ${isWinner2 ? "text-emerald-600" : "text-slate-900 dark:text-white"}`}>
                        {m.player2?.displayName ?? "TBD"}
                      </p>
                      {isWinner2 && <p className="text-xs font-bold text-emerald-600 mt-0.5">🏆 Thắng</p>}
                    </div>
                  </div>
                </div>

                {/* Info rows */}
                <div>
                  <p className="text-xs font-semibold text-slate-400 dark:text-white/40 uppercase tracking-wide mb-2">Thông tin trận đấu</p>
                  <div className="divide-y divide-slate-100">
                    <div className="flex justify-between py-2">
                      <span className="text-slate-500 dark:text-white/60">Lịch thi đấu</span>
                      <span className="font-medium text-slate-900 dark:text-white">{fmtDate(m.scheduledAt)}</span>
                    </div>
                    {m.stageType && (
                      <div className="flex justify-between py-2">
                        <span className="text-slate-500 dark:text-white/60">Giai đoạn</span>
                        <span className="font-medium text-slate-900 dark:text-white">{m.stageType}</span>
                      </div>
                    )}
                    {m.roundNo && (
                      <div className="flex justify-between py-2">
                        <span className="text-slate-500 dark:text-white/60">Vòng đấu</span>
                        <span className="font-medium text-slate-900 dark:text-white">Vòng {m.roundNo}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 rounded-b-xl shrink-0 flex justify-end gap-2">
                <button type="button" onClick={() => setSelectedMatch(null)}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-white dark:bg-[#131c2e] text-slate-900 dark:text-white border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer">
                  Đóng
                </button>
                <button type="button" onClick={() => navigate(`/event/${m.tournamentId}`)}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg text-white transition-colors cursor-pointer"
                  style={{ background: "#0c1527" }}>
                  Xem giải đấu
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default PlayerMatchSchedulePage;
