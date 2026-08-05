import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getLeaderboard } from "../../../api/leaderboardApi";
import { DEFAULT_PLAYER_AVATAR, DEFAULT_COUNTRY } from "../../../constants/rankingEnums";

const TOP_COUNT = 9;

/* Màu viền dưới ảnh — xoay vòng theo hạng để giữ nhịp màu như thiết kế WNT */
const ACCENTS = [
  "var(--accent-yellow)",
  "var(--accent-cyan)",
  "var(--accent-red)",
  "var(--accent-pink)",
  "var(--accent-purple)",
  "var(--accent-green)",
  "var(--accent-orange)",
  "var(--accent-gray)",
  "var(--accent-yellow)",
];

/* Tách tên: dòng trên là phần đầu, dòng dưới in đậm là phần còn lại */
const splitName = (fullName) => {
  const parts = (fullName || "").trim().split(/\s+/);
  if (parts.length <= 1) return { first: "", last: fullName || "—" };
  return { first: parts[0], last: parts.slice(1).join(" ") };
};

const Ranked = () => {
  const navigate = useNavigate();
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    getLeaderboard({ period: "YEAR", page: 0, size: TOP_COUNT }, TOP_COUNT)
      .then((result) => {
        if (!active) return;
        setPlayers(
          result.content.map((entry, i) => ({
            ...entry,
            accent: ACCENTS[i % ACCENTS.length],
            image: entry.avatarUrl || DEFAULT_PLAYER_AVATAR,
          }))
        );
      })
      .catch(() => {
        if (active) setPlayers([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const openProfile = (userId) => navigate(`/event/players/user/${userId}`);

  const header = (
    <div className="w-full bg-[var(--wnt25-color-dark)] p-4 rounded-md flex justify-between items-center text-[var(--wnt25-color-light)]">
      <h2 className="text-lg font-bold tracking-tight">
        Top {TOP_COUNT} tay cơ hàng đầu năm {new Date().getFullYear()}
      </h2>
      <button
        onClick={() => navigate("/rankings")}
        className="flex h-10 w-wrapper items-center justify-center rounded-md border border-gray-300 px-4 text-sm transition hover:bg-gray-100 hover:text-[var(--wnt25-color-dark)] italic"
      >
        Tất cả tay cơ xếp hạng
      </button>
    </div>
  );

  if (loading || players.length === 0) {
    return (
      <div className="flex flex-col gap-10 w-full py-8 px-16 max-w-[1600px] mx-auto">
        {header}
        <div className="text-center py-16 text-slate-400 dark:text-white/50">
          {loading ? "Đang tải bảng xếp hạng..." : "Chưa có cơ thủ nào tích lũy điểm trong năm nay."}
        </div>
      </div>
    );
  }

  const [top, ...rest] = players;
  const topName = splitName(top.playerName);

  return (
    <div className="flex flex-col gap-10 w-full py-8 px-16 max-w-[1600px] mx-auto">
      {header}

      <div className="grid grid-cols-1 gap-10 xl:grid-cols-[1.15fr_2.2fr]">
        {/* ── Hạng 1 ── */}
        <div
          className="group overflow-hidden rounded-l-[16px] border-b-[2px] border-l-[2px] border-gray-200 dark:border-white cursor-pointer"
          onClick={() => openProfile(top.userId)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && openProfile(top.userId)}
        >
          <div className="relative overflow-hidden">
            <div
              className="h-[300px] flex items-end relative bg-[var(--wnt25-color-light)] border-b-[30px] w-full"
              style={{ borderColor: top.accent }}
            >
              <img
                src={top.image}
                alt=""
                className="h-[270px] w-full object-contain object-center transition-transform duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] group-hover:scale-105 z-index-10 absolute inset-0"
                onError={(e) => {
                  e.currentTarget.src = DEFAULT_PLAYER_AVATAR;
                }}
              />
            </div>

            <div className="absolute left-5 top-5 text-7xl">{DEFAULT_COUNTRY.flag}</div>

            <div className="absolute right-5 top-5 text-[60px] font-black">
              <span className="text-[30px] font-italic font-bold tracking-tight">#</span>
              {top.rank}
            </div>
          </div>

          <div className="flex items-end justify-between px-6 py-4">
            <div>
              <p className="text-[20px] font-medium leading-none text-[#1d2430] dark:text-white">
                {topName.first}
              </p>
              <h3 className="text-[36px] font-black uppercase leading-none text-[#1d2430] dark:text-white">
                {topName.last}
              </h3>
              <p className="mt-2 text-sm font-bold text-[#ef342a]">{top.totalPoints} điểm</p>
            </div>

            <span className="flex h-12 w-12 items-center justify-center rounded-md border border-gray-300 dark:border-white/30 text-2xl text-[#1d2430] dark:text-white transition group-hover:bg-gray-100 dark:group-hover:bg-white/10">
              ↗
            </span>
          </div>
        </div>

        {/* ── Hạng 2 trở đi ── */}
        <div className="grid grid-cols-1 gap-y-12 gap-x-6 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4">
          {rest.map((player) => {
            const { first, last } = splitName(player.playerName);
            return (
              <div
                key={player.userId}
                className="group cursor-pointer"
                onClick={() => openProfile(player.userId)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && openProfile(player.userId)}
              >
                <div className="relative">
                  <div
                    className="w-full bg-white border-b-[15px] relative h-[120px] overflow-visible rounded-tl-[8px]"
                    style={{ borderColor: player.accent }}
                  >
                    <img
                      src={player.image}
                      alt=""
                      className="h-[150px] w-full object-contain transition-transform duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] group-hover:scale-105 absolute left-0 bottom-0 z-index-50"
                      onError={(e) => {
                        e.currentTarget.src = DEFAULT_PLAYER_AVATAR;
                      }}
                    />
                  </div>

                  <div className="absolute left-1 top-1 text-lg">{DEFAULT_COUNTRY.flag}</div>

                  <div className="absolute right-1 top-1 text-2xl font-black">
                    <span className="font-bold text-sm">#</span>
                    {player.rank}
                  </div>
                </div>

                <div className="p-4 rounded-bl-[8px] border-b border-l border-gray-200 dark:border-white h-[70px]">
                  <h3 className="text-[15px] font-black uppercase leading-tight text-[#1d2430] dark:text-[var(--wnt25-color-light)] flex flex-col">
                    <span>{first}</span>
                    <span>{last}</span>
                  </h3>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Ranked;
