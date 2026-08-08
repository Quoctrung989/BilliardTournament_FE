import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { Search } from "lucide-react";
import { listPublishedPosts, listPublicCategories } from "../../api/newsApi";
import AdminPagination from "../../components/admin/ui/AdminPagination";
import { getApiErrorMessage } from "../../utils/apiError";
import { buildListParams, DEFAULT_PAGE_SIZE } from "../../utils/pagination";
import { useReveal } from "../../hooks/useReveal";
import { DEMO_CATEGORIES, DEMO_POSTS, withDemo } from "../../constants/demoData";

const FALLBACK = "/images/tournaments/vn-player-1.jpg";

const fmtDate = (iso) => {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("vi-VN", { day: "2-digit", month: "long", year: "numeric" });
};

/**
 * Khi đang chạy dữ liệu mẫu, việc lọc phải làm ngay tại client: bấm chuyên mục
 * sẽ gọi API kèm categoryId, API vẫn trả rỗng, rồi lại rơi về mẫu đầy đủ — bộ
 * lọc trông như hỏng. Lọc ở đây để UI mẫu hành xử đúng như khi có dữ liệu thật.
 */
const filterDemoPosts = (list, categoryId, search) => {
  let out = list;
  if (categoryId) {
    const cat = DEMO_CATEGORIES.find((c) => String(c.id) === String(categoryId));
    if (cat) out = out.filter((p) => p.categoryName === cat.name);
  }
  if (search) {
    const q = search.trim().toLowerCase();
    out = out.filter((p) => p.title.toLowerCase().includes(q));
  }
  return out;
};

const NewsListPage = () => {
  const navigate = useNavigate();
  const gridRef = useReveal({ threshold: 0.05 });
  const [posts, setPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [categoryId, setCategoryId] = useState("");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");

  useEffect(() => {
    listPublicCategories()
      .then((list) => setCategories(withDemo(list, DEMO_CATEGORIES, "Chuyên mục tin")))
      .catch(() => setCategories(withDemo(null, DEMO_CATEGORIES, "Chuyên mục tin")));
  }, []);

  const load = useCallback(async () => {
    setLoading(true);

    const showDemoPosts = () => {
      const list = filterDemoPosts(
        withDemo(null, DEMO_POSTS, "Tin tức"),
        categoryId,
        search
      );
      setPosts(list);
      setTotalElements(list.length);
      setTotalPages(1);
    };

    try {
      const params = buildListParams({
        page, size: DEFAULT_PAGE_SIZE,
        ...(categoryId ? { categoryId } : {}),
        ...(search ? { search } : {}),
      });
      const result = await listPublishedPosts(params);
      if (result.content?.length) {
        setPosts(result.content);
        setTotalPages(result.totalPages);
        setTotalElements(result.totalElements);
      } else {
        showDemoPosts();
      }
    } catch (err) {
      toast.error(getApiErrorMessage(err));
      showDemoPosts();
    } finally {
      setLoading(false);
    }
  }, [page, categoryId, search]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-[#010851] dark:text-white uppercase tracking-tight">Tin Tức & Bài Viết</h1>
        <p className="text-slate-500 dark:text-white/60 mt-1">Cập nhật mới nhất từ thế giới bi-a</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <button
          type="button"
          onClick={() => { setCategoryId(""); setPage(0); }}
          className={`ui-press px-4 py-1.5 rounded-full text-sm font-semibold ${!categoryId ? "bg-[#010851] dark:bg-white dark:text-[#0d1b2e] text-white" : "text-[#010851] dark:text-white/70 border border-[#010851]/20 dark:border-white/15 hover:border-[#010851] dark:hover:border-white/40"}`}
        >
          Tất cả
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => { setCategoryId(String(c.id)); setPage(0); }}
            className={`ui-press px-4 py-1.5 rounded-full text-sm font-semibold ${String(categoryId) === String(c.id) ? "bg-[#010851] dark:bg-white dark:text-[#0d1b2e] text-white" : "text-[#010851] dark:text-white/70 border border-[#010851]/20 dark:border-white/15 hover:border-[#010851] dark:hover:border-white/40"}`}
          >
            {c.name}
          </button>
        ))}
        <form
          onSubmit={(e) => { e.preventDefault(); setSearch(searchInput.trim()); setPage(0); }}
          className="flex gap-2 ml-auto"
        >
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-white/40" />
            <input
              type="text"
              placeholder="Tìm bài viết..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="border border-gray-200 dark:border-white/15 bg-white dark:bg-[#0d1b2e] text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/40 text-sm rounded-xl pl-8 pr-4 py-1.5 focus:outline-none focus:border-[#010851] dark:focus:border-white/40"
            />
          </div>
        </form>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="text-center py-20 text-slate-400 dark:text-white/40">Đang tải...</div>
      ) : posts.length === 0 ? (
        <div className="text-center py-20 text-slate-400 dark:text-white/40">Chưa có bài viết nào.</div>
      ) : (
        <div ref={gridRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {posts.map((post, index) => (
            // Stagger ở lớp ngoài, hover ở lớp trong — gộp chung thì
            // transition-delay của stagger rò sang hover.
            <div key={post.id} className="ui-stagger flex" style={{ "--i": Math.min(index, 11) }}>
            <article
              onClick={() => navigate(`/news/${post.slug}`)}
              className="ui-card group w-full bg-white dark:bg-[#0d1b2e] rounded-2xl border border-slate-100 dark:border-white/10 shadow-sm overflow-hidden cursor-pointer"
            >
              <div className="h-48 overflow-hidden bg-slate-100 dark:bg-white/5">
                <img
                  src={post.thumbnailUrl || FALLBACK}
                  alt={post.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
                  onError={(e) => { e.target.src = FALLBACK; }}
                />
              </div>
              <div className="p-5">
                {post.categoryName && (
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#EF342A]">
                    {post.categoryName}
                  </span>
                )}
                <h3 className="font-bold text-[#010851] dark:text-white mt-1 leading-snug line-clamp-2 group-hover:text-[#EF342A] dark:group-hover:text-[#EF342A] transition-colors">
                  {post.title}
                </h3>
                <p className="text-xs text-slate-400 dark:text-white/40 mt-2">{fmtDate(post.publishedAt)}</p>
              </div>
            </article>
            </div>
          ))}
        </div>
      )}

      <AdminPagination
        page={page}
        totalPages={totalPages}
        totalElements={totalElements}
        pageSize={DEFAULT_PAGE_SIZE}
        disabled={loading}
        onPageChange={setPage}
        onPageSizeChange={() => {}}
      />
    </div>
  );
};

export default NewsListPage;
