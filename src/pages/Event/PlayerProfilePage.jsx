import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Trophy, Award, Star } from "lucide-react";
import { getParticipantProfile, getPlayerProfileByUserId } from "../../api/publicTournamentApi";
import { RANKING_NOTE_LABELS } from "../../constants/tournamentConfig";
import { billiardRankShort } from "../../constants/profileConfig";

const DEFAULT_AVATAR = "/player-default.webp";
const noteLabel = (note) => (note ? RANKING_NOTE_LABELS[note] ?? note : note);

const splitName = (full = "") => {
  const parts = full.trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return { first: "", last: parts[0] || "" };
  return { first: parts.slice(0, -1).join(" "), last: parts.at(-1) };
};

const fmtCurrency = (v) => {
  if (!v || Number(v) === 0) return null;
  return `${Number(v).toLocaleString("vi-VN")} đ`;
};

/* ── Achievement card ── */
const RANK_MEDAL = { 1: "#c9a227", 2: "#94a3b8", 3: "#cd7f32" };

const AchievementCard = ({ entry }) => {
  const prize = fmtCurrency(entry.prizeAmount);
  const medalColor = RANK_MEDAL[entry.finalRank];

  return (
    <Link
      to={`/event/${entry.tournamentId}`}
      style={{
        display: "flex", alignItems: "center", gap: "1.25rem",
        padding: "0.875rem 1.25rem",
        background: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: "0.5rem",
        textDecoration: "none",
        transition: "background 0.15s, border-color 0.15s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "rgba(255,255,255,0.1)";
        e.currentTarget.style.borderColor = "rgba(201,162,39,0.35)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "rgba(255,255,255,0.05)";
        e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
      }}
    >
      {/* Rank badge */}
      <div style={{
        width: "44px", height: "44px", borderRadius: "50%", flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: medalColor ? `${medalColor}22` : "rgba(255,255,255,0.07)",
        border: `1.5px solid ${medalColor || "rgba(255,255,255,0.15)"}`,
        fontWeight: 900, fontStyle: "italic",
        fontSize: entry.finalRank <= 9 ? "1.1rem" : "0.8rem",
        color: medalColor || "rgba(255,255,255,0.5)",
      }}>
        #{entry.finalRank}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          margin: "0 0 0.2rem", color: "#fff", fontWeight: 600, fontSize: "0.875rem",
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
        }}>
          {entry.tournamentName}
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
          {entry.note && (
            <span style={{
              fontSize: "0.6rem", fontWeight: 700, textTransform: "uppercase",
              letterSpacing: "0.1em", color: "#c9a227",
            }}>
              {noteLabel(entry.note)}
            </span>
          )}
          {entry.pointsEarned > 0 && (
            <span style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.35)", fontWeight: 600 }}>
              +{entry.pointsEarned} pts
            </span>
          )}
          {prize && (
            <span style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.35)", fontWeight: 600 }}>
              {prize}
            </span>
          )}
        </div>
      </div>

      {entry.isOfficial
        ? <Award size={13} style={{ color: "#c9a227", flexShrink: 0 }} />
        : <Star size={13} style={{ color: "rgba(255,255,255,0.2)", flexShrink: 0 }} />}
    </Link>
  );
};

