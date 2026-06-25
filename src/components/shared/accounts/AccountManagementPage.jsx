import { useCallback, useEffect, useState } from "react";
import { Eye, Plus, Search, UserPlus } from "lucide-react";
import { toast } from "react-toastify";
import AdminButton from "../../admin/ui/AdminButton";
import AdminCard from "../../admin/ui/AdminCard";
import AdminModal from "../../admin/ui/AdminModal";
import AdminPagination from "../../admin/ui/AdminPagination";
import AccountDetail from "./AccountDetail";
import RoleBadge from "./RoleBadge";
import ImageUploader from "../ImageUploader";
import { ACCOUNT_STATUS_LABELS, GENDER_OPTIONS } from "../../../constants/accountConfig";
import { getApiErrorMessage } from "../../../utils/apiError";
import { buildListParams, DEFAULT_PAGE_SIZE } from "../../../utils/pagination";

const EMPTY_SIMPLE_ACCOUNT_FORM = { email: "", password: "", phone: "" };

const EMPTY_EMPLOYEE_FORM = {
  email: "",
  password: "",
  fullName: "",
  phone: "",
  displayName: "",
  avatarUrl: "",
  dateOfBirth: "",
  gender: "",
  bio: "",
};

const AvatarCell = ({ row }) => {
  const name = row.fullName || row.displayName || row.email || "?";
  const initial = name.charAt(0).toUpperCase();
  if (row.avatarUrl) {
    return (
      <img
        src={row.avatarUrl}
        alt=""
        className="h-9 w-9 rounded-full object-cover ring-2 ring-white shadow"
      />
    );
  }
  return (
    <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 text-sm font-semibold">
      {initial}
    </span>
  );
};

