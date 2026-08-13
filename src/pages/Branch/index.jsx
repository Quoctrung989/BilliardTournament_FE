import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, Phone, Search } from "lucide-react";
import { toast } from "react-toastify";
import { listPublicBranches } from "../../api/publicBranchApi";
import AdminPagination from "../../components/admin/ui/AdminPagination";
import { getApiErrorMessage } from "../../utils/apiError";
import { buildListParams, DEFAULT_PAGE_SIZE } from "../../utils/pagination";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1615488107055-cf8dd25d6cf7?q=80&w=1200&auto=format&fit=crop";

/* ── Branch card ── */
const BranchCard = ({ branch, index }) => {
  const navigate = useNavigate();

  return (
    <div
      className="tournament-card-stream flex flex-col cursor-pointer group bg-white dark:bg-[#161a22] border border-transparent dark:border-white/10 rounded-2xl overflow-hidden shadow-sm"
      style={{ animationDelay: `${index * 0.15}s` }}
      onClick={() => navigate(`/branches/${branch.id}`)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && navigate(`/branches/${branch.id}`)}
    >
      {/* Image */}
      <div className="relative overflow-hidden" style={{ aspectRatio: "4/3" }}>
        <img
          src={branch.thumbnailUrl || FALLBACK_IMAGE}
          alt={branch.name}
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
          onError={(e) => { e.currentTarget.src = FALLBACK_IMAGE; }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
        <h3 className="absolute bottom-3 left-4 right-4 text-white font-black italic uppercase text-lg leading-[1.3]"
          style={{ textShadow: "0 2px 10px rgba(0,0,0,0.6)" }}>
          {branch.name}
        </h3>
      </div>

      {/* Info */}
      <div className="flex flex-col gap-2 p-4 flex-1">
        <div className="flex items-start gap-2 text-sm text-slate-600 dark:text-white/60">
          <MapPin size={15} className="text-black dark:text-white/70 shrink-0 mt-0.5" />
          <span className="line-clamp-2">{branch.address}</span>
        </div>
        {branch.phone && (
          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-white/60">
            <Phone size={15} className="text-black dark:text-white/70 shrink-0" />
            <span>{branch.phone}</span>
          </div>
        )}
        {branch.description && (
          <p className="text-xs text-slate-400 dark:text-white/40 line-clamp-2 mt-1">{branch.description}</p>
        )}

        <div className="mt-auto pt-3 flex justify-end">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); navigate(`/branches/${branch.id}`); }}
            className="text-xs font-bold tracking-wide uppercase px-4 py-1.5 rounded-full text-white bg-black hover:bg-slate-700 dark:bg-white dark:text-[#0b0d12] dark:hover:bg-white/80 transition-colors"
          >
            Xem chi tiết
          </button>
        </div>
      </div>
    </div>
  );
};

/** Lấy "khu vực" (tỉnh/thành) từ địa chỉ — quy ước lấy đoạn cuối cùng sau dấu phẩy. */
const extractRegion = (address) => {
  if (!address) return null;
  const parts = address.split(",").map((p) => p.trim()).filter(Boolean);
  return parts.length > 0 ? parts[parts.length - 1] : null;
};

const StatBlock = ({ value, label, border = true }) => (
  <div className={`flex-1 px-6 py-5 ${border ? "border-l border-slate-200 dark:border-white/10 first:border-l-0" : ""}`}>
    <p className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white">{value}</p>
    <p className="mt-1 text-[0.65rem] font-bold uppercase tracking-widest text-slate-400 dark:text-white/40">{label}</p>
  </div>
);

