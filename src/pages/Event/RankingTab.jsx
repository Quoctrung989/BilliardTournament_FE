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
import "./eventTheme.css";

/* ─── Helpers ───────────────────────────────────────────────────────── */

const splitName = (fullName = "") => {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return { first: "", last: parts[0] || "" };
  return { first: parts.slice(0, -1).join(" "), last: parts.at(-1) };
};

/* Avatar chữ cái khi cơ thủ chưa có ảnh — mỗi người một màu ổn định theo tên */
const AVATAR_COLORS = ["var(--evt-name)", "#1e3a5f", "#7f1616", "#0f5132", "#5b3d8c", "#8a5a00", "#155e63", "#7c2d12"];
const initialsOf = (name = "") => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts.at(-1).charAt(0)).toUpperCase();
};
const avatarColor = (name = "") => {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
};

/* ─── WNT-style name ──────────────────────────────────────────────────── */

const PlayerName = ({ name, variant = "row" }) => {
  const { first, last } = splitName(name);
  const isHero = variant === "hero";

  return (
    <p style={{
      margin: 0,
      fontSize: isHero ? "1.75rem" : "0.9rem",
      color: isHero ? "#e8c65a" : "var(--evt-name)",
      lineHeight: 1.25,
      letterSpacing: isHero ? "-0.02em" : "normal",
    }}>
      {first && (
        <span style={{ fontWeight: 400, fontStyle: "normal" }}>{first} </span>
      )}
      <span style={{ fontWeight: 800, fontStyle: "normal", textTransform: "uppercase" }}>
        {last}
      </span>
    </p>
  );
};

/* ─── Rank label ───────────────────────────────────────────────────────── */

const RankLabelDisplay = ({ label, variant = "row" }) => {
  const isHero = variant === "hero";
  return (
    <span style={{
      fontWeight: 800,
      fontStyle: "italic",
      fontSize: isHero ? "2rem" : "1.1rem",
      color: isHero ? "#c9a227" : "var(--evt-text-3)",
      lineHeight: 1,
      minWidth: isHero ? undefined : "3.5rem",
      textAlign: isHero ? undefined : "center",
      flexShrink: 0,
    }}>
      {label}
    </span>
  );
};

/* ─── Country line ────────────────────────────────────────────────────── */

const CountryLine = ({ tone = "row" }) => {
  const isHero = tone === "hero";
  return (
    <p style={{
      margin: "0.35rem 0 0",
      fontSize: isHero ? "0.7rem" : "0.65rem",
      color: isHero ? "rgba(201,162,39,0.7)" : "var(--evt-text-4)",
      fontWeight: 600,
      textTransform: "uppercase",
      letterSpacing: "0.1em",
      display: "flex",
      alignItems: "center",
      gap: "0.35rem",
    }}>
      <span style={{ fontSize: "0.75rem", lineHeight: 1 }}>{DEFAULT_COUNTRY.flag}</span>
      {DEFAULT_COUNTRY.name}
    </p>
  );
};

/* ─── #1 Champion hero ─────────────────────────────────────────────── */