const AccountManagementPage = ({ config }) => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [roleFilter, setRoleFilter] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  const [createType, setCreateType] = useState(null);
  const [simpleAccountForm, setSimpleAccountForm] = useState(EMPTY_SIMPLE_ACCOUNT_FORM);
  const [employeeForm, setEmployeeForm] = useState(EMPTY_EMPLOYEE_FORM);
  const [saving, setSaving] = useState(false);

  const [confirmDeactivate, setConfirmDeactivate] = useState(null);
  const [detailTarget, setDetailTarget] = useState(null);
  const [detailData, setDetailData] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const loadAccounts = useCallback(async () => {
    setLoading(true);
    try {
      const params = buildListParams({
        page,
        size: pageSize,
        ...(roleFilter ? { role: roleFilter } : {}),
        ...(search ? { search } : {}),
      });
      const result = await config.listAccounts(params);
      setAccounts(result.content);
      setTotalElements(result.totalElements);
      setTotalPages(result.totalPages);
      if (result.page !== page) setPage(result.page);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [config, page, pageSize, roleFilter, search]);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSearch(searchInput.trim());
    setPage(0);
  };

  const openCreate = (type) => {
    setCreateType(type);
    setSimpleAccountForm(EMPTY_SIMPLE_ACCOUNT_FORM);
    setEmployeeForm(EMPTY_EMPLOYEE_FORM);
  };

  const closeCreate = () => {
    setCreateType(null);
    setSaving(false);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const isSimpleAccount = createType === "admin" || createType === "owner";
      if (isSimpleAccount) {
        const body = {
          email: simpleAccountForm.email.trim(),
          password: simpleAccountForm.password,
          ...(simpleAccountForm.phone.trim() ? { phone: simpleAccountForm.phone.trim() } : {}),
        };
        if (createType === "admin") {
          await config.createAdmin(body);
          toast.success("Đã tạo tài khoản Admin");
        } else {
          await config.createOwner(body);
          toast.success("Đã tạo tài khoản Owner");
        }
      } else {
        const body = {
          email: employeeForm.email.trim(),
          password: employeeForm.password,
          fullName: employeeForm.fullName.trim(),
        };
        ["phone", "displayName", "avatarUrl", "dateOfBirth", "gender", "bio"].forEach((key) => {
          const val = employeeForm[key];
          if (val != null && String(val).trim() !== "") body[key] = String(val).trim();
        });

        if (createType === "manager") {
          await config.createManager(body);
          toast.success("Đã tạo tài khoản Manager");
        } else {
          await config.createStaff(body);
          toast.success("Đã tạo tài khoản Staff");
        }
      }
      closeCreate();
      loadAccounts();
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async () => {
    if (!confirmDeactivate) return;
    setSaving(true);
    try {
      await config.deactivateAccount(confirmDeactivate.id);
      toast.success("Đã vô hiệu hóa tài khoản");
      setConfirmDeactivate(null);
      loadAccounts();
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const openDetail = async (row) => {
    setDetailTarget(row);
    if (!config.getEmployeeDetail) {
      setDetailData(row);
      return;
    }
    setDetailLoading(true);
    setDetailData(null);
    try {
      const data = await config.getEmployeeDetail(row.id);
      setDetailData(data);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
      setDetailTarget(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetail = () => {
    setDetailTarget(null);
    setDetailData(null);
  };

  const handleToggle = (row) => {
    if (row.status !== "ACTIVE") return;
    setConfirmDeactivate(row);
  };

  const isSimpleAccountForm = createType === "admin" || createType === "owner";

  const createModalTitle =
    createType === "admin"
      ? "Tạo tài khoản Admin"
      : createType === "owner"
        ? "Tạo tài khoản Owner"
        : createType === "manager"
          ? "Tạo tài khoản Manager"
          : "Tạo tài khoản Staff";

  return (
    <div className="space-y-6">
      <AdminCard padding={false}>
        <div className="p-5 flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b border-slate-100">
          <div className="flex flex-wrap gap-4 flex-1 min-w-0">
            <form
              onSubmit={handleSearchSubmit}
              className="flex-1 min-w-[220px] max-w-xl"
            >
              <label className="admin-label" htmlFor="account-search">
                Tìm kiếm
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1 min-w-0">
                  <Search
                    size={16}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    id="account-search"
                    className="admin-input w-full pl-9"
                    placeholder={config.searchPlaceholder}
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                  />
                </div>
                <AdminButton type="submit" variant="secondary" className="shrink-0">
                  Tìm
                </AdminButton>
              </div>
            </form>

            {config.roleFilterOptions && (
              <div className="w-full sm:w-48 shrink-0">
                <label className="admin-label" htmlFor="account-role-filter">
                  Vai trò
                </label>
                <select
                  id="account-role-filter"
                  className="admin-select w-full"
                  value={roleFilter}
                  onChange={(e) => {
                    setRoleFilter(e.target.value);
                    setPage(0);
                  }}
                >
                  {config.roleFilterOptions.map((opt) => (
                    <option key={opt.value || "all"} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2 shrink-0 lg:pb-0.5">
            {config.createActions.includes("admin") && (
              <AdminButton onClick={() => openCreate("admin")}>
                <UserPlus size={18} />
                Tạo Admin
              </AdminButton>
            )}
            {config.createActions.includes("owner") && (
              <AdminButton variant="secondary" onClick={() => openCreate("owner")}>
                <UserPlus size={18} />
                Tạo Owner
              </AdminButton>
            )}
            {config.createActions.includes("manager") && (
              <AdminButton onClick={() => openCreate("manager")}>
                <Plus size={18} />
                Tạo Manager
              </AdminButton>
            )}
            {config.createActions.includes("staff") && (
              <AdminButton
                variant={config.createActions.includes("manager") ? "secondary" : "primary"}
                onClick={() => openCreate("staff")}
              >
                <Plus size={18} />
                Tạo Staff
              </AdminButton>
            )}
          </div>
        </div>

        <div className="admin-table-wrap">
          {loading ? (
            <div className="admin-empty">
              <div className="admin-skeleton h-4 w-48 mx-auto mb-2" />
              <div className="admin-skeleton h-3 w-32 mx-auto" />
            </div>
          ) : accounts.length === 0 ? (
            <div className="admin-empty">{config.emptyMessage}</div>
          ) : (
            <table className="admin-table">
              <colgroup>
                <col style={{ width: "6%" }} />
                <col style={{ width: "18%" }} />
                <col style={{ width: "22%" }} />
                <col style={{ width: "12%" }} />
                <col style={{ width: "8%" }} />
                <col style={{ width: "14%" }} />
                <col style={{ width: "10%" }} />
                <col style={{ width: "10%" }} />
              </colgroup>
              <thead>
                <tr>
                  <th className="align-center">Ảnh</th>
                  <th>Họ tên</th>
                  <th>Email</th>
                  <th className="align-center">Vai trò</th>
                  <th className="align-center">Kích hoạt</th>
                  <th className="align-center">Trạng thái</th>
                  <th>SĐT</th>
                  <th className="align-right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {accounts.map((row) => {
                  const isActive = row.status === "ACTIVE";
                  return (
                    <tr key={row.id}>
                      <td className="align-center">
                        <AvatarCell row={row} />
                      </td>
                      <td>
                        <span className="admin-table-name" title={row.fullName || row.displayName}>
                          {row.fullName || row.displayName || "—"}
                        </span>
                        {row.displayName && row.fullName && (
                          <span className="block text-xs text-slate-500 truncate">
                            @{row.displayName}
                          </span>
                        )}
                      </td>
                      <td>
                        <span className="text-slate-700 truncate block" title={row.email}>
                          {row.email}
                        </span>
                      </td>
                      <td className="align-center">
                        <RoleBadge role={row.role} />
                      </td>
                      <td className="align-center">
                        <span className="admin-table-toggle-wrap">
                          <button
                            type="button"
                            role="switch"
                            aria-checked={isActive}
                            className={`admin-toggle ${!isActive ? "opacity-60 cursor-not-allowed" : ""}`}
                            data-on={isActive}
                            onClick={() => handleToggle(row)}
                            title={isActive ? "Nhấn để khóa tài khoản" : "Tài khoản đã bị khóa"}
                          >
                            <span className="admin-toggle-knob" />
                          </button>
                        </span>
                      </td>
                      <td className="align-center">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ring-1 ${
                            isActive
                              ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                              : row.status === "LOCKED"
                                ? "bg-rose-50 text-rose-700 ring-rose-200"
                                : row.status === "PENDING"
                                  ? "bg-amber-50 text-amber-700 ring-amber-200"
                                  : "bg-slate-100 text-slate-600 ring-slate-200"
                          }`}
                        >
                          {ACCOUNT_STATUS_LABELS[row.status] ?? row.status}
                        </span>
                      </td>
                      <td>
                        <span className="text-slate-600">{row.phone || "—"}</span>
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

      {/* Create modal */}
      <AdminModal
        open={!!createType}
        onClose={closeCreate}
        title={createModalTitle}
        size={isSimpleAccountForm ? "md" : "lg"}
        footer={
          <>
            <AdminButton variant="secondary" onClick={closeCreate} disabled={saving}>
              Hủy
            </AdminButton>
            <AdminButton
              type="submit"
              form={isSimpleAccountForm ? "create-simple-account-form" : "create-employee-form"}
              disabled={saving}
            >
              {saving ? "Đang lưu…" : "Tạo tài khoản"}
            </AdminButton>
          </>
        }
      >
        {isSimpleAccountForm ? (
          <form id="create-simple-account-form" onSubmit={handleCreateSubmit} className="space-y-3">
            <div>
              <label className="admin-label">Email *</label>
              <input
                type="email"
                required
                className="admin-input mt-1"
                value={simpleAccountForm.email}
                onChange={(e) =>
                  setSimpleAccountForm({ ...simpleAccountForm, email: e.target.value })
                }
              />
            </div>
            <div>
              <label className="admin-label">Mật khẩu * (6–100 ký tự)</label>
              <input
                type="password"
                required
                minLength={6}
                maxLength={100}
                className="admin-input mt-1"
                value={simpleAccountForm.password}
                onChange={(e) =>
                  setSimpleAccountForm({ ...simpleAccountForm, password: e.target.value })
                }
              />
            </div>
            <div>
              <label className="admin-label">Số điện thoại</label>
              <input
                type="tel"
                className="admin-input mt-1"
                value={simpleAccountForm.phone}
                onChange={(e) =>
                  setSimpleAccountForm({ ...simpleAccountForm, phone: e.target.value })
                }
              />
            </div>
          </form>
        ) : (
          <form id="create-employee-form" onSubmit={handleCreateSubmit} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="admin-label">Email *</label>
                <input
                  type="email"
                  required
                  className="admin-input mt-1"
                  value={employeeForm.email}
                  onChange={(e) => setEmployeeForm({ ...employeeForm, email: e.target.value })}
                />
              </div>
              <div>
                <label className="admin-label">Mật khẩu *</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  className="admin-input mt-1"
                  value={employeeForm.password}
                  onChange={(e) => setEmployeeForm({ ...employeeForm, password: e.target.value })}
                />
              </div>
              <div>
                <label className="admin-label">Họ tên *</label>
                <input
                  required
                  className="admin-input mt-1"
                  value={employeeForm.fullName}
                  onChange={(e) => setEmployeeForm({ ...employeeForm, fullName: e.target.value })}
                />
              </div>
              <div>
                <label className="admin-label">Tên hiển thị</label>
                <input
                  className="admin-input mt-1"
                  value={employeeForm.displayName}
                  onChange={(e) =>
                    setEmployeeForm({ ...employeeForm, displayName: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="admin-label">Số điện thoại</label>
                <input
                  type="tel"
                  className="admin-input mt-1"
                  value={employeeForm.phone}
                  onChange={(e) => setEmployeeForm({ ...employeeForm, phone: e.target.value })}
                />
              </div>
              <div>
                <label className="admin-label">Ngày sinh</label>
                <input
                  type="date"
                  className="admin-input mt-1"
                  value={employeeForm.dateOfBirth}
                  onChange={(e) =>
                    setEmployeeForm({ ...employeeForm, dateOfBirth: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="admin-label">Giới tính</label>
                <select
                  className="admin-select mt-1"
                  value={employeeForm.gender}
                  onChange={(e) => setEmployeeForm({ ...employeeForm, gender: e.target.value })}
                >
                  {GENDER_OPTIONS.map((g) => (
                    <option key={g.value || "none"} value={g.value}>
                      {g.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <ImageUploader
                  label="Ảnh đại diện"
                  folder="avatars"
                  previewUrl={employeeForm.avatarUrl}
                  aspectClass="h-28 w-28 rounded-full"
                  onUpload={({ objectKey }) =>
                    setEmployeeForm({ ...employeeForm, avatarUrl: objectKey })
                  }
                />
              </div>
              <div className="sm:col-span-2">
                <label className="admin-label">Giới thiệu</label>
                <textarea
                  rows={2}
                  className="admin-input mt-1"
                  value={employeeForm.bio}
                  onChange={(e) => setEmployeeForm({ ...employeeForm, bio: e.target.value })}
                />
              </div>
            </div>
          </form>
        )}
      </AdminModal>

      {/* Deactivate confirm */}
      <AdminModal
        open={!!confirmDeactivate}
        onClose={() => !saving && setConfirmDeactivate(null)}
        title="Vô hiệu hóa tài khoản?"
        footer={
          <>
            <AdminButton
              variant="secondary"
              onClick={() => setConfirmDeactivate(null)}
              disabled={saving}
            >
              Hủy
            </AdminButton>
            <AdminButton variant="danger" onClick={handleDeactivate} disabled={saving}>
              {saving ? "Đang xử lý…" : "Xác nhận khóa"}
            </AdminButton>
          </>
        }
      >
        Tài khoản{" "}
        <strong>{confirmDeactivate?.fullName || confirmDeactivate?.email}</strong> sẽ chuyển sang
        trạng thái <strong>LOCKED</strong> và không thể đăng nhập.
      </AdminModal>

      {/* Detail modal */}
      <AdminModal
        open={!!detailTarget}
        onClose={closeDetail}
        title="Chi tiết tài khoản"
        size="lg"
        footer={
          <AdminButton variant="secondary" onClick={closeDetail}>
            Đóng
          </AdminButton>
        }
      >
        <AccountDetail item={detailData} loading={detailLoading} />
      </AdminModal>
    </div>
  );
};

export default AccountManagementPage;
