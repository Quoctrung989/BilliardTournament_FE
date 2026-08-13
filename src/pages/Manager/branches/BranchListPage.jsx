import { useCallback, useEffect, useState } from "react";
import { Eye } from "lucide-react";
import { toast } from "react-toastify";
import { managerBranchApi } from "../../../api/branchApi";
import BranchDetail from "../../../components/owner/branches/BranchDetail";
import AdminCard from "../../../components/admin/ui/AdminCard";
import AdminModal from "../../../components/admin/ui/AdminModal";
import AdminButton from "../../../components/admin/ui/AdminButton";
import AdminPagination from "../../../components/admin/ui/AdminPagination";
import { BRANCH_STATUS_LABELS } from "../../../constants/branchConfig";
import { getApiErrorMessage } from "../../../utils/apiError";
import { DEFAULT_PAGE_SIZE } from "../../../utils/pagination";

const ManagerBranchListPage = () => {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await managerBranchApi.listBranches({ page, size: pageSize });
      setBranches(result.content);
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

  const openDetail = async (row) => {
    setDetail(row);
    setDetailLoading(true);
    try {
      const data = await managerBranchApi.getBranch(row.id);
      setDetail(data);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
      setDetail(null);
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <p className="text-sm text-slate-600 dark:text-white/70">
        Danh sách chi nhánh bạn được Owner phân quyền quản lý — dùng để chọn địa điểm tổ chức khi tạo giải đấu.
      </p>

      <AdminCard padding={false}>
        <div className="admin-table-wrap">
          {loading ? (
            <div className="admin-empty">Đang tải...</div>
          ) : branches.length === 0 ? (
            <div className="admin-empty">Bạn chưa được phân quyền chi nhánh nào.</div>
          ) : (
            <table className="admin-table">
              <colgroup>
                <col style={{ width: "8%" }} />
                <col style={{ width: "26%" }} />
                <col style={{ width: "34%" }} />
                <col style={{ width: "14%" }} />
                <col style={{ width: "10%" }} />
                <col style={{ width: "8%" }} />
              </colgroup>
              <thead>
                <tr>
                  <th className="align-center">Ảnh</th>
                  <th>Tên chi nhánh</th>
                  <th>Địa chỉ</th>
                  <th>SĐT</th>
                  <th className="align-center">Trạng thái</th>
                  <th className="align-right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {branches.map((row) => (
                  <tr key={row.id}>
                    <td className="align-center">
                      {row.thumbnailUrl ? (
                        <img src={row.thumbnailUrl} alt="" className="h-9 w-9 rounded-lg object-cover mx-auto" />
                      ) : (
                        <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 dark:bg-white/10 text-slate-400 dark:text-white/40 text-xs mx-auto">
                          —
                        </span>
                      )}
                    </td>
                    <td>
                      <span className="admin-table-name" title={row.name}>{row.name}</span>
                    </td>
                    <td>
                      <span className="text-slate-600 dark:text-white/70 truncate block" title={row.address}>
                        {row.address}
                      </span>
                    </td>
                    <td>
                      <span className="text-slate-600 dark:text-white/70">{row.phone || "—"}</span>
                    </td>
                    <td className="align-center">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ring-1 ${
                          row.status === "ACTIVE"
                            ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                            : "bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-white/65 ring-slate-200 dark:ring-white/15"
                        }`}
                      >
                        {BRANCH_STATUS_LABELS[row.status] ?? row.status}
                      </span>
                    </td>
                    <td className="align-right">
                      <div className="admin-table-actions">
                        <button
                          type="button"
                          className="admin-table-action admin-table-action--primary"
                          onClick={() => openDetail(row)}
                        >
                          <Eye size={14} />
                          Chi tiết
                        </button>
                      </div>
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
          disabled={loading}
          onPageChange={setPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setPage(0);
          }}
        />
      </AdminCard>

      <AdminModal
        open={!!detail}
        onClose={() => setDetail(null)}
        title="Chi tiết chi nhánh"
        size="lg"
        footer={
          <AdminButton variant="secondary" onClick={() => setDetail(null)}>
            Đóng
          </AdminButton>
        }
      >
        <BranchDetail item={detail} loading={detailLoading} />
      </AdminModal>
    </div>
  );
};

export default ManagerBranchListPage;
