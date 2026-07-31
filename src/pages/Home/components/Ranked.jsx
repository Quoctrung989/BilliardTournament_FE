import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useReveal } from "../../../hooks/useReveal";
import {
  listPublicTournaments,
  getPublicTournamentRankings,
} from "../../../api/publicTournamentApi";
import {
  RankLabel,
  DEFAULT_PLAYER_AVATAR,
  DEFAULT_COUNTRY,
} from "../../../constants/rankingEnums";
import {
  DEMO_RANKING_ENTRIES,
  DEMO_RANKING_TOURNAMENT,
  withDemo,
} from "../../../constants/demoData";

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

const splitName = (displayName) => {
  const [first, ...rest] = (displayName || "").trim().split(" ");
  return { first: first || "—", last: rest.join(" ") };
};

/**
 * Hệ thống chưa có bảng xếp hạng toàn cục — `RankingTab` chỉ sống bên trong
 * `/event/:id`, và mục "Bảng Xếp Hạng" trên header vẫn là `path: null`.
 * Nên khối này lấy xếp hạng của giải gần nhất có dữ liệu: ưu tiên giải đã
 * hoàn thành (kết quả chính thức), không có thì lấy giải đang diễn ra.
 */
function useLatestRanking() {
  const [state, setState] = useState({
    loading: true,
    tournament: null,
    entries: [],
  });

  useEffect(() => {
    let cancelled = false;

    const rankingOf = async (status) => {
      const paged = await listPublicTournaments({ page: 0, size: 1, status });
      const tournament = paged.content?.[0];
      if (!tournament) return null;
      const data = await getPublicTournamentRankings(tournament.id);
      const entries = data?.entries || [];
      return entries.length ? { tournament, entries } : null;
    };

    (async () => {
      let result = null;
      for (const status of ["COMPLETED", "IN_PROGRESS"]) {
        try {
          result = await rankingOf(status);
          if (result) break;
        } catch {
          // Giải không bật công khai tỉ lệ sẽ lỗi ở đây — thử trạng thái kế tiếp.
        }
      }
      if (cancelled) return;
      const entries = withDemo(
        result?.entries?.slice(0, 9),
        DEMO_RANKING_ENTRIES,
        "Top tay cơ"
      );
      // Dùng giải mẫu khi entries là dữ liệu mẫu — nếu không tiêu đề sẽ ghép
      // tên giải thật với danh sách tay cơ giả.
      const isDemo = entries === DEMO_RANKING_ENTRIES;
      setState({
        loading: false,
        tournament: isDemo
          ? DEMO_RANKING_TOURNAMENT
          : result?.tournament || null,
        entries,
      });
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}

const PlayerCard = ({ entry, index, rankText }) => {
  const { first, last } = splitName(entry.displayName);

  return (
    <div style={{ "--i": index + 1 }} className="hm-stagger group">
      <div className="hm-player">
        <Link to={`/event/players/${entry.participantId}`} className="block">
          <div className="relative">
            <div
              className="hm-accent-bar w-full bg-white border-b-[15px] relative h-[120px] overflow-visible rounded-tl-[8px]"
              style={{ borderColor: accentOf(index) }}
            >
              <img
                src={entry.avatarUrl || DEFAULT_PLAYER_AVATAR}
                alt=""
                className="h-[150px] w-full object-contain transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-110 absolute left-0 bottom-0"
              />
            </div>

            <div className="absolute left-1 top-1 text-lg">
              {DEFAULT_COUNTRY.flag}
            </div>

            <div className="hm-rank absolute right-1 top-1 text-2xl font-black">
              {rankText}
            </div>
          </div>

          <div className="p-4 rounded-bl-[8px] border-b border-l border-gray-200 dark:border-white h-[70px]">
            <h3 className="hm-title text-[15px] font-black uppercase leading-tight text-[#1d2430] dark:text-[var(--wnt25-color-light)] flex flex-col">
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
  const { loading, tournament, entries } = useLatestRanking();

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

  // Không giải nào công khai xếp hạng — ẩn hẳn khối thay vì dựng lưới rỗng.
  if (!tournament || entries.length === 0) return null;

  const champion =
    entries.find((e) => e.rankLabel === RankLabel.CHAMPION) || entries[0];
  const rest = entries.filter((e) => e.participantId !== champion.participantId);
  const championName = splitName(champion.displayName);

  return (
    <div
      ref={revealRef}
      className="flex flex-col gap-10 w-full px-6 py-8 md:px-16 max-w-[1600px] mx-auto"
    >
      <div className="hm-reveal-left w-full bg-[var(--wnt25-color-dark)] p-4 rounded-md flex flex-wrap gap-3 justify-between items-center text-[var(--wnt25-color-light)]">
        <h2 className="text-lg font-bold tracking-tight">
          Top {entries.length} tay cơ — {tournament.name}
        </h2>
        <Link
          to={`/event/${tournament.id}`}
          className="ui-underline flex h-10 items-center justify-center rounded-md border border-gray-300 px-3 text-sm transition hover:bg-gray-100 hover:text-[var(--wnt25-color-dark)] italic"
        >
          Xem bảng xếp hạng đầy đủ
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-10 xl:grid-cols-[1.15fr_2.2fr]">
        <div className="hm-stagger" style={{ "--i": 0 }}>
          <Link
            to={`/event/players/${champion.participantId}`}
            className="hm-card hm-sheen group block h-full overflow-hidden rounded-l-[16px] border-b-[2px] border-l-[2px] border-gray-200 dark:border-white"
          >
            <div className="relative overflow-hidden">
              <div
                className="hm-accent-bar h-[300px] flex items-end relative bg-[var(--wnt25-color-light)] border-b-[30px] w-full"
                style={{ borderColor: accentOf(0) }}
              >
                <img
                  src={champion.avatarUrl || DEFAULT_PLAYER_AVATAR}
                  alt=""
                  className="h-[270px] w-full object-contain object-center transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-110 absolute inset-0"
                />
              </div>

              <div className="absolute left-5 top-5 text-7xl">
                {DEFAULT_COUNTRY.flag}
              </div>

              <div className="hm-rank absolute right-5 top-5 text-[60px] font-black">
                {champion.rankLabel || RankLabel.CHAMPION}
              </div>
            </div>

            <div className="flex items-end justify-between px-6 py-4">
              <div>
                <p className="text-[20px] font-medium leading-none text-[#1d2430] dark:text-white">
                  {championName.first}
                </p>
                <h3 className="hm-title text-[36px] font-black uppercase leading-none text-[#1d2430] dark:text-white">
                  {championName.last || championName.first}
                </h3>
              </div>

              <span className="hm-arrow flex h-12 w-12 items-center justify-center rounded-md border border-gray-300 dark:border-white/30 text-2xl text-[#1d2430] dark:text-white">
                ↗
              </span>
            </div>
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-y-12 gap-x-6 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4">
          {rest.map((entry, index) => (
            <PlayerCard
              key={entry.participantId}
              entry={entry}
              index={index}
              rankText={entry.rankLabel || `${RankLabel.PREFIX}${index + 2}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Ranked;
