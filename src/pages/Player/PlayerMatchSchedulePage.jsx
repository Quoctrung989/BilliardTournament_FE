import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { getMyMatches } from "../../api/matchApi";
import { getApiErrorMessage } from "../../utils/apiError";

const STATUS_CFG = {
  PENDING:     { label: "Chờ thi đấu",   cls: "bg-slate-100 text-slate-600"     },
  IN_PROGRESS: { label: "Đang diễn ra",  cls: "bg-blue-100 text-blue-800"       },
  COMPLETED:   { label: "Hoàn thành",    cls: "bg-emerald-100 text-emerald-800"  },
  WALKOVER:    { label: "Walkover",       cls: "bg-amber-100 text-amber-800"      },
  BYE:         { label: "BYE",            cls: "bg-slate-100 text-slate-400"      },
};

const fmtDate = (iso) => {
  if (!iso) return "Chưa có lịch";
  return new Date(iso).toLocaleString("vi-VN", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
};

const PlayerMatchSchedulePage = () => {
  const navigate = useNavigate();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyMatches()
      .then((data) => setMatches(Array.isArray(data) ? data : []))
      .catch((err) => toast.error(getApiErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  const grouped = matches.reduce((acc, m) => {
    const key = m.tournamentId;
    if (!acc[key]) acc[key] = { name: m.stageName?.split(" ")[0] ?? "Giải đấu", matches: [] };
    acc[key].matches.push(m);
    return acc;
  }, {});

  return (
    <div className="min-h-screen" style={{ background: "#f5f6fa" }}>
      <div className="w-full py-8 px-6" style={{ background: "linear-gradient(135deg,#010851 0%,#0d1b2e 100%)" }}>
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-black text-white mb-1">Lịch thi đấu của tôi</h1>
          <p className="text-white/50 text-sm">Tất cả trận đấu bạn tham gia</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {loading ? (
          <div className="bg-white rounded-3xl p-16 text-center text-slate-400">Đang tải...</div>
        ) : matches.length === 0 ? (
          <div className="bg-white rounded-3xl p-16 text-center shadow-sm">
            <p className="text-slate-400 mb-4">Bạn chưa có trận đấu nào.</p>
            <button type="button"
              onClick={() => navigate("/player/tournaments")}
              className="px-6 py-2.5 rounded-2xl font-bold text-white text-sm"
              style={{ background: "#EF342A" }}>
              Xem giải đấu
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(grouped).map(([tournamentId, group]) => (
              <div key={tournamentId} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between"
                     style={{ background: "linear-gradient(90deg,#010851,#0d1b2e)" }}>
                  <h3 className="font-bold text-white text-sm">{group.matches[0]?.stageType ?? "Giải đấu"} — Vòng</h3>
                  <button type="button"
                    onClick={() => navigate(`/player/tournaments/${tournamentId}`)}
                    className="text-white/60 hover:text-white text-xs transition-colors">
                    Xem giải →
                  </button>
                </div>

                <div className="divide-y divide-slate-50">
                  {group.matches
                    .sort((a, b) => a.roundNo - b.roundNo || a.positionNo - b.positionNo)
                    .map((m) => {
                    const cfg = STATUS_CFG[m.status] || STATUS_CFG.PENDING;
                    return (
                      <div key={m.id} className="px-5 py-4 flex items-center gap-4">
                        <div className="text-xs text-slate-400 w-16 shrink-0 font-mono">{m.matchCode}</div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 text-sm">
                            <span className={`font-medium ${m.winner?.id === m.player1?.id ? "text-emerald-700 font-bold" : "text-slate-800"}`}>
                              {m.player1?.displayName ?? "TBD"}
                            </span>
                            <span className="text-slate-300 text-xs">vs</span>
                            <span className={`font-medium ${m.winner?.id === m.player2?.id ? "text-emerald-700 font-bold" : "text-slate-800"}`}>
                              {m.player2?.displayName ?? "TBD"}
                            </span>
                          </div>
                          {(m.status === "IN_PROGRESS" || m.status === "COMPLETED") && (
                            <div className="text-xs font-mono text-slate-600 mt-0.5">
                              {m.player1Score} — {m.player2Score} <span className="text-slate-400">(Race to {m.raceTo})</span>
                            </div>
                          )}
                          <p className="text-xs text-slate-400 mt-0.5">{fmtDate(m.scheduledAt)}</p>
                        </div>

                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${cfg.cls}`}>
                          {cfg.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PlayerMatchSchedulePage;
