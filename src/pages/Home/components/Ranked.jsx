import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useReveal } from "../../../hooks/useReveal";
import { getLeaderboard } from "../../../api/leaderboardApi";
import {
  DEFAULT_PLAYER_AVATAR,
  DEFAULT_COUNTRY,
} from "../../../constants/rankingEnums";

const TOP_COUNT = 9;

/** Màu viền dưới ảnh — xoay vòng theo thứ hạng, thuần trang trí. */
const ACCENTS = [
  "var(--accent-yellow)",
  "var(--accent-cyan)",
  "var(--accent-red)",
  "var(--accent-pink)",
  "var(--accent-purple)",
  "var(--accent-green)",
  "var(--accent-orange)",
  "var(--accent-gray)",
];

const accentOf = (index) => ACCENTS[index % ACCENTS.length];

/* Tách tên: dòng trên là phần đầu, dòng dưới in đậm là phần còn lại */
const splitName = (fullName) => {
  const parts = (fullName || "").trim().split(/\s+/);
  if (parts.length <= 1) return { first: "", last: fullName || "—" };
  return { first: parts[0], last: parts.slice(1).join(" ") };
};

/**
 * Bảng xếp hạng điểm tích lũy của năm hiện tại — không phải kết quả một giải lẻ.
 * Điểm cộng dồn từ `tournament_results.points_earned`, lấy qua endpoint công khai
 * `/leaderboard`; thang điểm xem `TournamentPointsPolicy` phía backend.
 */
function useYearlyLeaderboard() {
  const [state, setState] = useState({ loading: true, players: [] });

  useEffect(() => {
    let active = true;

    getLeaderboard({ period: "YEAR", page: 0, size: TOP_COUNT }, TOP_COUNT)
      .then((result) => {
        if (!active) return;
        setState({
          loading: false,
          players: (result.content || []).map((entry, i) => ({
            ...entry,
            accent: accentOf(i),
            image: entry.avatarUrl || DEFAULT_PLAYER_AVATAR,
          })),
        });
      })
      .catch(() => {
        if (active) setState({ loading: false, players: [] });
      });

    return () => {
      active = false;
    };
  }, []);

  return state;
}

const PlayerCard = ({ player, index }) => {
  const { first, last } = splitName(player.playerName);

  return (
    <div style={{ "--i": index + 1 }} className="hm-stagger group">
      <div className="hm-player">
        <Link to={`/event/players/user/${player.userId}`} className="block">
          <div className="relative">
            <div
              className="hm-accent-bar w-full bg-white border-b-[15px] relative h-[120px] overflow-visible rounded-tl-[8px]"
              style={{ borderColor: player.accent }}
            >
              <img
                src={player.image}
                alt=""
                onError={(e) => {
                  e.currentTarget.src = DEFAULT_PLAYER_AVATAR;
                }}
                className="h-[150px] w-full object-contain transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-110 absolute left-0 bottom-0"
              />
            </div>

            <div className="absolute left-1 top-1 text-lg">
              {DEFAULT_COUNTRY.flag}
            </div>

            <div className="hm-rank absolute right-1 top-1 text-2xl font-black">
              <span className="font-bold text-sm">#</span>
              {player.rank}
            </div>
          </div>

          <div className="p-4 rounded-bl-[8px] border-b border-l border-gray-200 dark:border-white h-[70px]">
            <h3 className="hm-title text-[15px] font-black uppercase leading-[1.3] text-[#1d2430] dark:text-[var(--wnt25-color-light)] flex flex-col">
              <span>{first}</span>
              <span>{last}</span>
            </h3>
          </div>
        </Link>
      </div>
    </div>
  );
};

