import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  cancelMyRegistration,
  getMyRegistrations,
} from "../../api/playerRegistrationApi";
import AdminPagination from "../../components/admin/ui/AdminPagination";
import { REGISTRATION_STATUS_LABELS } from "../../constants/registrationFormConfig";
import { getApiErrorMessage } from "../../utils/apiError";
import { buildListParams, DEFAULT_PAGE_SIZE } from "../../utils/pagination";

const MyRegistrationsPage = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getMyRegistrations(buildListParams({ page, size: pageSize }));
      setItems(result.content);
      setTotalElements(result.totalElements);
      setTotalPages(result.totalPages);
      if (result.page !== page) setPage(result.page);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [page, pageSize]);

  useEffect(() => {
    load();
  }, [load]);

  const handleCancel = async (id) => {
    if (!window.confirm("Hủy đăng ký này?")) return;
    try {
      await cancelMyRegistration(id);
      toast.success("Đã hủy đăng ký");
      load();
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold text-slate-900">Đăng ký của tôi</h1>
        <button type="button" className="text-sm text-indigo-600" onClick={() => navigate("/event")}>
          Xem giải đấu
        </button>
      </div>
      <div className="admin-card overflow-hidden">
        {loading ? (
          <p className="admin-empty">Đang tải...</p>
        ) : items.length === 0 ? (
          <p className="admin-empty">Bạn chưa đăng ký giải nào.</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Giải đấu</th>
                <th>Trạng thái</th>
                <th className="align-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {items.map((row) => (
                <tr key={row.id}>
                  <td>
                    <span className="admin-table-name">{row.tournamentName}</span>
                    <p className="text-xs text-slate-500">{row.playerFullName}</p>
                  </td>
                  <td>{REGISTRATION_STATUS_LABELS[row.status] || row.status}</td>
                  <td className="align-right">
                    {row.status === "PENDING_PAYMENT" && (
                      <button
                        type="button"
                        className="admin-table-action text-red-600"
                        onClick={() => handleCancel(row.id)}
                      >
                        Hủy
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <AdminPagination
          page={page}
          totalPages={totalPages}
          totalElements={totalElements}
          pageSize={pageSize}
          disabled={loading}
          onPageChange={setPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setPage(0);
          }}
        />
      </div>
    </div>
  );
};

export default MyRegistrationsPage;
