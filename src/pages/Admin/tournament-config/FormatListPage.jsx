import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { toast } from "react-toastify";
import {
  getFormats,
  patchFormatActive,
} from "../../../api/adminFormatApi";
import SetupStatusBadge from "../../../components/admin/tournament-config/SetupStatusBadge";
import AdminButton from "../../../components/admin/ui/AdminButton";
import AdminCard from "../../../components/admin/ui/AdminCard";
import AdminModal from "../../../components/admin/ui/AdminModal";
import AdminPagination from "../../../components/admin/ui/AdminPagination";
import { getApiErrorMessage } from "../../../utils/apiError";
import { buildListParams, DEFAULT_PAGE_SIZE } from "../../../utils/pagination";

const FormatListPage = () => {
  const navigate = useNavigate();
  const [formats, setFormats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [filters, setFilters] = useState({ isActive: "", setupStatus: "" });
  const [confirmDeactivate, setConfirmDeactivate] = useState(null);

  const loadFormats = useCallback(async () => {
    setLoading(true);
    try {
      const params = buildListParams({
        page,
        size: pageSize,
        ...(filters.isActive !== "" ? { isActive: filters.isActive === "true" } : {}),
        ...(filters.setupStatus ? { setupStatus: filters.setupStatus } : {}),
      });
      const result = await getFormats(params);
      setFormats(result.content);
      setTotalElements(result.totalElements);
      setTotalPages(result.totalPages);
      if (result.page !== page) setPage(result.page);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, filters]);

  useEffect(() => {
    loadFormats();
  }, [loadFormats]);

  const handleFilterChange = (patch) => {
    setFilters((f) => ({ ...f, ...patch }));
    setPage(0);
  };

  const handleToggleActive = async (row) => {
    if (!row.isActive) {
      await applyPatchActive(row.code, { isActive: true });
      return;
    }
    setConfirmDeactivate(row);
  };

  const applyPatchActive = async (code, body) => {
    try {
      await patchFormatActive(code, body);
      setFormats((prev) => prev.map((f) => (f.code === code ? { ...f, isActive: body.isActive } : f)));
      toast.success(body.isActive ? "Đã bật thể thức" : "Đã tắt thể thức");
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setConfirmDeactivate(null);
    }
  };

  return (
    <div className="space-y-6">
      <AdminCard padding={false}>
        <div className="p-5 flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b border-slate-100">
          <div className="flex flex-wrap gap-4">
            <div className="w-full sm:w-44">
              <label className="admin-label">Trạng thái active</label>
              <select
                className="admin-select"
                value={filters.isActive}
                onChange={(e) => handleFilterChange({ isActive: e.target.value })}
              >
                <option value="">Tất cả</option>
                <option value="true">Đang bật</option>
                <option value="false">Đang tắt</option>
              </select>
            </div>
            <div className="w-full sm:w-52">
              <label className="admin-label">Setup status</label>
              <select
                className="admin-select"
                value={filters.setupStatus}
                onChange={(e) => handleFilterChange({ setupStatus: e.target.value })}
              >
                <option value="">Tất cả</option>
                <option value="INFO_DONE">Thông tin</option>
                <option value="CONFIG_FIELDS_DONE">Thông số thi đấu</option>
                <option value="RACE_TO_DONE">Số ván mỗi vòng</option>
                <option value="READY_TO_ACTIVATE">Sẵn sàng</option>
                <option value="ACTIVE">Đang hoạt động</option>
              </select>
            </div>
          </div>
          <AdminButton onClick={() => navigate("/admin/tournament-config/formats/new")}>
            <Plus size={18} />
            Tạo thể thức mới
          </AdminButton>
        </div>

        <div className="admin-table-wrap">
          {loading ? (
            <div className="admin-empty">
              <div className="admin-skeleton h-4 w-48 mx-auto mb-2" />
              <div className="admin-skeleton h-3 w-32 mx-auto" />
            </div>
          ) : formats.length === 0 ? (
            <div className="admin-empty">
              Chưa có thể thức. Tạo mới hoặc dùng Bootstrap từ backend.
            </div>
          ) : (
            <table className="admin-table">
              <colgroup>
                <col style={{ width: "24%" }} />
                <col style={{ width: "18%" }} />
                <col style={{ width: "14%" }} />
                <col style={{ width: "10%" }} />
                <col style={{ width: "8%" }} />
                <col style={{ width: "8%" }} />
                <col style={{ width: "18%" }} />
              </colgroup>
              <thead>
                <tr>
                  <th>Tên</th>
                  <th>Code</th>
                  <th>Setup</th>
                  <th className="align-center">Kích hoạt</th>
                  <th className="align-center">Fields</th>
                  <th className="align-center">Rules</th>
                  <th className="align-right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {formats.map((row) => (
                  <tr key={row.code}>
                    <td>
                      <span className="admin-table-name" title={row.name}>
                        {row.name}
                      </span>
                    </td>
                    <td>
                      <code className="admin-table-code" title={row.code}>
                        {row.code}
                      </code>
                    </td>
                    <td>
                      <SetupStatusBadge status={row.setupStatus} />
                    </td>
                    <td className="align-center">
                      <span className="admin-table-toggle-wrap">
                        <button
                          type="button"
                          role="switch"
                          aria-checked={row.isActive}
                          className="admin-toggle"
                          data-on={row.isActive}
                          onClick={() => handleToggleActive(row)}
                        >
                          <span className="admin-toggle-knob" />
                        </button>
                      </span>
                    </td>
                    <td className="align-center">
                      <span className="admin-table-num">{row.configFieldCount ?? 0}</span>
                    </td>
                    <td className="align-center">
                      <span className="admin-table-num">{row.raceToRuleCount ?? 0}</span>
                    </td>
                    <td className="align-right">
                      <div className="admin-table-actions">
                        <button
                          type="button"
                          className="admin-table-action admin-table-action--primary"
                          onClick={() =>
                            navigate(`/admin/tournament-config/formats/${row.code}/edit`)
                          }
                        >
                          Sửa
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
        open={!!confirmDeactivate}
        onClose={() => setConfirmDeactivate(null)}
        title="Tắt thể thức?"
        footer={
          <>
            <AdminButton variant="secondary" onClick={() => setConfirmDeactivate(null)}>
              Hủy
            </AdminButton>
            <AdminButton
              variant="danger"
              onClick={() =>
                applyPatchActive(confirmDeactivate.code, { isActive: false })
              }
            >
              Xác nhận tắt
            </AdminButton>
          </>
        }
      >
        Owner sẽ không chọn được thể thức &quot;{confirmDeactivate?.name}&quot; khi tắt
        active.
      </AdminModal>
    </div>
  );
};

export default FormatListPage;
