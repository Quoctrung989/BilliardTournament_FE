import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useReveal } from "../../../hooks/useReveal";
import { listPublicTournaments } from "../../../api/publicTournamentApi";
import { TOURNAMENT_STATUS_LABELS } from "../../../constants/tournamentConfig";

const FALLBACK = "/images/tournaments/pool-2.jpg";

const fmtDate = (iso) => {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

/** "26 thg 5, 2026 – 31 thg 5, 2026", hoặc chỉ một đầu nếu thiếu đầu kia. */
const dateRange = (startAt, endAt) => {
  const start = fmtDate(startAt);
  const end = fmtDate(endAt);
  if (start && end) return `${start} – ${end}`;
  return start || end || "Chưa có lịch";
};

const statusLabel = (status) => TOURNAMENT_STATUS_LABELS[status] || status || "";

/** Dòng phụ: loại bi + thể thức, bỏ qua phần nào BE không trả. */
const subtitle = (t) => [t.gameType, t.formatName].filter(Boolean).join(" • ");

const SectionHeader = () => (
  <div
    className="hm-stagger bg-[var(--wnt25-color-light)] dark:bg-[#161a22] p-4 rounded-md flex justify-between items-center"
    style={{ "--i": 0 }}
  >
    <h2 className="text-lg font-bold dark:text-gray-100">Lịch thi đấu</h2>
    <Link
      to="/event"
      className="ui-underline flex h-10 w-wrapper items-center justify-center rounded-md border border-gray-300 dark:border-white/20 px-3 text-sm dark:text-gray-200 transition hover:bg-gray-100 dark:hover:bg-white/10 italic"
    >
      Toàn bộ lịch
    </Link>
  </div>
);

const Meta = ({ tournament, compact }) => (
  <div className="flex w-full flex-wrap items-center justify-between gap-2">
    <div className="flex flex-wrap items-center gap-2">
      <span
        className={`font-bold border-[1px] rounded-lg border-[var(--wnt25-color-red)] text-[var(--wnt25-color-red)] ${
          compact ? "p-1 text-xs" : "px-2 py-1 text-xs"
        }`}
      >
        {dateRange(tournament.startAt, tournament.endAt)}
      </span>
      {tournament.gameType && (
        <span
          className={`font-bold text-[var(--wnt25-color-dark)] dark:!text-gray-200 ${
            compact ? "text-sm" : "text-sm"
          }`}
        >
          {tournament.gameType}
        </span>
      )}
    </div>

    <span className="text-xs font-bold text-[var(--wnt25-color-dark)] dark:!text-gray-200 opacity-[90%]">
      {statusLabel(tournament.status)}
    </span>
  </div>
);

/** Số suất đã duyệt / tổng — chỉ hiện khi BE trả đủ cả hai. */
const Slots = ({ tournament }) => {
  if (tournament.approvedCount == null || !tournament.maxParticipants) return null;
  return (
    <p className="text-sm font-italic font-bold opacity-[80%]">
      Đã đăng ký: {tournament.approvedCount}/{tournament.maxParticipants}
    </p>
  );
};

const Schedule = () => {
  const revealRef = useReveal();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    // 4 giải: 1 giải lớn bên trái + 3 giải nhỏ bên phải.
    listPublicTournaments({ page: 0, size: 4 })
      .then((paged) => {
        if (!cancelled) setItems(paged.content || []);
      })
      .catch(() => {
        if (!cancelled) setItems([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const [lead, ...rest] = items;

  if (loading) {
    return (
      <div className="w-full flex flex-col gap-6 px-6 py-8 md:px-16 max-w-[1600px] mx-auto">
        <div className="hm-skeleton h-[60px]" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1fr]">
          <div className="hm-skeleton h-[520px]" />
          <div className="flex flex-col gap-6">
            {[0, 1, 2].map((i) => (
              <div key={i} className="hm-skeleton h-[160px]" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="w-full flex flex-col gap-6 px-6 py-8 md:px-16 max-w-[1600px] mx-auto">
        <SectionHeader />
        <p className="rounded-md border border-dashed border-gray-300 dark:border-white/15 p-10 text-center text-sm text-gray-500 dark:text-gray-400">
          Chưa có giải đấu nào được công bố.
        </p>
      </div>
    );
  }

  return (
    <div
      ref={revealRef}
      className="w-full flex flex-col gap-6 px-6 py-8 md:px-16 max-w-[1600px] mx-auto"
    >
      <SectionHeader />

      <div className="w-full grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1fr] items-stretch">
        <div className="hm-stagger h-full" style={{ "--i": 1 }}>
          <Link
            to={`/event/${lead.id}`}
            className="hm-card hm-sheen group flex h-full flex-col overflow-hidden rounded-l-[24px] border border-gray-300 dark:border-white/10 bg-white dark:bg-[#161a22] dark:text-gray-200 shadow-sm"
          >
            <img
              src={lead.thumbnailUrl || FALLBACK}
              alt=""
              className="h-full min-h-[100px] max-h-[400px] w-full flex-1 object-cover transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-110"
            />

            <div className="flex flex-col p-6 gap-4">
              <Meta tournament={lead} />
              <div className="flex flex-col gap-2">
                <h3 className="hm-title text-lg font-bold">{lead.name}</h3>
                {subtitle(lead) && (
                  <span className="text-sm font-bold">{subtitle(lead)}</span>
                )}
                <Slots tournament={lead} />
              </div>
            </div>
          </Link>
        </div>

        <div className="flex h-full flex-col gap-6">
          {rest.map((item, index) => (
            <div
              key={item.id}
              style={{ "--i": index + 2 }}
              className="hm-stagger flex-1 flex"
            >
              <Link
                to={`/event/${item.id}`}
                className="hm-card hm-sheen group w-full overflow-hidden flex rounded-r-[22px] border border-l-transparent border-gray-300 dark:border-white/10 bg-white dark:bg-[#161a22] dark:text-gray-200 shadow-sm"
              >
                <div className="flex justify-center items-center p-4 max-w-[30%]">
                  <img
                    src={item.thumbnailUrl || FALLBACK}
                    alt=""
                    className="h-[150px] object-cover transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-110"
                  />
                </div>
                <div className="h-[84%] my-auto py-4 w-[1px] bg-gray-300 dark:bg-white/10" />

                <div className="flex flex-col p-4 gap-4 min-w-[70%]">
                  <Meta tournament={item} compact />
                  <div className="flex flex-col gap-2">
                    <h3 className="hm-title text-lg font-bold">{item.name}</h3>
                    {subtitle(item) && (
                      <span className="text-sm font-bold">{subtitle(item)}</span>
                    )}
                    <Slots tournament={item} />
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Schedule;
