import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Trophy } from "lucide-react";
import { getPublicTournamentRankings } from "../../api/publicTournamentApi";
import {
  DEFAULT_COUNTRY,
  DEFAULT_PLAYER_AVATAR,
  RankLabel,
  RankingBadge,
  RankingEmptyMessage,
  TournamentStatus,
} from "../../constants/rankingEnums";
import { RANKING_NOTE_LABELS } from "../../constants/tournamentConfig";
import "./eventTheme.css";

const noteLabel = (note) => (note ? RANKING_NOTE_LABELS[note] ?? note : note);

const PlayerAvatar = ({ src, alt, className, style }) => (
  <img
    className={className}
    style={style}
    src={src || DEFAULT_PLAYER_AVATAR}
    alt={alt || ""}
    onError={(e) => {
      if (e.currentTarget.dataset.fallback === "1") return;
      e.currentTarget.dataset.fallback = "1";
      e.currentTarget.src = DEFAULT_PLAYER_AVATAR;
    }}
  />
);

const isTopTwo = (label) => label === "#2" || label === RankLabel.CHAMPION;

const EmptyState = ({ children }) => (
  <div className="evt-surface" style={{
    background: "var(--evt-card-bg)", borderRadius: "1rem", border: "1px solid var(--evt-card-border)",
    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
    padding: "5rem 2rem", gap: "0.65rem", textAlign: "center",
  }}>
    {children}
  </div>
);

const ChampionHero = ({ player, isProvisional, onNavigate }) => {
  if (!player) return null;

  return (
    <div className="evt-rank-champion" onClick={() => onNavigate(player.participantId)} role="button" tabIndex={0}
         onKeyDown={(e) => { if (e.key === "Enter") onNavigate(player.participantId); }}>
      <div className="evt-rank-champion__avatar">
        <PlayerAvatar src={player.avatarUrl} alt={player.displayName} />
      </div>

      <div className="evt-rank-champion__body">
        <div className="evt-rank-champion__eyebrow">
          <span className="evt-rank-champion__tag">
            <Trophy size={13} strokeWidth={2.4} />
            {RankLabel.CHAMPION} · Vô địch
          </span>
          {isProvisional && (
            <span style={{
              fontSize: "0.62rem", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase",
              color: "rgba(232,198,90,0.85)", border: "1px solid rgba(201,162,39,0.35)",
              padding: "0.18rem 0.55rem", borderRadius: "999px",
            }}>
              Tạm thời
            </span>
          )}
        </div>
        <p className="evt-player-name evt-player-name--hero">{player.displayName}</p>
        <p className="evt-meta evt-meta--hero">
          <span style={{ fontSize: "0.75rem", lineHeight: 1 }}>{DEFAULT_COUNTRY.flag}</span>
          {DEFAULT_COUNTRY.name}
        </p>
      </div>

      {player.note && (
        <div className="evt-rank-champion__note">{noteLabel(player.note)}</div>
      )}
    </div>
  );
};

const RankRow = ({ player, onNavigate }) => (
  <div className="evt-rank-row" onClick={() => onNavigate(player.participantId)} role="button" tabIndex={0}
       onKeyDown={(e) => { if (e.key === "Enter") onNavigate(player.participantId); }}>
    <span className={`evt-rank-row__label ${isTopTwo(player.rankLabel) ? "evt-rank-row__label--top" : ""}`}>
      {player.rankLabel}
    </span>
    <PlayerAvatar
      className="evt-rank-row__avatar"
      src={player.avatarUrl}
      alt={player.displayName}
    />
    <div style={{ minWidth: 0 }}>
      <p className="evt-player-name">{player.displayName}</p>
      <p className="evt-meta">
        <span style={{ fontSize: "0.75rem", lineHeight: 1 }}>{DEFAULT_COUNTRY.flag}</span>
        {DEFAULT_COUNTRY.name}
      </p>
    </div>
    {player.note ? <span className="evt-rank-row__note">{noteLabel(player.note)}</span> : <span />}
  </div>
);

