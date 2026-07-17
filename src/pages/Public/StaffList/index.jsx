import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Search, ChevronLeft, ChevronRight, Users } from "lucide-react";
import { listPublicEmployees } from "../../../api/publicEmployeeApi";
import { buildListParams, DEFAULT_PAGE_SIZE } from "../../../utils/pagination";

const DEFAULT_AVATAR = "https://cdn-icons-png.freepik.com/512/219/219986.png";

/** Trọng tài khi bio === "REFEREE" (khớp Admin/StaffManagement). */
const isReferee = (emp) => emp?.bio === "REFEREE";

const StaffCard = ({ emp, onClick }) => {
  const referee = isReferee(emp);
  const active = emp?.status === "ACTIVE";
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex flex-col items-center text-center rounded-2xl border border-gray-200 bg-white p-6 transition-all duration-200 hover:-translate-y-1 hover:border-[#7800ad]/40 hover:shadow-xl dark:border-white/10 dark:bg-white/5 dark:hover:border-white/30"
    >
      <div className="relative">
        <img
          src={emp?.avatarUrl || DEFAULT_AVATAR}
          alt={emp?.fullName || "avatar"}
          onError={(e) => {
            e.currentTarget.src = DEFAULT_AVATAR;
          }}
          className="h-24 w-24 rounded-full object-cover ring-4 ring-white shadow-md dark:ring-white/10"
        />
        <span
          className={`absolute -bottom-1 right-0 h-5 w-5 rounded-full border-2 border-white dark:border-[#0a1220] ${
            active ? "bg-emerald-500" : "bg-gray-400"
          }`}
          title={active ? "Hoạt động" : "Nghỉ"}
        />
      </div>

      <h3 className="mt-4 text-base font-bold text-slate-800 dark:text-white">
        {emp?.fullName || emp?.displayName || "Chưa cập nhật"}
      </h3>

      <span
        className={`mt-2 inline-block rounded-full px-3 py-1 text-xs font-semibold ${
          referee
            ? "bg-amber-100 text-amber-700 dark:bg-amber-400/15 dark:text-amber-300"
            : "bg-violet-100 text-violet-700 dark:bg-violet-400/15 dark:text-violet-300"
        }`}
      >
        {referee ? "Trọng tài" : "Nhân viên"}
      </span>

      <span
        className={`mt-2 text-xs font-medium ${
          active ? "text-emerald-600 dark:text-emerald-400" : "text-gray-400"
        }`}
      >
        {active ? "Đang hoạt động" : "Ngừng hoạt động"}
      </span>
    </button>
  );
};

const CardSkeleton = () => (
  <div className="flex flex-col items-center rounded-2xl border border-gray-200 bg-white p-6 dark:border-white/10 dark:bg-white/5">
    <div className="h-24 w-24 animate-pulse rounded-full bg-gray-200 dark:bg-white/10" />
    <div className="mt-4 h-4 w-24 animate-pulse rounded bg-gray-200 dark:bg-white/10" />
    <div className="mt-2 h-5 w-16 animate-pulse rounded-full bg-gray-200 dark:bg-white/10" />
  </div>
);

