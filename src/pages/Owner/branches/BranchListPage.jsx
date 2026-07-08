import { useCallback, useEffect, useState } from "react";
import { Eye, Plus, Search } from "lucide-react";
import { toast } from "react-toastify";
import { ownerBranchApi } from "../../../api/branchApi";
import BranchForm, { validateBranchForm } from "../../../components/owner/branches/BranchForm";
import BranchDetail from "../../../components/owner/branches/BranchDetail";
import AdminButton from "../../../components/admin/ui/AdminButton";
import AdminCard from "../../../components/admin/ui/AdminCard";
import AdminModal from "../../../components/admin/ui/AdminModal";
import AdminPagination from "../../../components/admin/ui/AdminPagination";
import { EMPTY_BRANCH_FORM } from "../../../constants/branchConfig";
import { getApiErrorMessage } from "../../../utils/apiError";
import { buildListParams, DEFAULT_PAGE_SIZE } from "../../../utils/pagination";

const detailToEditForm = (detail) => ({
  name: detail.name || "",
  address: detail.address || "",
  phone: detail.phone || "",
  description: detail.description || "",
  images: detail.images || [],
});

const OwnerBranchListPage = () => {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [statusFilter, setStatusFilter] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  const [formMode, setFormMode] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_BRANCH_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [formLoading, setFormLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [confirmToggle, setConfirmToggle] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await ownerBranchApi.listBranches(
        buildListParams({
          page,
          size: pageSize,
          ...(statusFilter ? { status: statusFilter } : {}),
          ...(search ? { search } : {}),
        })
      );
      setBranches(result.content);
      setTotalElements(result.totalElements);
      setTotalPages(result.totalPages);
      if (result.page !== page) setPage(result.page);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, statusFilter, search]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSearch(searchInput.trim());
    setPage(0);
  };

  const patchForm = (updates) => {
    setForm((f) => ({ ...f, ...updates }));
    setFormErrors((e) => {
      const next = { ...e };
      Object.keys(updates).forEach((k) => delete next[k]);
      return next;
    });
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_BRANCH_FORM);
    setFormErrors({});
    setFormMode("create");
  };

  const openEdit = async (row) => {
    setEditingId(row.id);
    setForm(EMPTY_BRANCH_FORM);
    setFormErrors({});
    setFormMode("edit");
    setFormLoading(true);
    try {
      const data = await ownerBranchApi.getBranch(row.id);
      setForm(detailToEditForm(data));
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setFormLoading(false);
    }
  };

  const closeForm = () => {
    setFormMode(null);
    setEditingId(null);
    setSaving(false);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const { body, errors } = validateBranchForm(form);
    if (errors) {
      setFormErrors(errors);
      return;
    }

    setSaving(true);
    try {
      if (formMode === "create") {
        await ownerBranchApi.createBranch(body);
        toast.success("Đã tạo chi nhánh");
      } else {
        await ownerBranchApi.updateBranch(editingId, body);
        toast.success("Đã cập nhật chi nhánh");
      }
      closeForm();
      load();
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = (row) => {
    if (row.status === "ACTIVE") {
      setConfirmToggle(row);
      return;
    }
    applyStatus(row, "ACTIVE");
  };

  const applyStatus = async (row, status) => {
    setSaving(true);
    try {
      await ownerBranchApi.updateStatus(row.id, { status });
      toast.success(status === "ACTIVE" ? "Đã kích hoạt chi nhánh" : "Đã ngừng hoạt động chi nhánh");
      setConfirmToggle(null);
      load();
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const openDetail = async (row) => {
    setDetail(row);
    setDetailLoading(true);
    try {
      const data = await ownerBranchApi.getBranch(row.id);
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
      <AdminCard padding={false}>
        <div className="p-5 flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b border-slate-100">
          <div className="flex flex-wrap gap-4 flex-1 min-w-0">
            <form onSubmit={handleSearchSubmit} className="flex-1 min-w-[220px] max-w-xl">
              <label className="admin-label">Tìm kiếm</label>
              <div className="flex gap-2">
                <div className="relative flex-1 min-w-0">
                  <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    className="admin-input w-full pl-9"
                    placeholder="Tìm tên hoặc địa chỉ…"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                  />
                </div>
                <AdminButton type="submit" variant="secondary" className="shrink-0">
                  Tìm
                </AdminButton>
              </div>
            </form>

            <div className="w-full sm:w-48 shrink-0">
              <label className="admin-label">Trạng thái</label>
              <select
                className="admin-select w-full"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(0);
                }}
              >
                <option value="">Tất cả</option>
                <option value="ACTIVE">Hoạt động</option>
                <option value="INACTIVE">Ngừng hoạt động</option>
              </select>
            </div>
          </div>

          <AdminButton onClick={openCreate} className="shrink-0">
            <Plus size={18} />
            Thêm chi nhánh
          </AdminButton>
        </div>

        <div className="admin-table-wrap">
          {loading ? (
            <div className="admin-empty">Đang tải...</div>
          ) : branches.length === 0 ? (
            <div className="admin-empty">Chưa có chi nhánh nào.</div>
          ) : (
            <table className="admin-table">
              <colgroup>
                <col style={{ width: "8%" }} />
                <col style={{ width: "24%" }} />
                <col style={{ width: "30%" }} />
                <col style={{ width: "14%" }} />
                <col style={{ width: "10%" }} />
                <col style={{ width: "14%" }} />
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
                {branches.map((row) => {
                  const isActive = row.status === "ACTIVE";
                  return (
                    <tr key={row.id}>
                      <td className="align-center">
                        {row.thumbnailUrl ? (
                          <img src={row.thumbnailUrl} alt="" className="h-9 w-9 rounded-lg object-cover mx-auto" />
                        ) : (
                          <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-400 text-xs mx-auto">
                            —
                          </span>
                        )}
                      </td>
                      <td>
                        <span className="admin-table-name" title={row.name}>{row.name}</span>
                      </td>
                      <td>
                        <span className="text-slate-600 truncate block" title={row.address}>
                          {row.address}
                        </span>
                      </td>
                      <td>
                        <span className="text-slate-600">{row.phone || "—"}</span>
                      </td>
                      <td className="align-center">
                        <span className="admin-table-toggle-wrap">
                          <button
                            type="button"
                            role="switch"
                            aria-checked={isActive}
                            className="admin-toggle"
                            data-on={isActive}
                            onClick={() => handleToggleStatus(row)}
                            title={isActive ? "Nhấn để ngừng hoạt động" : "Nhấn để kích hoạt"}
                          >
                            <span className="admin-toggle-knob" />
                          </button>
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
                          <button
                            type="button"
                            className="admin-table-action admin-table-action--warning"
                            onClick={() => openEdit(row)}
                          >
                            Sửa
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
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
        open={!!formMode}
        onClose={closeForm}
        title={formMode === "create" ? "Thêm chi nhánh" : "Sửa chi nhánh"}
        size="lg"
        footer={
          <>
            <AdminButton variant="secondary" onClick={closeForm} disabled={saving}>
              Hủy
            </AdminButton>
            <AdminButton type="submit" form="branch-form" disabled={saving}>
              {saving ? "Đang lưu…" : formMode === "create" ? "Tạo chi nhánh" : "Lưu thay đổi"}
            </AdminButton>
          </>
        }
      >
        {formLoading ? (
          <p className="text-slate-500 py-6 text-center">Đang tải...</p>
        ) : (
          <BranchForm
            form={form}
            errors={formErrors}
            onChange={patchForm}
            onSubmit={handleFormSubmit}
          />
        )}
      </AdminModal>

      <AdminModal
        open={!!confirmToggle}
        onClose={() => !saving && setConfirmToggle(null)}
        title="Ngừng hoạt động chi nhánh?"
        footer={
          <>
            <AdminButton variant="secondary" onClick={() => setConfirmToggle(null)} disabled={saving}>
              Hủy
            </AdminButton>
            <AdminButton variant="danger" onClick={() => applyStatus(confirmToggle, "INACTIVE")} disabled={saving}>
              {saving ? "Đang xử lý…" : "Xác nhận"}
            </AdminButton>
          </>
        }
      >
        Chi nhánh &quot;{confirmToggle?.name}&quot; sẽ không còn hiển thị khi chọn địa điểm tổ chức giải mới.
      </AdminModal>

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

export default OwnerBranchListPage;