const RankingTab = ({ tournament }) => {
  const navigate = useNavigate();
  const [entries, setEntries] = useState([]);
  const [isOfficial, setIsOfficial] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [nameSearch, setNameSearch] = useState("");
  const goToProfile = (participantId) => navigate(`/event/players/${participantId}`);

  useEffect(() => {
    if (!tournament?.id) return;
    let cancelled = false;
    setLoading(true);
    setError("");
    getPublicTournamentRankings(tournament.id)
      .then((data) => {
        if (cancelled) return;
        setEntries(data?.entries || []);
        setIsOfficial(!!data?.isOfficial);
      })
      .catch(() => {
        if (!cancelled) {
          setEntries([]);
          setError(RankingEmptyMessage.LOAD_ERROR);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [tournament?.id]);

  const filtered = useMemo(() => {
    if (!nameSearch.trim()) return entries;
    const q = nameSearch.trim().toLowerCase();
    return entries.filter((e) => e.displayName?.toLowerCase().includes(q));
  }, [entries, nameSearch]);

  const champion = filtered.find((e) => e.rankLabel === RankLabel.CHAMPION);
  const rest = champion
    ? filtered.filter((e) => e.participantId !== champion.participantId)
    : filtered;

  const isProvisional = !isOfficial && entries.length > 0;

  if (loading) {
    return (
      <EmptyState>
        <p style={{ color: "var(--evt-text-4)", fontSize: "0.875rem", margin: 0 }}>Đang tải xếp hạng...</p>
      </EmptyState>
    );
  }

  if (error) {
    return (
      <EmptyState>
        <p style={{ color: "var(--evt-text-3)", fontSize: "0.875rem", margin: 0 }}>{error}</p>
      </EmptyState>
    );
  }

  if (entries.length === 0) {
    return (
      <EmptyState>
        <Trophy size={34} style={{ color: "var(--evt-card-border)" }} />
        <p style={{ color: "var(--evt-text-3)", fontSize: "0.9rem", fontWeight: 600, margin: 0 }}>
          {RankingEmptyMessage.NO_PLAYERS}
        </p>
        <p style={{ color: "var(--evt-text-4)", fontSize: "0.78rem", margin: 0 }}>
          {tournament?.status === TournamentStatus.COMPLETED
            ? RankingEmptyMessage.NO_DATA_COMPLETED
            : RankingEmptyMessage.NO_DATA_IN_PROGRESS}
        </p>
      </EmptyState>
    );
  }

  return (
    <div className="evt-rank-shell">
      <div className="evt-rank-toolbar">
        <span className={`evt-rank-badge ${isOfficial ? "evt-rank-badge--official" : "evt-rank-badge--provisional"}`}>
          {isOfficial ? RankingBadge.OFFICIAL : RankingBadge.PROVISIONAL}
        </span>

        <div className="evt-rank-search">
          <Search size={13} style={{
            position: "absolute", left: "0.75rem", top: "50%",
            transform: "translateY(-50%)", color: "var(--evt-text-4)", pointerEvents: "none",
          }} />
          <input
            type="text"
            placeholder="Tìm cơ thủ..."
            value={nameSearch}
            onChange={(e) => setNameSearch(e.target.value)}
          />
        </div>

        <span className="evt-rank-count">{filtered.length} cơ thủ</span>
      </div>

      {champion && (
        <ChampionHero player={champion} isProvisional={isProvisional} onNavigate={goToProfile} />
      )}

      {rest.length > 0 && (
        <div className="evt-rank-list">
          {rest.map((player, idx) => (
            <RankRow
              key={`${player.participantId}-${idx}`}
              player={player}
              onNavigate={goToProfile}
            />
          ))}
        </div>
      )}

      {filtered.length === 0 && (
        <EmptyState>
          <p style={{ color: "var(--evt-text-4)", fontSize: "0.875rem", margin: 0 }}>
            {RankingEmptyMessage.SEARCH_NOT_FOUND}
          </p>
        </EmptyState>
      )}
    </div>
  );
};

export default RankingTab;
