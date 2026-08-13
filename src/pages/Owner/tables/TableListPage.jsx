import { useCallback, useEffect, useRef, useState } from "react";
import { Download, Plus, Search, Upload } from "lucide-react";
import { toast } from "react-toastify";
import { ownerTableApi } from "../../../api/tableApi";
import { ownerBranchApi } from "../../../api/branchApi";
import TableForm, { validateTableForm } from "../../../components/owner/tables/TableForm";
import AdminButton from "../../../components/admin/ui/AdminButton";
import AdminCard from "../../../components/admin/ui/AdminCard";
import AdminModal from "../../../components/admin/ui/AdminModal";
import AdminPagination from "../../../components/admin/ui/AdminPagination";
import { EMPTY_TABLE_FORM, TABLE_TYPE_LABELS } from "../../../constants/tableConfig";
import { getApiErrorMessage } from "../../../utils/apiError";
import { buildListParams, DEFAULT_PAGE_SIZE } from "../../../utils/pagination";

const detailToEditForm = (detail) => ({
  name: detail.name || "",
  tableNumber: detail.tableNumber != null ? String(detail.tableNumber) : "",
  tableType: detail.tableType || "",
  branchId: detail.branchId != null ? String(detail.branchId) : "",
});

const OwnerTableListPage = () => {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [statusFilter, setStatusFilter] = useState("");
  const [branchFilter, setBranchFilter] = useState("");
  const [branches, setBranches] = useState([]);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  const [formMode, setFormMode] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_TABLE_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [formLoading, setFormLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [confirmToggle, setConfirmToggle] = useState(null);

  const [importResult, setImportResult] = useState(null);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await ownerTableApi.listTables(
        buildListParams({
          page,
          size: pageSize,
          ...(statusFilter ? { status: statusFilter } : {}),
          ...(branchFilter ? { branchId: branchFilter } : {}),
          ...(search ? { search } : {}),
        })
      );
      setTables(result.content);
      setTotalElements(result.totalElements);
      setTotalPages(result.totalPages);
      if (result.page !== page) setPage(result.page);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, statusFilter, branchFilter, search]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    ownerBranchApi
      .listBranches({ status: "ACTIVE", size: 100 })
      .then((res) => setBranches(res.content || []))
      .catch(() => setBranches([]));
  }, []);

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
    setForm(EMPTY_TABLE_FORM);
    setFormErrors({});
    setFormMode("create");
  };

  const openEdit = async (row) => {
    setEditingId(row.id);
    setForm(EMPTY_TABLE_FORM);
    setFormErrors({});
    setFormMode("edit");
    setFormLoading(true);
    try {
      const data = await ownerTableApi.getTable(row.id);
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
    const { body, errors } = validateTableForm(form);
    if (errors) {
      setFormErrors(errors);
      return;
    }

    setSaving(true);
    try {
      if (formMode === "create") {
        await ownerTableApi.createTable(body);
        toast.success("Đã tạo bàn");
        closeForm();
        load(); // bàn mới — cần tải lại để đúng vị trí sắp xếp/tổng số trang
      } else {
        const updated = await ownerTableApi.updateTable(editingId, body);
        setTables((prev) => prev.map((t) => (t.id === editingId ? { ...t, ...updated } : t)));
        toast.success("Đã cập nhật bàn");
        closeForm();
      }
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
      const updated = await ownerTableApi.updateStatus(row.id, { status });
      setTables((prev) => prev.map((t) => (t.id === row.id ? { ...t, ...updated } : t)));
      toast.success(status === "ACTIVE" ? "Đã kích hoạt bàn" : "Đã ngừng hoạt động bàn");
      setConfirmToggle(null);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const result = await ownerTableApi.importExcel(file);
      setImportResult(result);
      load();
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const downloadTemplate = async () => {
    try {
      await ownerTableApi.downloadImportTemplate();
    } catch {
      toast.error("Tải mẫu thất bại");
    }
  };

  return (
    <div className="space-y-6">
      <AdminCard padding={false}>
        <div className="p-5 flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b border-slate-100 dark:border-white/10">
          <div className="flex flex-wrap gap-4 flex-1 min-w-0">
            <form onSubmit={handleSearchSubmit} className="flex-1 min-w-[220px] max-w-xl">
              <label className="admin-label">Tìm kiếm</label>
              <div className="flex gap-2">
                <div className="relative flex-1 min-w-0">
                  <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-white/40" />
                  <input
                    className="admin-input w-full pl-9"
                    placeholder="Tìm tên bàn…"
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

            <div className="w-full sm:w-56 shrink-0">
              <label className="admin-label">Chi nhánh</label>
              <select
                className="admin-select w-full"
                value={branchFilter}
                onChange={(e) => {
                  setBranchFilter(e.target.value);
                  setPage(0);
                }}
              >
                <option value="">Tất cả</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-2 flex-wrap shrink-0">
            <AdminButton variant="secondary" onClick={downloadTemplate} className="flex items-center gap-1.5">
              <Download size={15} />
              Tải mẫu
            </AdminButton>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={handleImport}
            />
            <AdminButton
              variant="secondary"
              disabled={importing}
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5"
            >
              <Upload size={15} />
              {importing ? "Đang import…" : "Import hàng loạt"}
            </AdminButton>
            <AdminButton onClick={openCreate} className="flex items-center gap-1.5">
              <Plus size={18} />
              Thêm bàn
            </AdminButton>
          </div>
        </div>

        <div className="admin-table-wrap">
          {loading ? (
            <div className="admin-empty">Đang tải...</div>
          ) : tables.length === 0 ? (
            <div className="admin-empty">Chưa có bàn nào. Dùng &quot;Thêm bàn&quot; hoặc &quot;Import hàng loạt&quot;.</div>
          ) : (
            <table className="admin-table">
              <colgroup>
                <col style={{ width: "28%" }} />
                <col style={{ width: "14%" }} />
                <col style={{ width: "16%" }} />
                <col style={{ width: "22%" }} />
                <col style={{ width: "10%" }} />
                <col style={{ width: "10%" }} />
              </colgroup>
              <thead>
                <tr>
                  <th>Tên bàn</th>
                  <th className="align-center">Số hiển thị</th>
                  <th>Loại bàn</th>
                  <th>Chi nhánh</th>
                  <th className="align-center">Trạng thái</th>
                  <th className="align-right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {tables.map((row) => {
                  const isActive = row.status === "ACTIVE";
                  return (
                    <tr key={row.id}>
                      <td>
                        <span className="admin-table-name" title={row.name}>{row.name}</span>
                      </td>
                      <td className="align-center">
                        <span className="text-slate-600 dark:text-white/70">{row.tableNumber ?? "—"}</span>
                      </td>
                      <td>
                        <span className="text-slate-600 dark:text-white/70">{TABLE_TYPE_LABELS[row.tableType] || "—"}</span>
                      </td>
                      <td>
                        <span className="text-slate-600 dark:text-white/70 truncate block" title={row.branchName}>
                          {row.branchName || "Dùng chung cả chuỗi"}
                        </span>
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

      {/* Import result */}
      {importResult && (
        <AdminCard>
          <div className="flex justify-between items-start">
            <div>
              <p className="font-semibold text-slate-900 dark:text-white mb-1">Kết quả import</p>
              <p className="text-sm text-slate-600 dark:text-white/70">
                ✓ Đã tạo: <strong>{importResult.imported}</strong> bàn ·
                Bỏ qua: <strong>{importResult.skipped}</strong>
              </p>
              {importResult.errors?.length > 0 && (
                <ul className="mt-2 text-xs text-red-600 space-y-0.5">
                  {importResult.errors.map((e, i) => <li key={i}>• {e}</li>)}
                </ul>
              )}
            </div>
            <button
              type="button"
              className="text-slate-400 dark:text-white/40 hover:text-slate-600 dark:hover:text-white/70 text-xs"
              onClick={() => setImportResult(null)}
            >
              Đóng
            </button>
          </div>
        </AdminCard>
      )}

      <AdminModal
        open={!!formMode}
        onClose={closeForm}
        title={formMode === "create" ? "Thêm bàn" : "Sửa bàn"}
        size="lg"
        footer={
          <>
            <AdminButton variant="secondary" onClick={closeForm} disabled={saving}>
              Hủy
            </AdminButton>
            <AdminButton type="submit" form="table-form" disabled={saving}>
              {saving ? "Đang lưu…" : formMode === "create" ? "Tạo bàn" : "Lưu thay đổi"}
            </AdminButton>
          </>
        }
      >
        {formLoading ? (
          <p className="text-slate-500 dark:text-white/60 py-6 text-center">Đang tải...</p>
        ) : (
          <TableForm
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
        title="Ngừng hoạt động bàn?"
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
        Bàn &quot;{confirmToggle?.name}&quot; sẽ không còn hiển thị trong danh sách chọn khi gán lịch thi đấu.
      </AdminModal>
    </div>
  );
};

export default OwnerTableListPage;
