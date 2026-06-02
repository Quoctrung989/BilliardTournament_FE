import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, Plus, Settings } from "lucide-react";
import { toast } from "react-toastify";
import AdminButton from "../../../components/admin/ui/AdminButton";
import AdminCard from "../../../components/admin/ui/AdminCard";
import AdminPagination from "../../../components/admin/ui/AdminPagination";
import { TOURNAMENT_STATUS_LABELS } from "../../../constants/tournamentConfig";
import { getApiErrorMessage } from "../../../utils/apiError";
import { buildListParams, DEFAULT_PAGE_SIZE } from "../../../utils/pagination";

const STATUS_OPTIONS = [
  { value: "", label: "Tất cả trạng thái" },
  ...Object.entries(TOURNAMENT_STATUS_LABELS).map(([value, label]) => ({ value, label })),
];

const formatDate = (iso) => {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
};

const TournamentListPage = ({ api, basePath, roleLabel }) => {
  const navigate = useNavigate();
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [filters, setFilters] = useState({ status: "", search: "" });
  const [searchInput, setSearchInput] = useState("");

  const loadTournaments = useCallback(async () => {
    setLoading(true);
    try {
      const params = buildListParams({
        page,
        size: pageSize,
        ...(filters.status ? { status: filters.status } : {}),
        ...(filters.search ? { search: filters.search } : {}),
      });
      const result = await api.listTournaments(params);
      setTournaments(result.content);
      setTotalElements(result.totalElements);
      setTotalPages(result.totalPages);
      if (result.page !== page) setPage(result.page);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [api, page, pageSize, filters]);

  useEffect(() => {
    loadTournaments();
  }, [loadTournaments]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setFilters((f) => ({ ...f, search: searchInput.trim() }));
    setPage(0);
  };

  const handleStatusChange = (status) => {
    setFilters((f) => ({ ...f, status }));
    setPage(0);
  };

  return (
    <div className="space-y-6">
      <AdminCard padding={false}>
        <div className="p-5 flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b border-slate-100">
          <div className="flex flex-wrap gap-4 flex-1">
            <form onSubmit={handleSearchSubmit} className="flex-1 min-w-[200px] max-w-md">
              <label className="admin-label">Tìm theo tên</label>
              <div className="flex gap-2">
                <input
                  className="admin-input flex-1"
                  placeholder="Tên giải..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                />
                <AdminButton type="submit" variant="secondary">
                  Tìm
                </AdminButton>
              </div>
            </form>
            <div className="w-full sm:w-48">
              <label className="admin-label">Trạng thái</label>
              <select
                className="admin-select w-full"
                value={filters.status}
                onChange={(e) => handleStatusChange(e.target.value)}
              >
                {STATUS_OPTIONS.map((o) => (
                  <option key={o.value || "all"} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <AdminButton
            variant="primary"
            onClick={() => navigate(`${basePath}/new`)}
            className="inline-flex items-center gap-2 shrink-0"
          >
            <Plus size={18} />
            Tạo giải mới
          </AdminButton>
        </div>

        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th className="px-4 py-3 text-left">Tên giải</th>
                <th className="px-4 py-3 text-left">Loại bi</th>
                <th className="px-4 py-3 text-left">Thể thức</th>
                <th className="px-4 py-3 text-left">Trạng thái</th>
                <th className="px-4 py-3 text-left">Config</th>
                <th className="px-4 py-3 text-left">Bắt đầu</th>
                <th className="px-4 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-500">
                    Đang tải...
                  </td>
                </tr>
              )}
              {!loading && tournaments.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-500">
                    Chưa có giải đấu. Nhấn &quot;Tạo giải mới&quot; để bắt đầu.
                  </td>
                </tr>
              )}
              {!loading &&
                tournaments.map((row) => (
                  <tr key={row.id} className="border-t border-slate-100 hover:bg-slate-50/50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900">{row.name}</p>
                      <p className="text-xs text-slate-400">#{row.id}</p>
                    </td>
                    <td className="px-4 py-3 text-sm">{row.gameType}</td>
                    <td className="px-4 py-3 text-sm">
                      {row.formatName || row.format}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                        {TOURNAMENT_STATUS_LABELS[row.status] || row.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {row.configComplete ? (
                        <span className="text-emerald-600 font-medium">Hoàn tất</span>
                      ) : (
                        <span className="text-amber-600">Chưa xong</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {formatDate(row.startAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          className="admin-table-action"
                          title="Chi tiết"
                          onClick={() => navigate(`${basePath}/${row.id}`)}
                        >
                          <Eye size={16} />
                        </button>
                        {row.status === "DRAFT" && (
                          <button
                            type="button"
                            className="admin-table-action"
                            title="Cấu hình"
                            onClick={() => navigate(`${basePath}/${row.id}/edit?step=2`)}
                          >
                            <Settings size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        <AdminPagination
          page={page}
          totalPages={totalPages}
          totalElements={totalElements}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setPage(0);
          }}
          disabled={loading}
        />
      </AdminCard>

      <p className="text-xs text-slate-400 px-1">
        {roleLabel}: danh sách giải từ cấu hình Admin — có thể chỉnh config trước khi mở đăng ký.
      </p>
    </div>
  );
};

export default TournamentListPage;
