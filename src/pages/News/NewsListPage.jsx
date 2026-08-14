import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { Search } from "lucide-react";
import { listPublishedPosts, listPublicCategories } from "../../api/newsApi";
import AdminPagination from "../../components/admin/ui/AdminPagination";
import { getApiErrorMessage } from "../../utils/apiError";
import { buildListParams, DEFAULT_PAGE_SIZE } from "../../utils/pagination";
import { useReveal } from "../../hooks/useReveal";

const FALLBACK = "/images/tournaments/vn-player-1.jpg";

const fmtDate = (iso) => {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("vi-VN", { day: "2-digit", month: "long", year: "numeric" });
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
      .then((list) => setCategories(list || []))
      .catch(() => setCategories([]));
  }, []);

  const load = useCallback(async () => {
    setLoading(true);

    const showEmpty = () => {
      setPosts([]);
      setTotalElements(0);
      setTotalPages(0);
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
        showEmpty();
      }
    } catch (err) {
      toast.error(getApiErrorMessage(err));
      showEmpty();
    } finally {
      setLoading(false);
    }
  }, [page, categoryId, search]);

  useEffect(() => { load(); }, [load]);

  const handleCategoryChange = (v) => {
    setCategoryId(v);
    setPage(0);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSearch(searchInput.trim());
    setPage(0);
  };

  const clearFilters = () => {
    setCategoryId("");
    setSearch("");
    setSearchInput("");
    setPage(0);
  };

  const activeCategory = categories.find((c) => String(c.id) === String(categoryId));
  const hasFilter = Boolean(categoryId || search);

  /* Gạch chân đỏ như chip lọc ở /event — cùng một ngôn ngữ cho thao tác lọc. */
  const chipClass = (active) =>
    `ui-underline ui-underline--chip px-4 py-1.5 text-sm font-semibold transition-colors duration-150 ${
      active
        ? "ui-underline--active text-[#0e1116] dark:text-white"
        : "text-[#333]/70 hover:text-[#0e1116] dark:text-white/60 dark:hover:text-white"
    }`;

  return (
    <div className="w-full bg-white dark:bg-[#0b0d12]">
      <div className="max-w-6xl mx-auto px-4 pt-10 pb-6">
        <h1 className="text-3xl font-black text-[#010851] dark:text-white uppercase">Tin Tức &amp; Bài Viết</h1>
        <p className="text-slate-500 dark:text-white/60 mt-1">Cập nhật mới nhất từ thế giới bi-a</p>
      </div>

      {/* ── Filter bar ──
          Cùng khuôn với thanh lọc ở /event: dải nền chạy hết bề ngang, dính
          dưới header, chip gạch chân thay cho pill, ô tìm kiếm đẩy về phải. */}
      <div className="bg-[#f7f7f7] dark:bg-[#161a22] border-b border-gray-200 dark:border-white/10 sticky top-[64px] z-30">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex flex-col lg:flex-row lg:items-center gap-3">
            <div className="flex gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => handleCategoryChange("")}
                className={chipClass(!categoryId)}
              >
                Tất cả
              </button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => handleCategoryChange(String(c.id))}
                  className={chipClass(String(categoryId) === String(c.id))}
                >
                  {c.name}
                </button>
              ))}
            </div>

            <form onSubmit={handleSearchSubmit} className="relative lg:ml-auto w-full lg:w-64">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-white/40 pointer-events-none" />
              <input
                type="text"
                placeholder="Tìm bài viết..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full border border-gray-300 bg-white text-sm rounded-full pl-8 pr-4 py-1.5 placeholder:text-gray-400 focus:outline-none focus:border-[#0c1527] dark:border-white/15 dark:bg-white/5 dark:text-white dark:placeholder:text-white/40 dark:focus:border-white/50"
              />
            </form>
          </div>
        </div>
      </div>

      {/* ── Content area ── */}
      <div className="max-w-6xl mx-auto px-4 py-10">

      {/* Count label */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-base font-semibold text-slate-700 dark:text-white/85">
          {activeCategory?.name || "Tất cả bài viết"}
        </h2>
        {!loading && (
          <span className="text-sm text-slate-400 dark:text-white/50 font-medium">
            {totalElements} bài viết tìm thấy
          </span>
        )}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="text-center py-24 text-slate-400 dark:text-white/50">Đang tải...</div>
      ) : posts.length === 0 ? (
        <div className="text-center py-24">
          <p className="text-slate-500 dark:text-white/70 text-lg font-semibold">
            {hasFilter ? "Không có bài viết nào phù hợp." : "Chưa có bài viết nào."}
          </p>
          {hasFilter && (
            <button
              onClick={clearFilters}
              className="mt-4 text-[#ef342a] text-sm font-semibold hover:underline"
            >
              Xóa bộ lọc
            </button>
          )}
        </div>
      ) : (
        <div ref={gridRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {posts.map((post, index) => (
            // Stagger ở lớp ngoài, hover ở lớp trong — gộp chung thì
            // transition-delay của stagger rò sang hover.
            <div key={post.id} className="ui-stagger flex" style={{ "--i": Math.min(index, 11) }}>
            <article
              onClick={() => navigate(`/news/${post.slug}`)}
              className="ui-card group w-full bg-white dark:bg-[#161a22] rounded-2xl border border-slate-100 dark:border-white/10 shadow-sm overflow-hidden cursor-pointer"
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
                {/* `line-clamp` cắt bằng overflow:hidden nên dấu nặng ở dòng
                    cuối ("ĐẸP", "LUẬT") bị xén mất. Nới leading và thêm đệm đáy
                    vừa đủ chứa dấu — không làm đổi số dòng bị cắt. */}
                <h3 className="font-bold text-[#010851] dark:text-white mt-1 leading-[1.45] line-clamp-2 pb-[0.14em] group-hover:text-[#EF342A] dark:group-hover:text-[#EF342A] transition-colors">
                  {post.title}
                </h3>
                <p className="text-xs text-slate-400 dark:text-white/40 mt-2">{fmtDate(post.publishedAt)}</p>
              </div>
            </article>
            </div>
          ))}
        </div>
      )}

      {totalElements > 0 && (
        <AdminPagination
          page={page}
          totalPages={totalPages}
          totalElements={totalElements}
          pageSize={DEFAULT_PAGE_SIZE}
          disabled={loading}
          onPageChange={setPage}
          onPageSizeChange={() => {}}
        />
      )}
      </div>
    </div>
  );
};

export default NewsListPage;
