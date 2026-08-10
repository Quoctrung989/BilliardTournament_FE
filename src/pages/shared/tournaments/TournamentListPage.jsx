import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, Eye, FileText, Plus, Settings, Users } from "lucide-react";
import { toast } from "react-toastify";
import AdminButton from "../../../components/admin/ui/AdminButton";
import AdminCard from "../../../components/admin/ui/AdminCard";
import AdminPagination from "../../../components/admin/ui/AdminPagination";
import {
  TOURNAMENT_STATUS_LABELS,
  TOURNAMENT_STATUS_STYLES,
} from "../../../constants/tournamentConfig";
import { getApiErrorMessage } from "../../../utils/apiError";
import { buildListParams, DEFAULT_PAGE_SIZE } from "../../../utils/pagination";

const STATUS_OPTIONS = [
  { value: "", label: "Tất cả trạng thái" },
  ...Object.entries(TOURNAMENT_STATUS_LABELS).map(([value, label]) => ({ value, label })),
];

const PARTICIPANT_LABELS = {
  SINGLE: "Đơn",
  DOUBLE: "Đôi",
  TEAM: "Đội",
};

const PARTICIPANT_TYPE_OPTIONS = [
  { value: "", label: "Tất cả hình thức" },
  { value: "SINGLE", label: "Đơn" },
  { value: "DOUBLE", label: "Đôi" },
  { value: "TEAM", label: "Đội" },
];

const IS_REGISTER_OPTIONS = [
  { value: "", label: "Tất cả đăng ký" },
  { value: "true", label: "Online" },
  { value: "false", label: "Không" },
];

const fmtDate = (iso) => {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return null;
  }
};

