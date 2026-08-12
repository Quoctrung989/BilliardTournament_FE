import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useReveal } from "../../../hooks/useReveal";
import { listPublishedPosts } from "../../../api/newsApi";
import { DEMO_POSTS, withDemo } from "../../../constants/demoData";

/** BE không bảo đảm thumbnailUrl — ảnh hỏng trong card overflow-hidden để lại mảng trống rất xấu. */
const FALLBACK = "/images/tournaments/vn-player-1.jpg";

const fmtDate = (iso) => {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

const SectionHeader = () => (
  <div
    className="hm-stagger bg-[var(--wnt25-color-light)] dark:bg-[#161a22] p-4 rounded-md flex justify-between items-center"
    style={{ "--i": 1 }}
  >
    <h2 className="text-lg font-bold dark:text-gray-100">
      Tin mới nhất từ BTMS
    </h2>
    <Link
      to="/news"
      className="ui-underline flex w-wrapper items-center justify-center rounded-md border border-gray-300 dark:border-white/20 px-3 py-1 text-sm dark:text-gray-200 transition hover:bg-gray-100 dark:hover:bg-white/10 italic"
    >
      Tất cả tin tức
    </Link>
  </div>
);

const News = () => {
  const revealRef = useReveal();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    // 5 bài: 1 bài lớn bên trái + 4 bài nhỏ bên phải.
    listPublishedPosts({ page: 0, size: 5 })
      .then((paged) => {
        if (!cancelled) setPosts(withDemo(paged.content, DEMO_POSTS, "Tin tức"));
      })
      .catch(() => {
        if (!cancelled) setPosts(withDemo(null, DEMO_POSTS, "Tin tức"));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const [lead, ...rest] = posts;

  if (loading) {
    return (
      <div className="w-full px-6 py-8 md:px-16 max-w-[1600px] mx-auto">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="hm-skeleton h-[560px]" />
          <div className="flex flex-col gap-6">
            <div className="hm-skeleton h-[60px]" />
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="hm-skeleton h-[250px]" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="w-full px-6 py-8 md:px-16 max-w-[1600px] mx-auto">
        <SectionHeader />
        <p className="mt-6 rounded-md border border-dashed border-gray-300 dark:border-white/15 p-10 text-center text-sm text-gray-500 dark:text-gray-400">
          Chưa có bài viết nào được đăng.
        </p>
      </div>
    );
  }

  return (
    <div
      ref={revealRef}
      className="h-wrapper w-full bg-cover bg-center px-6 py-8 md:px-16 max-w-[1600px] mx-auto"
    >
      <div className="mx-auto grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="hm-stagger lg:col-span-1" style={{ "--i": 0 }}>
          <Link
            to={`/news/${lead.slug}`}
            className="hm-card hm-sheen group block overflow-hidden rounded-l-[24px] border border-gray-300 dark:border-white/10 bg-white dark:bg-[#161a22] shadow-sm"
          >
            <img
              src={lead.thumbnailUrl || FALLBACK}
              alt=""
              className="h-[460px] w-full object-cover transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-110"
            />

            <div className="flex items-end justify-between p-5">
              <div className="max-w-[85%]">
                <div className="mb-2 flex items-center gap-3 text-[11px] font-bold uppercase tracking-wider">
                  {lead.categoryName && (
                    <span className="rounded border border-[var(--wnt25-color-red)] px-2 py-0.5 text-[var(--wnt25-color-red)]">
                      {lead.categoryName}
                    </span>
                  )}
                  <span className="text-gray-500 dark:text-gray-400">
                    {fmtDate(lead.publishedAt)}
                  </span>
                </div>
                {/* Không dùng tracking-tight và leading dưới 1.1 — cắt ngọn dấu
                    trên chữ hoa. Xem chú thích khối h1–h6 ở global.css. */}
                <h1 className="hm-title text-[33px] font-black uppercase leading-[1.15] text-[#1d2430] dark:text-gray-100">
                  {lead.title}
                </h1>
              </div>

              <span className="hm-arrow flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-gray-300 dark:border-white/20 text-xl text-[#1d2430] dark:text-gray-200">
                ↗
              </span>
            </div>
          </Link>
        </div>

        <div className="flex flex-col gap-6 lg:col-span-1">
          <SectionHeader />

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-2">
            {rest.map((item, index) => (
              <div
                key={item.id}
                style={{ "--i": index + 2 }}
                className="hm-stagger"
              >
                <Link
                  to={`/news/${item.slug}`}
                  className="hm-card hm-sheen group flex h-full flex-col overflow-hidden rounded-l-[22px] border border-gray-300 dark:border-white/10 bg-white dark:bg-[#161a22] shadow-sm"
                >
                  <img
                    src={item.thumbnailUrl || FALLBACK}
                    alt=""
                    className="h-[170px] w-full object-cover transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-110"
                  />

                  <div className="flex flex-1 items-end justify-between p-4">
                    <div>
                      <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                        {fmtDate(item.publishedAt)}
                      </p>
                      {/* `line-clamp` cắt bằng overflow:hidden nên dấu nặng ở
                          dòng cuối ("ĐẸP", "LUẬT") dễ bị xén mất. `pb-[0.14em]`
                          nới đáy hộp vừa đủ chứa dấu, không đổi số dòng. */}
                      <h2 className="hm-title text-[12px] font-extrabold uppercase leading-[1.45] text-[#1d2430] dark:text-gray-100 line-clamp-3 pb-[0.14em]">
                        {item.title}
                      </h2>
                    </div>

                    <span className="hm-arrow ml-3 flex h-9 w-9 min-w-[36px] items-center justify-center rounded-md border border-gray-300 dark:border-white/20 text-lg text-[#1d2430] dark:text-gray-200">
                      ↗
                    </span>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default News;