/* ── Page ── */
const BranchListPage = () => {
  const [searchInput, setSearchInput] = useState("");
  const [searchApplied, setSearchApplied] = useState("");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [stats, setStats] = useState({ total: 0, regions: 0 });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = buildListParams({
        page, size: pageSize,
        ...(searchApplied ? { search: searchApplied } : {}),
      });
      const result = await listPublicBranches(params);
      setItems(result.content);
      setTotalElements(result.totalElements);
      setTotalPages(result.totalPages);
      if (result.page !== page) setPage(result.page);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, searchApplied]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    listPublicBranches({ page: 0, size: 100 })
      .then((result) => {
        const regions = new Set(
          (result.content || []).map((b) => extractRegion(b.address)).filter(Boolean)
        );
        setStats({ total: result.totalElements ?? result.content.length, regions: regions.size });
      })
      .catch(() => {});
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSearchApplied(searchInput.trim());
    setPage(0);
  };

  return (
    <div className="w-full bg-white dark:bg-[#0b0d12] transition-colors duration-300">

      {/* ── Hero banner ── */}
      <div className="w-full relative overflow-hidden bg-white dark:bg-[#0b0d12] border-b border-slate-100 dark:border-white/10">
        <div className="relative max-w-[1600px] mx-auto px-10 pt-16 pb-10">
          <p className="text-slate-400 dark:text-white/40 text-xs font-bold uppercase tracking-[0.2em] mb-3">
            Hệ thống cơ sở
          </p>
          <h1 className="text-5xl sm:text-6xl font-black text-slate-900 dark:text-white max-w-2xl">
            Tìm cơ sở gần bạn
          </h1>
          <p className="mt-5 max-w-xl text-sm sm:text-base text-slate-500 dark:text-white/60 leading-relaxed">
            Danh sách các cơ sở đang hoạt động — chọn cơ sở gần bạn để xem địa chỉ,
            số điện thoại và hình ảnh không gian club.
          </p>

          <div className="mt-9 inline-flex rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 shadow-sm">
            <StatBlock value={stats.total} label="Cơ sở" border={false} />
            <StatBlock value={stats.regions} label="Khu vực" />
          </div>
        </div>
      </div>

      {/* ── Search bar ── */}
      <div className="bg-[#f7f7f7] dark:bg-[#161a22] border-b border-gray-200 dark:border-white/10 sticky top-[64px] z-30">
        <div className="max-w-[1600px] mx-auto px-8 py-3">
          <div className="flex flex-col lg:flex-row lg:items-center gap-3">
            <form onSubmit={handleSearchSubmit} className="relative lg:ml-auto w-full lg:w-72">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-white/40 pointer-events-none" />
              <input
                type="text"
                placeholder="Tìm chi nhánh theo tên hoặc địa chỉ..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full border border-gray-300 dark:border-white/15 bg-white dark:bg-white/5 text-sm rounded-full pl-8 pr-4 py-1.5 placeholder:text-gray-400 dark:text-white dark:placeholder:text-white/40 focus:outline-none focus:border-black dark:focus:border-white/50"
              />
            </form>
          </div>
        </div>
      </div>

      {/* ── Content area ── */}
      <div className="max-w-[1600px] mx-auto px-16 py-12">

        <div className="flex items-center justify-between mb-6">
          <h2 className="text-base font-semibold text-slate-700 dark:text-white/85">Tất cả chi nhánh</h2>
          {!loading && (
            <span className="text-sm text-slate-400 dark:text-white/50 font-medium">
              {totalElements} chi nhánh
            </span>
          )}
        </div>

        {loading ? (
          <div className="text-center py-24 text-slate-400 dark:text-white/50">Đang tải...</div>
        ) : items.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-slate-500 dark:text-white/70 text-lg font-semibold">Không tìm thấy chi nhánh nào phù hợp.</p>
            {searchApplied && (
              <button
                onClick={() => { setSearchInput(""); setSearchApplied(""); }}
                className="mt-4 text-black dark:text-white text-sm font-semibold hover:underline"
              >
                Xóa bộ lọc
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {items.map((b, i) => (
              <BranchCard key={b.id} branch={b} index={i} />
            ))}
          </div>
        )}

        {items.length > 0 && (
          <div className="mt-8">
            <AdminPagination
              page={page}
              totalPages={totalPages}
              totalElements={totalElements}
              pageSize={pageSize}
              disabled={loading}
              onPageChange={setPage}
              onPageSizeChange={(size) => { setPageSize(size); setPage(0); }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default BranchListPage;