/* ── Dropdown menu per row ───────────────────────────── */
const RowMenu = ({ row, basePath, navigate }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const close = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  const go = (path) => {
    setOpen(false);
    navigate(path);
  };

  const isDraft = row.status === "DRAFT";

  return (
    <div ref={ref} className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-colors shadow-sm"
      >
        Thao tác
        <ChevronDown
          size={13}
          className={`transition-transform duration-150 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 z-50 w-48 bg-white rounded-xl shadow-lg border border-slate-100 py-1 overflow-hidden">
          {/* Chi tiết */}
          <button
            type="button"
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 text-left transition-colors"
            onClick={() => go(`${basePath}/${row.id}`)}
          >
            <Eye size={15} className="shrink-0 text-indigo-400" />
            Chi tiết
          </button>

              <div className="my-1 border-t border-slate-100" />

          {isDraft && (
            <button
              type="button"
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-amber-700 hover:bg-amber-50 text-left transition-colors"
              onClick={() => go(`${basePath}/${row.id}/edit?step=2`)}
            >
              <Settings size={15} className="shrink-0" />
              Cấu hình giải
            </button>
          )}

          {row.isRegister && (
            <button
              type="button"
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 text-left transition-colors"
              onClick={() => go(`${basePath}/${row.id}/registrations`)}
            >
              <FileText size={15} className="shrink-0 text-slate-400" />
              Đơn đăng ký
            </button>
          )}

          {!isDraft && (
            <button
              type="button"
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 text-left transition-colors"
              onClick={() => go(`${basePath}/${row.id}/participants`)}
            >
              <Users size={15} className="shrink-0 text-slate-400" />
              Người tham gia
            </button>
          )}
        </div>
      )}
    </div>
  );
};

/* ── Main page ───────────────────────────────────────── */
const TournamentListPage = ({ api, branchApi, basePath }) => {
  const navigate = useNavigate();
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [statusFilter, setStatusFilter] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [searchApplied, setSearchApplied] = useState("");
  const [gameTypeFilter, setGameTypeFilter] = useState("");
  const [participantTypeFilter, setParticipantTypeFilter] = useState("");
  const [isRegisterFilter, setIsRegisterFilter] = useState("");
  const [branchIdFilter, setBranchIdFilter] = useState("");
  const [gameTypes, setGameTypes] = useState([]);
  const [branches, setBranches] = useState([]);
  const [visibilitySavingId, setVisibilitySavingId] = useState(null);

  useEffect(() => {
    api
      .listGameTypes()
      .then((r) => setGameTypes(r.items || []))
      .catch(() => {});
  }, [api]);

  useEffect(() => {
    if (!branchApi) return;
    branchApi
      .listBranches(buildListParams({ page: 0, size: 100, status: "ACTIVE" }))
      .then((r) => setBranches(r.content))
      .catch(() => {});
  }, [branchApi]);

  const loadTournaments = useCallback(async () => {
    setLoading(true);
    try {
      const params = buildListParams({
        page,
        size: pageSize,
        ...(statusFilter ? { status: statusFilter } : {}),
        ...(searchApplied ? { search: searchApplied } : {}),
        ...(gameTypeFilter ? { gameType: gameTypeFilter } : {}),
        ...(participantTypeFilter ? { participantType: participantTypeFilter } : {}),
        ...(isRegisterFilter ? { isRegister: isRegisterFilter } : {}),
        ...(branchIdFilter ? { branchId: branchIdFilter } : {}),
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
  }, [
    api,
    page,
    pageSize,
    statusFilter,
    searchApplied,
    gameTypeFilter,
    participantTypeFilter,
    isRegisterFilter,
    branchIdFilter,
  ]);

  useEffect(() => {
    loadTournaments();
  }, [loadTournaments]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSearchApplied(searchInput.trim());
    setPage(0);
  };

  const handleToggleVisibility = async (row) => {
    const next = !row.isShowTournament;
    setVisibilitySavingId(row.id);
    try {
      await api.patchVisibility(row.id, { isShowTournament: next });
      setTournaments((prev) =>
        prev.map((t) => (t.id === row.id ? { ...t, isShowTournament: next } : t))
      );
      toast.success(next ? "Đã hiển thị giải đấu công khai" : "Đã ẩn giải đấu khỏi trang công khai");
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setVisibilitySavingId(null);
    }
  };

  const resetFilters = () => {
    setPage(0);
    setStatusFilter("");
    setSearchInput("");
    setSearchApplied("");
    setGameTypeFilter("");
    setParticipantTypeFilter("");
    setIsRegisterFilter("");
    setBranchIdFilter("");
  };

  return (
    <div className="space-y-6">
      <AdminCard padding={false}>
        {/* Toolbar */}
        <div className="p-5 flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b border-slate-100">
          <div className="flex flex-wrap gap-4 flex-1 min-w-0">
            <form onSubmit={handleSearchSubmit} className="flex-1 min-w-[200px] max-w-md">
              <label className="admin-label">Tìm theo tên</label>
              <div className="flex gap-2">
                <input
                  className="admin-input flex-1"
                  placeholder="Tên giải..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                />
                <AdminButton type="submit" variant="secondary" className="shrink-0">
                  Tìm
                </AdminButton>
              </div>
            </form>
            <div className="w-full sm:w-52 shrink-0">
              <label className="admin-label">Trạng thái</label>
              <select
                className="admin-select w-full"
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
              >
                {STATUS_OPTIONS.map((o) => (
                  <option key={o.value || "all"} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div className="w-full sm:w-44 shrink-0">
              <label className="admin-label">Loại bi</label>
              <select
                className="admin-select w-full"
                value={gameTypeFilter}
                onChange={(e) => { setGameTypeFilter(e.target.value); setPage(0); }}
              >
                <option value="">Tất cả loại bi</option>
                {gameTypes.map((g) => (
                  <option key={g.code} value={g.code}>{g.name}</option>
                ))}
              </select>
            </div>
            <div className="w-full sm:w-44 shrink-0">
              <label className="admin-label">Hình thức</label>
              <select
                className="admin-select w-full"
                value={participantTypeFilter}
                onChange={(e) => { setParticipantTypeFilter(e.target.value); setPage(0); }}
              >
                {PARTICIPANT_TYPE_OPTIONS.map((o) => (
                  <option key={o.value || "all"} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div className="w-full sm:w-40 shrink-0">
              <label className="admin-label">Đăng ký</label>
              <select
                className="admin-select w-full"
                value={isRegisterFilter}
                onChange={(e) => { setIsRegisterFilter(e.target.value); setPage(0); }}
              >
                {IS_REGISTER_OPTIONS.map((o) => (
                  <option key={o.value || "all"} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            {branchApi && (
              <div className="w-full sm:w-52 shrink-0">
                <label className="admin-label">Chi nhánh</label>
                <select
                  className="admin-select w-full"
                  value={branchIdFilter}
                  onChange={(e) => { setBranchIdFilter(e.target.value); setPage(0); }}
                >
                  <option value="">Tất cả chi nhánh</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
            )}
            <div className="shrink-0 flex items-end">
              <AdminButton variant="secondary" onClick={resetFilters}>
                Xóa lọc
              </AdminButton>
            </div>
          </div>
          <AdminButton onClick={() => navigate(`${basePath}/new`)} className="shrink-0">
            <Plus size={18} />
            Tạo giải mới
          </AdminButton>
        </div>

        {/* Table */}
        <div className="admin-table-wrap">
          {loading ? (
            <div className="admin-empty">
              <div className="admin-skeleton h-4 w-48 mx-auto mb-2" />
              <div className="admin-skeleton h-3 w-32 mx-auto" />
            </div>
          ) : tournaments.length === 0 ? (
            <div className="admin-empty">
              Chưa có giải đấu. Nhấn &quot;Tạo giải mới&quot; để bắt đầu.
            </div>
          ) : (
            <table className="admin-table">
              <colgroup>
                <col style={{ width: "18%" }} />
                <col style={{ width: "12%" }} />
                <col style={{ width: "12%" }} />
                <col style={{ width: "7%" }} />
                <col style={{ width: "11%" }} />
                <col style={{ width: "7%" }} />
                <col style={{ width: "6%" }} />
                <col style={{ width: "8%" }} />
                <col style={{ width: "12%" }} />
                <col style={{ width: "7%" }} />
              </colgroup>
              <thead>
                <tr>
                  <th>Tên giải</th>
                  <th>Loại bi / Thể thức</th>
                  <th>Chi nhánh</th>
                  <th className="align-center">Hình thức</th>
                  <th className="align-center">Trạng thái</th>
                  <th className="align-center">Cấu hình</th>
                  <th className="align-center">Đăng ký</th>
                  <th className="align-center">Công khai</th>
                  <th>Thời gian</th>
                  <th className="align-right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {tournaments.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <button
                        type="button"
                        className="admin-table-name text-left hover:text-indigo-700 hover:underline bg-transparent border-0 p-0 cursor-pointer w-full"
                        title={row.name}
                        onClick={() => navigate(`${basePath}/${row.id}`)}
                      >
                        {row.name}
                      </button>
                      <span className="block text-xs text-slate-400">#{row.id}</span>
                    </td>
                    <td>
                      <span className="text-sm text-slate-700">{row.gameType || "—"}</span>
                      {(row.formatName || row.format) && (
                        <span className="block text-xs text-slate-400">
                          {row.formatName || row.format}
                        </span>
                      )}
                    </td>
                    <td>
                      <span className="text-sm text-slate-700 truncate block" title={row.venueName}>
                        {row.venueName || "—"}
                      </span>
                    </td>
                    <td className="align-center">
                      <span className="text-sm text-slate-600">
                        {PARTICIPANT_LABELS[row.participantType] || row.participantType || "—"}
                      </span>
                    </td>
                    <td className="align-center">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
                          TOURNAMENT_STATUS_STYLES[row.status] ||
                          "bg-slate-100 text-slate-600 ring-1 ring-slate-200"
                        }`}
                      >
                        {TOURNAMENT_STATUS_LABELS[row.status] || row.status}
                      </span>
                    </td>
                    <td className="align-center">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ring-1 ${
                          row.configComplete
                            ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                            : "bg-amber-50 text-amber-700 ring-amber-200"
                        }`}
                      >
                        {row.configComplete ? "Xong" : "Chưa xong"}
                      </span>
                    </td>
                    <td className="align-center">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ring-1 ${
                          row.isRegister
                            ? "bg-indigo-50 text-indigo-700 ring-indigo-200"
                            : "bg-slate-100 text-slate-500 ring-slate-200"
                        }`}
                      >
                        {row.isRegister ? "Online" : "Không"}
                      </span>
                    </td>
                    <td className="align-center">
                      <span className="admin-table-toggle-wrap">
                        <button
                          type="button"
                          role="switch"
                          aria-checked={!!row.isShowTournament}
                          className="admin-toggle"
                          data-on={!!row.isShowTournament}
                          disabled={visibilitySavingId === row.id}
                          onClick={() => handleToggleVisibility(row)}
                          title={
                            row.isShowTournament
                              ? "Nhấn để ẩn khỏi trang công khai"
                              : "Nhấn để hiển thị công khai"
                          }
                        >
                          <span className="admin-toggle-knob" />
                        </button>
                      </span>
                    </td>
                    <td>
                      {row.registrationDeadline && (
                        <p className="text-xs text-slate-500">
                          Hạn ĐK: {fmtDate(row.registrationDeadline)}
                        </p>
                      )}
                      {row.startAt && (
                        <p className="text-xs text-slate-500">
                          Bắt đầu: {fmtDate(row.startAt)}
                        </p>
                      )}
                      {!row.registrationDeadline && !row.startAt && (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                    <td className="align-right">
                      <RowMenu row={row} basePath={basePath} navigate={navigate} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <AdminPagination
          page={page}
          totalPages={totalPages}
          totalElements={totalElements}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={(size) => { setPageSize(size); setPage(0); }}
          disabled={loading}
        />
      </AdminCard>
    </div>
  );
};

export default TournamentListPage;
