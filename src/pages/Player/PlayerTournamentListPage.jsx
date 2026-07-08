import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { listPlayerTournaments } from "../../api/playerRegistrationApi";
import AdminPagination from "../../components/admin/ui/AdminPagination";
import {
  TOURNAMENT_STATUS_LABELS,
  TOURNAMENT_STATUS_STYLES,
} from "../../constants/tournamentConfig";
import { getApiErrorMessage } from "../../utils/apiError";
import { buildListParams, DEFAULT_PAGE_SIZE } from "../../utils/pagination";

const STATUS_OPTIONS = [
  { value: "", label: "Tất cả" },
  { value: "OPEN_FOR_REGISTRATION", label: "Mở đăng ký" },
  { value: "REGISTRATION_CLOSED", label: "Đóng đăng ký" },
  { value: "DRAW_DONE", label: "Đã bốc thăm" },
  { value: "IN_PROGRESS", label: "Đang diễn ra" },
  { value: "COMPLETED", label: "Hoàn thành" },
];

const fmtDate = (iso) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const fmtCurrency = (v) => {
  if (v == null || v === "" || Number(v) === 0) return "Miễn phí";
  return `${Number(v).toLocaleString("vi-VN")} đ`;
};

const PlayerTournamentListPage = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [statusFilter, setStatusFilter] = useState("OPEN_FOR_REGISTRATION");
  const [searchInput, setSearchInput] = useState("");
  const [searchApplied, setSearchApplied] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = buildListParams({
        page,
        size: pageSize,
        ...(statusFilter ? { status: statusFilter } : {}),
        ...(searchApplied ? { search: searchApplied } : {}),
      });
      const result = await listPlayerTournaments(params);
      setItems(result.content);
      setTotalElements(result.totalElements);
      setTotalPages(result.totalPages);
      if (result.page !== page) setPage(result.page);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, statusFilter, searchApplied]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSearchApplied(searchInput.trim());
    setPage(0);
  };

  const handleStatusChange = (v) => {
    setStatusFilter(v);
    setPage(0);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Giải đấu</h1>
        <button
          type="button"
          className="text-sm text-indigo-600 hover:underline"
          onClick={() => navigate("/player/registrations")}
        >
          Đăng ký của tôi →
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <form onSubmit={handleSearchSubmit} className="flex gap-2 flex-1 min-w-[200px] max-w-sm">
          <input
            className="admin-input flex-1"
            placeholder="Tìm theo tên giải..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          <button type="submit" className="admin-btn admin-btn-secondary px-4">
            Tìm
          </button>
        </form>
        <div className="flex gap-1 flex-wrap">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value || "all"}
              type="button"
              onClick={() => handleStatusChange(opt.value)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                statusFilter === opt.value
                  ? "bg-primary text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="text-center py-16 text-slate-400">Đang tải...</div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <p className="text-lg">Không có giải đấu nào.</p>
          <p className="text-sm mt-1">Thử chọn trạng thái khác hoặc tìm kiếm.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((t) => (
            <div
              key={t.id}
              className="admin-card p-5 flex flex-col gap-3 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => navigate(`/player/tournaments/${t.id}`)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && navigate(`/player/tournaments/${t.id}`)}
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-slate-900 leading-snug line-clamp-2">
                  {t.name}
                </h3>
                <span
                  className={`shrink-0 inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                    TOURNAMENT_STATUS_STYLES[t.status] || "bg-slate-100 text-slate-600"
                  }`}
                >
                  {TOURNAMENT_STATUS_LABELS[t.status] || t.status}
                </span>
              </div>

              <div className="text-xs text-slate-500 space-y-1">
                <p>
                  <span className="font-medium text-slate-700">{t.gameType}</span>
                  {t.formatName && (
                    <> · {t.formatName}</>
                  )}
                  {t.participantType && (
                    <> · {t.participantType === "SINGLE" ? "Đơn" : t.participantType === "DOUBLE" ? "Đôi" : "Đội"}</>
                  )}
                </p>
                {t.venueName && (
                  <p>Chi nhánh: <span className="font-medium text-slate-700">{t.venueName}</span></p>
                )}
                <p>
                  Phí tham dự: <span className="font-medium text-slate-800">{fmtCurrency(t.entryFee)}</span>
                </p>
                {t.registrationDeadline && (
                  <p>Hạn ĐK: <span className="font-medium">{fmtDate(t.registrationDeadline)}</span></p>
                )}
                {t.startAt && (
                  <p>Bắt đầu: <span className="font-medium">{fmtDate(t.startAt)}</span></p>
                )}
              </div>

              <div className="flex items-center justify-between mt-auto pt-2 border-t border-slate-100">
                <span className="text-xs text-slate-400">
                  Tối đa {t.maxParticipants} người
                </span>
                {t.status === "OPEN_FOR_REGISTRATION" && t.isRegister && (
                  <span className="text-xs text-emerald-600 font-medium">
                    ✓ Đang nhận đăng ký
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4">
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
    </div>
  );
};

export default PlayerTournamentListPage;
