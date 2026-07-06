import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { Search } from "lucide-react";
import { listPublishedPosts, listPublicCategories } from "../../api/newsApi";
import AdminPagination from "../../components/admin/ui/AdminPagination";
import { getApiErrorMessage } from "../../utils/apiError";
import { buildListParams, DEFAULT_PAGE_SIZE } from "../../utils/pagination";

const FALLBACK = "/images/tournaments/vn-player-1.jpg";

const fmtDate = (iso) => {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("vi-VN", { day: "2-digit", month: "long", year: "numeric" });
};

const NewsListPage = () => {
  const navigate = useNavigate();
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
    listPublicCategories().then(setCategories).catch(() => {});
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = buildListParams({
        page, size: DEFAULT_PAGE_SIZE,
        ...(categoryId ? { categoryId } : {}),
        ...(search ? { search } : {}),
      });
      const result = await listPublishedPosts(params);
      setPosts(result.content);
      setTotalPages(result.totalPages);
      setTotalElements(result.totalElements);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [page, categoryId, search]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-[#010851] uppercase tracking-tight">Tin Tức & Bài Viết</h1>
        <p className="text-slate-500 mt-1">Cập nhật mới nhất từ thế giới bi-a</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <button
          type="button"
          onClick={() => { setCategoryId(""); setPage(0); }}
          className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${!categoryId ? "bg-[#010851] text-white" : "text-[#010851] border border-[#010851]/20 hover:border-[#010851]"}`}
        >
          Tất cả
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => { setCategoryId(String(c.id)); setPage(0); }}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${String(categoryId) === String(c.id) ? "bg-[#010851] text-white" : "text-[#010851] border border-[#010851]/20 hover:border-[#010851]"}`}
          >
            {c.name}
          </button>
        ))}
        <form
          onSubmit={(e) => { e.preventDefault(); setSearch(searchInput.trim()); setPage(0); }}
          className="flex gap-2 ml-auto"
        >
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm bài viết..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="border border-gray-200 bg-white text-sm rounded-xl pl-8 pr-4 py-1.5 focus:outline-none focus:border-[#010851]"
            />
          </div>
        </form>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="text-center py-20 text-slate-400">Đang tải...</div>
      ) : posts.length === 0 ? (
        <div className="text-center py-20 text-slate-400">Chưa có bài viết nào.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {posts.map((post) => (
            <article
              key={post.id}
              onClick={() => navigate(`/news/${post.slug}`)}
              className="group bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
            >
              <div className="h-48 overflow-hidden bg-slate-100">
                <img
                  src={post.thumbnailUrl || FALLBACK}
                  alt={post.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  onError={(e) => { e.target.src = FALLBACK; }}
                />
              </div>
              <div className="p-5">
                {post.categoryName && (
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#EF342A]">
                    {post.categoryName}
                  </span>
                )}
                <h3 className="font-bold text-[#010851] mt-1 leading-snug line-clamp-2 group-hover:text-[#EF342A] transition-colors">
                  {post.title}
                </h3>
                <p className="text-xs text-slate-400 mt-2">{fmtDate(post.publishedAt)}</p>
              </div>
            </article>
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