const StaffListPage = () => {
  const navigate = useNavigate();
  const [searchInput, setSearchInput] = useState("");
  const [keyword, setKeyword] = useState("");
  const [page, setPage] = useState(0);
  const [data, setData] = useState({ content: [], totalPages: 0, totalElements: 0 });
  const [loading, setLoading] = useState(true);
  const [errorStatus, setErrorStatus] = useState(null);

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    setErrorStatus(null);
    try {
      const params = buildListParams({
        page,
        size: DEFAULT_PAGE_SIZE,
        keyword,
        type: "REFEREE",
      });
      const res = await listPublicEmployees(params);
      setData(res);
    } catch (err) {
      setErrorStatus(err?.response?.status || "ERR");
      setData({ content: [], totalPages: 0, totalElements: 0 });
    } finally {
      setLoading(false);
    }
  }, [page, keyword]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setKeyword(searchInput.trim());
    setPage(0);
  };

  /* Chỉ hiển thị trọng tài — lọc client theo bio, phòng khi backend chưa hỗ trợ param `type` */
  const items = (data.content || []).filter(isReferee);

  return (
    <div className="w-full min-h-screen bg-white dark:bg-[#0a1220]">
      {/* ── Hero ── */}
      <div className="relative h-[220px] w-full overflow-hidden bg-[#0c1527]">
        <img
          src="/images/tournaments/pool-4.jpg"
          alt=""
          className="h-full w-full object-cover object-top opacity-50"
          onError={(e) => (e.currentTarget.style.display = "none")}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0c1527]/90 to-transparent" />
        <div className="absolute inset-0 flex items-end px-10 pb-9">
          <div>
            <p className="mb-1 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#ef342a]">
              <Users size={14} /> Đội ngũ điều hành
            </p>
            <h1 className="text-4xl font-black uppercase italic tracking-tight text-white">
              Đội ngũ Trọng tài
            </h1>
          </div>
        </div>
      </div>

      {/* ── Tabs + search ── */}
      <div className="sticky top-[64px] z-30 border-b border-gray-200 bg-[#f7f7f7] dark:border-white/10 dark:bg-[#0d1b2e]">
        <div className="mx-auto max-w-[1600px] px-8 py-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <span className="text-sm font-semibold text-slate-600 dark:text-white/70">
              Danh sách trọng tài điều hành giải đấu
            </span>

            <form onSubmit={handleSearchSubmit} className="relative w-full lg:ml-auto lg:w-64">
              <Search
                size={14}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-white/40"
              />
              <input
                type="text"
                placeholder="Tìm theo tên..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full rounded-full border border-gray-300 bg-white py-1.5 pl-8 pr-4 text-sm placeholder:text-gray-400 focus:border-[#0c1527] focus:outline-none dark:border-white/15 dark:bg-white/5 dark:text-white dark:placeholder:text-white/40 dark:focus:border-white/50"
              />
            </form>
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="mx-auto max-w-[1600px] px-8 py-12 sm:px-16">
        {loading ? (
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {Array.from({ length: 10 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        ) : errorStatus ? (
          <ErrorState status={errorStatus} onLogin={() => navigate("/login")} onRetry={fetchEmployees} />
        ) : items.length === 0 ? (
          <div className="py-24 text-center text-slate-500 dark:text-white/50">
            Chưa có trọng tài nào.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {items.map((emp) => (
                <StaffCard
                  key={emp.id}
                  emp={emp}
                  onClick={() => navigate(`/staffProfile/${emp.id}`)}
                />
              ))}
            </div>

            {data.totalPages > 1 && (
              <div className="mt-10 flex items-center justify-center gap-3">
                <button
                  type="button"
                  disabled={page <= 0}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-300 text-slate-600 transition hover:border-[#0c1527] disabled:opacity-40 dark:border-white/20 dark:text-white/70"
                  aria-label="Trang trước"
                >
                  <ChevronLeft size={18} />
                </button>
                <span className="text-sm font-medium text-slate-600 dark:text-white/70">
                  Trang {page + 1} / {data.totalPages}
                </span>
                <button
                  type="button"
                  disabled={page >= data.totalPages - 1}
                  onClick={() => setPage((p) => p + 1)}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-300 text-slate-600 transition hover:border-[#0c1527] disabled:opacity-40 dark:border-white/20 dark:text-white/70"
                  aria-label="Trang sau"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

const ErrorState = ({ status, onLogin, onRetry }) => {
  const needLogin = status === 401;
  return (
    <div className="py-24 text-center">
      <p className="text-lg font-semibold text-slate-700 dark:text-white/85">
        {needLogin ? "Vui lòng đăng nhập để xem danh sách." : "Danh sách tạm thời chưa khả dụng."}
      </p>
      <p className="mt-2 text-sm text-slate-500 dark:text-white/50">
        {needLogin
          ? "Bạn cần đăng nhập để truy cập đội ngũ điều hành."
          : "Vui lòng thử lại sau ít phút."}
      </p>
      <div className="mt-6 flex justify-center gap-3">
        {needLogin ? (
          <button
            type="button"
            onClick={onLogin}
            className="rounded-full bg-[#0c1527] px-6 py-2 text-sm font-semibold text-white transition hover:opacity-90 dark:bg-white dark:text-[#0d1b2e]"
          >
            Đăng nhập
          </button>
        ) : (
          <button
            type="button"
            onClick={onRetry}
            className="rounded-full border border-gray-300 px-6 py-2 text-sm font-semibold text-slate-700 transition hover:border-[#0c1527] dark:border-white/20 dark:text-white/80"
          >
            Thử lại
          </button>
        )}
      </div>
    </div>
  );
};

export default StaffListPage;
