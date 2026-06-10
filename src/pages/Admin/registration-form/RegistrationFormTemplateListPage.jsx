import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, Plus } from "lucide-react";
import { toast } from "react-toastify";
import {
  getRegistrationFormTemplates,
  patchRegistrationFormTemplateActive,
} from "../../../api/adminRegistrationFormTemplateApi";
import AdminButton from "../../../components/admin/ui/AdminButton";
import AdminCard from "../../../components/admin/ui/AdminCard";
import AdminModal from "../../../components/admin/ui/AdminModal";
import AdminPagination from "../../../components/admin/ui/AdminPagination";
import { getApiErrorMessage } from "../../../utils/apiError";
import { buildListParams, DEFAULT_PAGE_SIZE } from "../../../utils/pagination";

const RegistrationFormTemplateListPage = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isActiveFilter, setIsActiveFilter] = useState("");
  const [confirmDeactivate, setConfirmDeactivate] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getRegistrationFormTemplates(
        buildListParams({
          page,
          size: pageSize,
          ...(isActiveFilter !== "" ? { isActive: isActiveFilter === "true" } : {}),
        })
      );
      setItems(result.content);
      setTotalElements(result.totalElements);
      setTotalPages(result.totalPages);
      if (result.page !== page) setPage(result.page);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, isActiveFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const handleToggleActive = async (row) => {
    if (!row.isActive) {
      await applyPatch(row.id, { isActive: true });
      return;
    }
    setConfirmDeactivate(row);
  };

  const applyPatch = async (id, body) => {
    try {
      await patchRegistrationFormTemplateActive(id, body);
      toast.success(body.isActive ? "Đã bật template" : "Đã tắt template");
      load();
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
          <div className="w-full sm:w-44">
            <label className="admin-label">Trạng thái</label>
            <select
              className="admin-select"
              value={isActiveFilter}
              onChange={(e) => {
                setIsActiveFilter(e.target.value);
                setPage(0);
              }}
            >
              <option value="">Tất cả</option>
              <option value="true">Đang bật</option>
              <option value="false">Đang tắt</option>
            </select>
          </div>
          <AdminButton onClick={() => navigate("/admin/registration-form/templates/new")}>
            <Plus size={18} />
            Tạo template mới
          </AdminButton>
        </div>

        <div className="admin-table-wrap">
          {loading ? (
            <div className="admin-empty">Đang tải...</div>
          ) : items.length === 0 ? (
            <div className="admin-empty">Chưa có template form đăng ký.</div>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Tên</th>
                  <th className="align-center">Fields</th>
                  <th className="align-center">Sẵn sàng</th>
                  <th className="align-center">Active</th>
                  <th className="align-right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {items.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <code className="admin-table-code">{row.code}</code>
                    </td>
                    <td>
                      <span className="admin-table-name">{row.name}</span>
                    </td>
                    <td className="align-center">
                      <span className="admin-table-num">{row.fieldCount ?? 0}</span>
                    </td>
                    <td className="align-center">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
                          row.isReady
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {row.isReady ? "OK" : "Thiếu field"}
                      </span>
                    </td>
                    <td className="align-center">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
                          row.isActive
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {row.isActive ? "Bật" : "Tắt"}
                      </span>
                    </td>
                    <td className="align-right">
                      <div className="admin-table-actions">
                        <button
                          type="button"
                          className="admin-table-action admin-table-action--primary"
                          onClick={() =>
                            navigate(`/admin/registration-form/templates/${row.id}/edit`)
                          }
                        >
                          Sửa
                        </button>
                        <button
                          type="button"
                          className="admin-table-action"
                          onClick={() =>
                            navigate(`/admin/registration-form/templates/${row.id}/edit?step=3`)
                          }
                        >
                          <Eye size={14} className="inline mr-1" />
                          Preview
                        </button>
                        <button
                          type="button"
                          className="admin-table-action"
                          onClick={() => handleToggleActive(row)}
                        >
                          {row.isActive ? "Tắt" : "Bật"}
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
        title="Tắt template?"
        footer={
          <>
            <AdminButton variant="secondary" onClick={() => setConfirmDeactivate(null)}>
              Hủy
            </AdminButton>
            <AdminButton
              variant="danger"
              onClick={() => applyPatch(confirmDeactivate.id, { isActive: false })}
            >
              Tắt template
            </AdminButton>
          </>
        }
      >
        <p className="text-sm text-slate-600">
          Owner sẽ không chọn được template <strong>{confirmDeactivate?.name}</strong> khi tạo giải.
        </p>
      </AdminModal>
    </div>
  );
};

export default RegistrationFormTemplateListPage;