/* ── Page ── */
const PlayerProfilePage = () => {
  const { participantId, userId } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const fetchProfile = userId
      ? getPlayerProfileByUserId(userId)
      : getParticipantProfile(participantId).then((data) => {
          if (data.userId) {
            navigate(`/event/players/user/${data.userId}`, { replace: true });
            return null;
          }
          return data;
        });

    fetchProfile
      .then((data) => { if (data) setProfile(data); })
      .catch(() => navigate("/event"))
      .finally(() => setLoading(false));
  }, [participantId, userId, navigate]);

  if (loading) {
    return (
      <div style={{ background: "#e2e2e2", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "#64748b", fontSize: "0.9rem" }}>Đang tải...</p>
      </div>
    );
  }

  if (!profile) return null;

  const primaryName = profile.accountName || profile.displayName;
  const { first, last } = splitName(primaryName);
  const champCount = profile.achievements?.filter(a => a.finalRank === 1).length ?? 0;
  const totalEvents = profile.achievements?.length ?? 0;

  return (
    <div style={{ background: "#e2e2e2", minHeight: "100vh" }}>

      {/* Back */}
      <div style={{ padding: "0.875rem 1.5rem" }}>
        <button
          type="button"
          onClick={() => navigate(-1)}
          style={{
            display: "inline-flex", alignItems: "center", gap: "0.4rem",
            background: "none", border: "none", cursor: "pointer",
            color: "#64748b", fontSize: "0.8rem", fontWeight: 600,
            padding: "0.25rem 0", transition: "color 0.15s",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = "#0d1b2e"; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = "#64748b"; }}
        >
          <ArrowLeft size={13} />
          Quay lại
        </button>
      </div>

      {/* ── Hero card (WNT 2-col layout) ── */}
      <div style={{ padding: "0 1rem 1rem" }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "0.5rem",
          maxWidth: "1100px",
          margin: "0 auto",
        }}>

          {/* Left: player avatar */}
          {profile.avatarUrl ? (
            /* Real avatar: background-image + two-tone tint overlay */
            <div style={{
              backgroundImage: `url(${profile.avatarUrl})`,
              backgroundSize: "cover",
              backgroundPosition: "top center",
              backgroundRepeat: "no-repeat",
              display: "flex",
              flexDirection: "column",
              minHeight: "520px",
            }}>
              <div style={{ flex: "0 0 42%", background: "#0d1f3c", mixBlendMode: "multiply", marginBottom: "0.5rem" }} />
              <div style={{ flex: 1, background: "#3b4f65", mixBlendMode: "multiply" }} />
            </div>
          ) : (
            /* Default avatar: full silhouette on dark navy, no overlay */
            <div style={{
              backgroundImage: `url(${DEFAULT_AVATAR})`,
              backgroundSize: "cover",
              backgroundPosition: "center top",
              backgroundRepeat: "no-repeat",
              backgroundColor: "#0d1f3c",
              minHeight: "520px",
            }} />
          )}

          {/* Right: player data */}
          <div style={{
            background: "#0d1f3c",
            display: "flex",
            flexDirection: "column",
            padding: "3rem 3.5rem",
          }}>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>

              {/* Name */}
              <div style={{ marginBottom: "1.5rem" }}>
                {first && (
                  <div style={{
                    color: "rgba(148,178,218,0.75)",
                    fontStyle: "italic",
                    fontWeight: 500,
                    fontSize: "clamp(1.1rem, 2vw, 1.75rem)",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    lineHeight: 1.2,
                    marginBottom: "0.1rem",
                  }}>
                    {first}
                  </div>
                )}
                <div style={{
                  color: "#fff",
                  fontWeight: 900,
                  fontStyle: "italic",
                  fontSize: "clamp(2rem, 4.5vw, 4rem)",
                  textTransform: "uppercase",
                  letterSpacing: "-0.02em",
                  lineHeight: 0.95,
                }}>
                  {last}
                </div>
              </div>

              {/* Stats grid */}
              {(totalEvents > 0 || profile.billiardRank) && (
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(90px, 1fr))",
                  gap: "1.5rem",
                  marginBottom: "1.75rem",
                }}>
                  {totalEvents > 0 && (
                    <div>
                      <div style={{
                        color: "#c9a227", fontWeight: 900, fontStyle: "italic",
                        fontSize: "2.25rem", lineHeight: 1,
                      }}>
                        {totalEvents}
                      </div>
                      <div style={{
                        color: "rgba(255,255,255,0.35)", fontSize: "0.6rem",
                        fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em",
                        marginTop: "0.3rem",
                      }}>
                        Giải tham dự
                      </div>
                    </div>
                  )}
                  {champCount > 0 && (
                    <div>
                      <div style={{
                        color: "#c9a227", fontWeight: 900, fontStyle: "italic",
                        fontSize: "2.25rem", lineHeight: 1,
                      }}>
                        {champCount}
                      </div>
                      <div style={{
                        color: "rgba(255,255,255,0.35)", fontSize: "0.6rem",
                        fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em",
                        marginTop: "0.3rem",
                      }}>
                        Vô địch
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Badges */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                {profile.billiardRank && profile.billiardRank !== "UNKNOWN" && (
                  <span style={{
                    fontSize: "0.6rem", fontWeight: 700,
                    textTransform: "uppercase", letterSpacing: "0.1em",
                    color: "#c9a227",
                    border: "1px solid rgba(201,162,39,0.4)",
                    padding: "0.2rem 0.65rem", borderRadius: "999px",
                  }}>
                    Hạng {billiardRankShort(profile.billiardRank)}
                  </span>
                )}
              </div>

              {/* Bio */}
              {profile.bio && (
                <p style={{
                  marginTop: "1.25rem",
                  color: "rgba(255,255,255,0.4)",
                  fontSize: "0.8rem", lineHeight: 1.65,
                }}>
                  {profile.bio}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Achievements section ── */}
      <div style={{ padding: "0 1rem 3rem" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>

          {/* Section header */}
          <div style={{
            display: "flex", alignItems: "center", gap: "0.6rem",
            padding: "1.25rem 0 0.875rem",
          }}>
            <Trophy size={14} style={{ color: "#0d1b2e" }} />
            <span style={{
              fontWeight: 800, fontStyle: "italic",
              fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.12em",
              color: "#0d1b2e",
            }}>
              Thành tích giải đấu
            </span>
          </div>

          {/* Dark card wrapping achievements */}
          <div style={{
            background: "#0d1f3c",
            borderRadius: "0.5rem",
            padding: "1.25rem",
          }}>
            {!profile.achievements?.length ? (
              <p style={{
                textAlign: "center", padding: "2rem",
                color: "rgba(255,255,255,0.25)", fontSize: "0.875rem",
              }}>
                Chưa có thành tích chính thức được ghi nhận
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {profile.achievements.map((entry, i) => (
                  <AchievementCard key={`${entry.tournamentId}-${i}`} entry={entry} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
};

export default PlayerProfilePage;