const ChampionHero = ({ player, isProvisional, onNavigate }) => {
  if (!player) return null;

  return (
    <div
      style={{
        position: "relative",
        borderRadius: "0.75rem",
        overflow: "hidden",
        background: "linear-gradient(120deg, #0a1628 0%, #10294b 50%, #0a1628 100%)",
        border: "1.5px solid rgba(201,162,39,0.55)",
        boxShadow: "0 0 0 1px rgba(201,162,39,0.15), 0 10px 40px rgba(10,22,40,0.45)",
        cursor: "pointer",
      }}
      onClick={() => onNavigate(player.participantId)}
    >
      <div style={{ display: "flex", alignItems: "stretch", minHeight: "155px" }}>
        {/* Avatar */}
        <div style={{
          position: "relative", width: "120px", flexShrink: 0,
          display: "flex", alignItems: "flex-end", justifyContent: "center",
        }}>
          {player.avatarUrl ? (
            <img
              src={player.avatarUrl}
              alt={player.displayName}
              onError={(e) => { e.currentTarget.src = DEFAULT_PLAYER_AVATAR; }}
              style={{
                height: "145px", width: "100%", objectFit: "cover", objectPosition: "top",
                WebkitMaskImage: "linear-gradient(to bottom, #000 85%, transparent 100%)",
              }}
            />
          ) : (
            <div style={{
              width: "100%", height: "145px",
              display: "flex", alignItems: "center", justifyContent: "center",
              background: "linear-gradient(160deg, rgba(201,162,39,0.28), rgba(201,162,39,0.04))",
              color: "#e8c65a", fontWeight: 800, fontSize: "2.5rem", letterSpacing: "0.02em",
            }}>
              {initialsOf(player.displayName)}
            </div>
          )}
        </div>

        {/* Content */}
        <div style={{
          flex: 1, display: "flex", flexDirection: "column", justifyContent: "center",
          padding: "1.25rem 1.5rem", gap: "0.4rem", minWidth: 0,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
            <RankLabelDisplay label={RankLabel.CHAMPION} variant="hero" />
            {isProvisional && (
              <span style={{
                fontSize: "0.6rem", textTransform: "uppercase", letterSpacing: "0.1em",
                color: "rgba(201,162,39,0.8)", border: "1px solid rgba(201,162,39,0.4)",
                padding: "0.15rem 0.5rem", borderRadius: "999px",
              }}>
                Tạm thời
              </span>
            )}
          </div>
          <PlayerName name={player.displayName} variant="hero" />
          <CountryLine tone="hero" />
        </div>

        {/* Note */}
        {player.note && (
          <div style={{
            display: "flex", alignItems: "center", paddingRight: "2rem", flexShrink: 0,
          }}>
            <span style={{
              color: "#c9a227", fontSize: "0.875rem",
              fontWeight: 700, fontStyle: "italic", textTransform: "uppercase", letterSpacing: "0.05em",
            }}>
              {player.note}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

/* ─── List row ───────────────────────────────────────────────────────── */

const RankRow = ({ player, isLast, onNavigate }) => (
  <div
    style={{
      display: "flex", alignItems: "center", gap: "1rem",
      padding: "0.875rem 1.75rem",
      borderBottom: isLast ? "none" : "1px solid var(--evt-card-border)",
      transition: "background 0.15s",
      cursor: "pointer",
    }}
    onClick={() => onNavigate(player.participantId)}
    onMouseEnter={(e) => { e.currentTarget.style.background = "var(--evt-row-hover)"; }}
    onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
  >
    <RankLabelDisplay label={player.rankLabel} />
    {player.avatarUrl ? (
      <img
        src={player.avatarUrl}
        alt={player.displayName}
        onError={(e) => { e.currentTarget.src = DEFAULT_PLAYER_AVATAR; }}
        style={{
          width: "48px", height: "48px", borderRadius: "50%",
          objectFit: "cover", objectPosition: "top",
          background: "var(--evt-subtle)", border: "1px solid var(--evt-card-border)", flexShrink: 0,
        }}
      />
    ) : (
      <div style={{
        width: "48px", height: "48px", borderRadius: "50%", flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: avatarColor(player.displayName), color: "#fff",
        fontWeight: 700, fontSize: "0.9rem",
      }}>
        {initialsOf(player.displayName)}
      </div>
    )}
    <div style={{ flex: 1, minWidth: 0 }}>
      <PlayerName name={player.displayName} />
      <CountryLine />
    </div>
    {player.note && (
      <span style={{
        color: "var(--evt-text-4)", fontSize: "0.75rem", fontWeight: 500,
        fontStyle: "italic", flexShrink: 0,
      }}>
        {player.note}
      </span>
    )}
  </div>
);

/* ─── Main tab ──────────────────────────────────────────────────────────── */

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
      <div style={{
        background: "var(--evt-card-bg)", borderRadius: "1rem", border: "1px solid var(--evt-card-border)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: "6rem 2rem",
      }}>
        <p style={{ color: "var(--evt-text-4)", fontSize: "0.875rem" }}>Đang tải xếp hạng...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        background: "var(--evt-card-bg)", borderRadius: "1rem", border: "1px solid var(--evt-card-border)",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        padding: "5rem 2rem", gap: "0.5rem",
      }}>
        <p style={{ color: "var(--evt-text-3)", fontSize: "0.875rem" }}>{error}</p>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div style={{
        background: "var(--evt-card-bg)", borderRadius: "1rem", border: "1px solid var(--evt-card-border)",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        padding: "5rem 2rem", gap: "0.75rem",
      }}>
        <Trophy size={36} style={{ color: "var(--evt-card-border)" }} />
        <p style={{ color: "var(--evt-text-4)", fontSize: "0.875rem", fontWeight: 500 }}>
          {RankingEmptyMessage.NO_PLAYERS}
        </p>
        <p style={{ color: "var(--evt-text-4)", fontSize: "0.75rem" }}>
          {tournament?.status === TournamentStatus.COMPLETED
            ? RankingEmptyMessage.NO_DATA_COMPLETED
            : RankingEmptyMessage.NO_DATA_IN_PROGRESS}
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      {/* Badge + search */}
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "0.75rem", padding: "0 0.25rem" }}>
        <span style={{
          fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.1em",
          fontWeight: 600, padding: "0.2rem 0.75rem", borderRadius: "999px",
          border: "1px solid",
          ...(isOfficial
            ? { background: "#f0fdf4", color: "#15803d", borderColor: "#bbf7d0" }
            : { background: "#fffbeb", color: "#b45309", borderColor: "#fde68a" }),
        }}>
          {isOfficial ? RankingBadge.OFFICIAL : RankingBadge.PROVISIONAL}
        </span>

        <div style={{ position: "relative", flex: 1, minWidth: "200px", maxWidth: "260px", marginLeft: "auto" }}>
          <Search size={13} style={{
            position: "absolute", left: "0.7rem", top: "50%",
            transform: "translateY(-50%)", color: "var(--evt-text-4)", pointerEvents: "none",
          }} />
          <input
            type="text"
            placeholder="Tìm cơ thủ..."
            value={nameSearch}
            onChange={(e) => setNameSearch(e.target.value)}
            style={{
              width: "100%", background: "var(--evt-row-hover)", border: "1px solid var(--evt-card-border)",
              borderRadius: "999px", padding: "0.45rem 0.9rem 0.45rem 2rem",
              fontSize: "0.8rem", outline: "none", boxSizing: "border-box", color: "var(--evt-name)",
            }}
          />
        </div>

        <span style={{ fontSize: "0.7rem", color: "var(--evt-text-4)" }}>{filtered.length} cơ thủ</span>
      </div>

      {/* Champion hero */}
      {champion && (
        <ChampionHero player={champion} isProvisional={isProvisional} onNavigate={goToProfile} />
      )}

      {/* Rest list */}
      {rest.length > 0 && (
        <div style={{
          background: "var(--evt-card-bg)", borderRadius: "1rem", border: "1px solid var(--evt-card-border)",
          overflow: "hidden", boxShadow: "0 6px 28px rgba(10,22,40,0.07)",
        }}>
          {rest.map((player, idx) => (
            <RankRow
              key={`${player.participantId}-${idx}`}
              player={player}
              isLast={idx === rest.length - 1}
              onNavigate={goToProfile}
            />
          ))}
        </div>
      )}

      {filtered.length === 0 && (
        <div style={{
          background: "var(--evt-card-bg)", borderRadius: "1rem", border: "1px solid var(--evt-card-border)",
          textAlign: "center", padding: "3rem 1.5rem",
          color: "var(--evt-text-4)", fontSize: "0.875rem",
        }}>
          {RankingEmptyMessage.SEARCH_NOT_FOUND}
        </div>
      )}
    </div>
  );
};

export default RankingTab;