const Ranked = () => {
  const revealRef = useReveal();
  const { loading, players } = useYearlyLeaderboard();

  const header = (
    <div className="hm-reveal-left w-full bg-[var(--wnt25-color-dark)] p-4 rounded-md flex flex-wrap gap-3 justify-between items-center text-[var(--wnt25-color-light)]">
      <h2 className="text-lg font-bold">
        Top {TOP_COUNT} tay cơ hàng đầu năm {new Date().getFullYear()}
      </h2>
      <Link
        to="/rankings"
        className="ui-underline flex h-10 items-center justify-center rounded-md border border-gray-300 px-3 text-sm transition hover:bg-gray-100 hover:text-[var(--wnt25-color-dark)] italic"
      >
        Tất cả tay cơ xếp hạng
      </Link>
    </div>
  );

  if (loading) {
    return (
      <div className="flex flex-col gap-10 w-full px-6 py-8 md:px-16 max-w-[1600px] mx-auto">
        <div className="hm-skeleton h-[60px]" />
        <div className="grid grid-cols-1 gap-10 xl:grid-cols-[1.15fr_2.2fr]">
          <div className="hm-skeleton h-[420px]" />
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
            {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
              <div key={i} className="hm-skeleton h-[190px]" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Chưa ai tích điểm trong năm — vẫn giữ header để người xem biết khối này tồn tại
  // và bấm sang trang xếp hạng đầy đủ (nơi có bộ lọc tháng/quý/năm).
  if (players.length === 0) {
    return (
      <div className="flex flex-col gap-10 w-full px-6 py-8 md:px-16 max-w-[1600px] mx-auto">
        {header}
        <div className="text-center py-16 text-slate-400 dark:text-white/50">
          Chưa có cơ thủ nào tích lũy điểm trong năm nay.
        </div>
      </div>
    );
  }

  const [top, ...rest] = players;
  const topName = splitName(top.playerName);

  return (
    <div
      ref={revealRef}
      className="flex flex-col gap-10 w-full px-6 py-8 md:px-16 max-w-[1600px] mx-auto"
    >
      {header}

      <div className="grid grid-cols-1 gap-10 xl:grid-cols-[1.15fr_2.2fr]">
        {/* ── Hạng 1 ── */}
        <div className="hm-stagger" style={{ "--i": 0 }}>
          <Link
            to={`/event/players/user/${top.userId}`}
            className="hm-card hm-sheen group block h-full overflow-hidden rounded-l-[16px] border-b-[2px] border-l-[2px] border-gray-200 dark:border-white"
          >
            <div className="relative overflow-hidden">
              <div
                className="hm-accent-bar h-[300px] flex items-end relative bg-[var(--wnt25-color-light)] border-b-[30px] w-full"
                style={{ borderColor: top.accent }}
              >
                <img
                  src={top.image}
                  alt=""
                  onError={(e) => {
                    e.currentTarget.src = DEFAULT_PLAYER_AVATAR;
                  }}
                  className="h-[270px] w-full object-contain object-center transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-110 absolute inset-0"
                />
              </div>

              <div className="absolute left-5 top-5 text-7xl">
                {DEFAULT_COUNTRY.flag}
              </div>

              <div className="hm-rank absolute right-5 top-5 text-[60px] font-black">
                <span className="text-[30px] font-bold tracking-tight">#</span>
                {top.rank}
              </div>
            </div>

            <div className="flex items-end justify-between px-6 py-4">
              <div>
                <p className="text-[20px] font-medium leading-none text-[#1d2430] dark:text-white">
                  {topName.first}
                </p>
                <h3 className="hm-title text-[36px] font-black uppercase leading-[1.15] text-[#1d2430] dark:text-white">
                  {topName.last}
                </h3>
                <p className="mt-2 text-sm font-bold text-[#ef342a]">
                  {top.totalPoints} điểm
                </p>
              </div>

              <span className="hm-arrow flex h-12 w-12 items-center justify-center rounded-md border border-gray-300 dark:border-white/30 text-2xl text-[#1d2430] dark:text-white">
                ↗
              </span>
            </div>
          </Link>
        </div>

        {/* ── Hạng 2 trở đi ── */}
        <div className="grid grid-cols-1 gap-y-12 gap-x-6 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4">
          {rest.map((player, index) => (
            <PlayerCard key={player.userId} player={player} index={index} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Ranked;
