import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, Eye, Pencil, Plus, Search, UserPlus, X } from "lucide-react";
import { toast } from "react-toastify";
import AdminButton from "../../admin/ui/AdminButton";
import AdminCard from "../../admin/ui/AdminCard";
import AdminModal from "../../admin/ui/AdminModal";
import AdminPagination from "../../admin/ui/AdminPagination";
import AccountDetail from "./AccountDetail";
import RoleBadge from "./RoleBadge";
import { ACCOUNT_STATUS_LABELS, GENDER_OPTIONS } from "../../../constants/accountConfig";
import { getApiErrorMessage } from "../../../utils/apiError";
import { buildListParams, DEFAULT_PAGE_SIZE } from "../../../utils/pagination";

const EMPTY_SIMPLE_ACCOUNT_FORM = { email: "", password: "", phone: "" };

const getTodayStr = () => new Date().toISOString().slice(0, 10);

const futureDateOfBirthError = (value) =>
  value && value > getTodayStr() ? "Ngày sinh không được là ngày trong tương lai" : "";

const EMPTY_EMPLOYEE_FORM = {
  email: "",
  password: "",
  fullName: "",
  phone: "",
  displayName: "",
  dateOfBirth: "",
  gender: "",
  bio: "",
  manageAllBranches: true,
  branchIds: [],
  branchId: "",
};

/** Radio "toàn chuỗi" / "theo chi nhánh cụ thể" + tìm kiếm & tích chọn chi nhánh — dùng chung
 * cho form tạo Manager và form sửa thông tin Manager đã tồn tại. */
const BranchAssignmentFields = ({ value, onChange, branchOptions }) => {
  const [branchSearch, setBranchSearch] = useState("");

  const toggleBranch = (id) => {
    const set = new Set(value.branchIds || []);
    if (set.has(id)) set.delete(id);
    else set.add(id);
    onChange({ ...value, branchIds: [...set] });
  };

  const keyword = branchSearch.trim().toLowerCase();
  const filteredBranches = keyword
    ? branchOptions.filter((b) => b.name.toLowerCase().includes(keyword))
    : branchOptions;
  const selectedBranches = branchOptions.filter((b) => (value.branchIds || []).includes(b.id));

  return (
    <div className="sm:col-span-2 pt-3 border-t border-slate-100 dark:border-white/10">
      <label className="admin-label">Phạm vi quản lý chi nhánh</label>
      <div className="mt-2 space-y-2">
        <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-white/80">
          <input
            type="radio"
            checked={value.manageAllBranches}
            onChange={() => onChange({ ...value, manageAllBranches: true })}
          />
          Toàn chuỗi (tất cả chi nhánh, kể cả chi nhánh tạo sau này)
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-white/80">
          <input
            type="radio"
            checked={!value.manageAllBranches}
            onChange={() => onChange({ ...value, manageAllBranches: false })}
          />
          Theo chi nhánh cụ thể
        </label>
      </div>

      {!value.manageAllBranches && (
        <div className="mt-2 space-y-2">
          {selectedBranches.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {selectedBranches.map((b) => (
                <span
                  key={b.id}
                  className="inline-flex items-center gap-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-medium pl-2.5 pr-1.5 py-1 ring-1 ring-indigo-200"
                >
                  {b.name}
                  <button
                    type="button"
                    onClick={() => toggleBranch(b.id)}
                    className="text-indigo-500 hover:text-indigo-700"
                    aria-label={`Bỏ chọn ${b.name}`}
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
          )}

          <div className="relative">
            <Search
              size={14}
              className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-white/40"
            />
            <input
              className="admin-input w-full pl-8 text-sm"
              placeholder="Tìm chi nhánh theo tên..."
              value={branchSearch}
              onChange={(e) => setBranchSearch(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-0.5 p-2 rounded-lg border border-slate-100 dark:border-white/10 bg-slate-50/80 dark:bg-white/5 max-h-40 overflow-y-auto">
            {branchOptions.length === 0 ? (
              <p className="text-xs text-slate-500 dark:text-white/60 px-1">Chưa có chi nhánh nào. Tạo chi nhánh trước ở mục &quot;Chi nhánh&quot;.</p>
            ) : filteredBranches.length === 0 ? (
              <p className="text-xs text-slate-500 dark:text-white/60 px-1">Không tìm thấy chi nhánh phù hợp.</p>
            ) : (
              filteredBranches.map((b) => (
                <label
                  key={b.id}
                  className="flex items-center gap-2 text-sm text-slate-700 dark:text-white/80 px-1.5 py-1 rounded hover:bg-white dark:hover:bg-white/10 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={(value.branchIds || []).includes(b.id)}
                    onChange={() => toggleBranch(b.id)}
                  />
                  {b.name}
                </label>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

/** Tìm & chọn 1 chi nhánh làm việc cho Staff — cùng kiểu giao diện với BranchAssignmentFields
 * của Manager (ô tìm kiếm + danh sách), nhưng chỉ cho chọn đúng 1 chi nhánh (radio). */
const StaffBranchField = ({ value, onChange, branchOptions }) => {
  const [branchSearch, setBranchSearch] = useState("");

  const keyword = branchSearch.trim().toLowerCase();
  const filteredBranches = keyword
    ? branchOptions.filter((b) => b.name.toLowerCase().includes(keyword))
    : branchOptions;
  const selectedBranch = branchOptions.find((b) => String(b.id) === String(value.branchId));

  const selectBranch = (id) => {
    onChange({ branchId: String(value.branchId) === String(id) ? "" : String(id) });
  };

  return (
    <div className="sm:col-span-2 pt-3 border-t border-slate-100 dark:border-white/10">
      <label className="admin-label">Chi nhánh làm việc (tùy chọn)</label>

      <div className="mt-2 space-y-2">
        {selectedBranch && (
          <div className="flex flex-wrap gap-1.5">
            <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-medium pl-2.5 pr-1.5 py-1 ring-1 ring-indigo-200">
              {selectedBranch.name}
              <button
                type="button"
                onClick={() => onChange({ branchId: "" })}
                className="text-indigo-500 hover:text-indigo-700"
                aria-label={`Bỏ chọn ${selectedBranch.name}`}
              >
                <X size={12} />
              </button>
            </span>
          </div>
        )}

        <div className="relative">
          <Search
            size={14}
            className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-white/40"
          />
          <input
            className="admin-input w-full pl-8 text-sm"
            placeholder="Tìm chi nhánh theo tên..."
            value={branchSearch}
            onChange={(e) => setBranchSearch(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-0.5 p-2 rounded-lg border border-slate-100 dark:border-white/10 bg-slate-50/80 dark:bg-white/5 max-h-40 overflow-y-auto">
          {branchOptions.length === 0 ? (
            <p className="text-xs text-slate-500 dark:text-white/60 px-1">Chưa có chi nhánh nào. Tạo chi nhánh trước ở mục &quot;Chi nhánh&quot;.</p>
          ) : filteredBranches.length === 0 ? (
            <p className="text-xs text-slate-500 dark:text-white/60 px-1">Không tìm thấy chi nhánh phù hợp.</p>
          ) : (
            filteredBranches.map((b) => (
              <label
                key={b.id}
                className="flex items-center gap-2 text-sm text-slate-700 dark:text-white/80 px-1.5 py-1 rounded hover:bg-white dark:hover:bg-white/10 cursor-pointer"
              >
                <input
                  type="radio"
                  name="staff-branch"
                  checked={String(value.branchId) === String(b.id)}
                  onChange={() => selectBranch(b.id)}
                />
                {b.name}
              </label>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

/** Các trường hồ sơ dùng chung cho form tạo và form sửa (không gồm email/password). */
const EmployeeProfileFields = ({ form, errors = {}, onChange }) => (
  <>
    <div>
      <label className="admin-label">Họ tên *</label>
      <input
        required
        className="admin-input mt-1"
        value={form.fullName}
        onChange={(e) => onChange({ fullName: e.target.value })}
      />
    </div>
    <div>
      <label className="admin-label">Tên hiển thị</label>
      <input
        className="admin-input mt-1"
        value={form.displayName}
        onChange={(e) => onChange({ displayName: e.target.value })}
      />
    </div>
    <div>
      <label className="admin-label">Số điện thoại</label>
      <input
        type="tel"
        className="admin-input mt-1"
        value={form.phone}
        onChange={(e) => onChange({ phone: e.target.value })}
      />
    </div>
    <div>
      <label className="admin-label">Ngày sinh</label>
      <input
        type="date"
        max={getTodayStr()}
        className="admin-input mt-1"
        value={form.dateOfBirth}
        onChange={(e) => onChange({ dateOfBirth: e.target.value })}
      />
      {errors.dateOfBirth && <p className="text-xs text-rose-600 mt-1">{errors.dateOfBirth}</p>}
    </div>
    <div>
      <label className="admin-label">Giới tính</label>
      <select
        className="admin-select mt-1"
        value={form.gender}
        onChange={(e) => onChange({ gender: e.target.value })}
      >
        {GENDER_OPTIONS.map((g) => (
          <option key={g.value || "none"} value={g.value}>
            {g.label}
          </option>
        ))}
      </select>
    </div>
  </>
);

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

const BackToList = ({ onClick }) => (
  <button
    type="button"
    className="inline-flex items-center gap-1.5 text-sm text-indigo-600 hover:underline"
    onClick={onClick}
  >
    <ArrowLeft size={15} />
    Quay lại danh sách
  </button>
);

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
  const [employeeFormErrors, setEmployeeFormErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const [confirmDeactivate, setConfirmDeactivate] = useState(null);
  const [detailTarget, setDetailTarget] = useState(null);
  const [detailData, setDetailData] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [branchOptions, setBranchOptions] = useState([]);

  const [editTarget, setEditTarget] = useState(null);
  const [editForm, setEditForm] = useState(EMPTY_EMPLOYEE_FORM);
  const [editFormErrors, setEditFormErrors] = useState({});
  const [editSaving, setEditSaving] = useState(false);

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

  const loadBranchOptions = () => {
    if (!config.listBranches) return;
    config.listBranches({ page: 0, size: 100, status: "ACTIVE" })
      .then((result) => setBranchOptions(result.content))
      .catch((err) => toast.error(getApiErrorMessage(err)));
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSearch(searchInput.trim());
    setPage(0);
  };

  const openCreate = (type) => {
    setCreateType(type);
    setSimpleAccountForm(EMPTY_SIMPLE_ACCOUNT_FORM);
    setEmployeeForm(EMPTY_EMPLOYEE_FORM);
    setEmployeeFormErrors({});
    if (type === "manager" || type === "staff") loadBranchOptions();
  };

  const closeCreate = () => {
    setCreateType(null);
    setSaving(false);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    const isSimpleAccount = createType === "admin" || createType === "owner";
    if (!isSimpleAccount) {
      const dobError = futureDateOfBirthError(employeeForm.dateOfBirth);
      if (dobError) {
        setEmployeeFormErrors({ dateOfBirth: dobError });
        return;
      }
      setEmployeeFormErrors({});
    }
    setSaving(true);
    try {
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
        ["phone", "displayName", "dateOfBirth", "gender", "bio"].forEach((key) => {
          const val = employeeForm[key];
          if (val != null && String(val).trim() !== "") body[key] = String(val).trim();
        });

        if (createType === "manager") {
          body.manageAllBranches = employeeForm.manageAllBranches;
          if (!employeeForm.manageAllBranches) {
            body.branchIds = employeeForm.branchIds;
          }
          await config.createManager(body);
          toast.success("Đã tạo tài khoản Manager");
        } else {
          if (employeeForm.branchId) {
            body.branchId = Number(employeeForm.branchId);
          }
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
      setAccounts((prev) => prev.map((a) => (a.id === confirmDeactivate.id ? { ...a, status: "LOCKED" } : a)));
      toast.success("Đã vô hiệu hóa tài khoản");
      setConfirmDeactivate(null);
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

  const openEditInfo = (row) => {
    setEditTarget(row);
    setEditFormErrors({});
    setEditForm({
      ...EMPTY_EMPLOYEE_FORM,
      fullName: row.fullName || "",
      displayName: row.displayName || "",
      phone: row.phone || "",
      dateOfBirth: row.dateOfBirth || "",
      gender: row.gender || "",
      bio: row.bio || "",
      manageAllBranches: row.manageAllBranches !== false,
      branchIds: row.branchIds || [],
      branchId: row.branchId ? String(row.branchId) : "",
    });
    if (row.role === "MANAGER" || row.role === "STAFF") loadBranchOptions();
  };

  const closeEditInfo = () => {
    setEditTarget(null);
    setEditSaving(false);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editTarget) return;
    const dobError = futureDateOfBirthError(editForm.dateOfBirth);
    if (dobError) {
      setEditFormErrors({ dateOfBirth: dobError });
      return;
    }
    setEditFormErrors({});
    setEditSaving(true);
    try {
      const body = {
        fullName: editForm.fullName.trim(),
        phone: editForm.phone?.trim() || "",
        displayName: editForm.displayName?.trim() || "",
        dateOfBirth: editForm.dateOfBirth || null,
        gender: editForm.gender || "",
        bio: editForm.bio || "",
      };
      if (editTarget.role === "MANAGER") {
        body.manageAllBranches = editForm.manageAllBranches;
        if (!editForm.manageAllBranches) {
          body.branchIds = editForm.branchIds;
        }
      }
      if (editTarget.role === "STAFF" && editForm.branchId) {
        body.branchId = Number(editForm.branchId);
      }
      await config.updateEmployee(editTarget.id, body);
      const targetId = editTarget.id;
      setAccounts((prev) => prev.map((a) => (a.id === targetId ? { ...a, ...body } : a)));
      toast.success("Đã cập nhật thông tin nhân viên");
      closeEditInfo();
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setEditSaving(false);
    }
  };

  const isSimpleAccountForm = createType === "admin" || createType === "owner";

  const createScreenTitle =
    createType === "admin"
      ? "Tạo tài khoản Admin"
      : createType === "owner"
        ? "Tạo tài khoản Owner"
        : createType === "manager"
          ? "Tạo tài khoản Manager"
          : "Tạo tài khoản Staff";

  /* ── Màn tạo tài khoản (thay cho modal — nhiều field nên tách hẳn 1 màn) ── */
  if (createType) {
    return (
      <div className="space-y-4">
        <BackToList onClick={closeCreate} />
        <AdminCard title={createScreenTitle}>
          {isSimpleAccountForm ? (
            <form onSubmit={handleCreateSubmit} className="space-y-3 max-w-md">
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
              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-white/10">
                <AdminButton variant="secondary" onClick={closeCreate} disabled={saving}>
                  Hủy
                </AdminButton>
                <AdminButton type="submit" disabled={saving}>
                  {saving ? "Đang lưu…" : "Tạo tài khoản"}
                </AdminButton>
              </div>
            </form>
          ) : (
            <form onSubmit={handleCreateSubmit} className="space-y-3">
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
                <EmployeeProfileFields
                  form={employeeForm}
                  errors={employeeFormErrors}
                  onChange={(next) => setEmployeeForm({ ...employeeForm, ...next })}
                />
                {createType === "manager" && (
                  <BranchAssignmentFields
                    value={employeeForm}
                    onChange={(next) => setEmployeeForm({ ...employeeForm, ...next })}
                    branchOptions={branchOptions}
                  />
                )}
                {createType === "staff" && config.listBranches && (
                  <StaffBranchField
                    value={employeeForm}
                    onChange={(next) => setEmployeeForm({ ...employeeForm, ...next })}
                    branchOptions={branchOptions}
                  />
                )}
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
              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-white/10">
                <AdminButton variant="secondary" onClick={closeCreate} disabled={saving}>
                  Hủy
                </AdminButton>
                <AdminButton type="submit" disabled={saving}>
                  {saving ? "Đang lưu…" : "Tạo tài khoản"}
                </AdminButton>
              </div>
            </form>
          )}
        </AdminCard>
      </div>
    );
  }

  /* ── Màn sửa thông tin nhân viên (thay cho modal) ── */
  if (editTarget) {
    return (
      <div className="space-y-4">
        <BackToList onClick={closeEditInfo} />
        <AdminCard title="Sửa thông tin nhân viên">
          <form onSubmit={handleEditSubmit} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="admin-label">Email</label>
                <input className="admin-input mt-1 bg-slate-50 dark:bg-white/5" value={editTarget.email || ""} readOnly />
              </div>
              <EmployeeProfileFields
                form={editForm}
                errors={editFormErrors}
                onChange={(next) => setEditForm({ ...editForm, ...next })}
              />
              {editTarget.role === "MANAGER" && (
                <BranchAssignmentFields
                  value={editForm}
                  onChange={(next) => setEditForm({ ...editForm, ...next })}
                  branchOptions={branchOptions}
                />
              )}
              {editTarget.role === "STAFF" && config.listBranches && (
                <StaffBranchField
                  value={editForm}
                  onChange={(next) => setEditForm({ ...editForm, ...next })}
                  branchOptions={branchOptions}
                />
              )}
              <div className="sm:col-span-2">
                <label className="admin-label">Giới thiệu</label>
                <textarea
                  rows={2}
                  className="admin-input mt-1"
                  value={editForm.bio}
                  onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-white/10">
              <AdminButton variant="secondary" onClick={closeEditInfo} disabled={editSaving}>
                Hủy
              </AdminButton>
              <AdminButton type="submit" disabled={editSaving}>
                {editSaving ? "Đang lưu…" : "Lưu thay đổi"}
              </AdminButton>
            </div>
          </form>
        </AdminCard>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AdminCard padding={false}>
        <div className="p-5 flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b border-slate-100 dark:border-white/10">
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
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-white/40"
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
                <col style={{ width: "20%" }} />
                <col style={{ width: "10%" }} />
                <col style={{ width: "8%" }} />
                <col style={{ width: "12%" }} />
                <col style={{ width: "10%" }} />
                <col style={{ width: "16%" }} />
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
                          <span className="block text-xs text-slate-500 dark:text-white/60 truncate">
                            @{row.displayName}
                          </span>
                        )}
                      </td>
                      <td>
                        <span className="text-slate-700 dark:text-white/80 truncate block" title={row.email}>
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
                                  : "bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-white/70 ring-slate-200"
                          }`}
                        >
                          {ACCOUNT_STATUS_LABELS[row.status] ?? row.status}
                        </span>
                      </td>
                      <td>
                        <span className="text-slate-600 dark:text-white/70">{row.phone || "—"}</span>
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
                          {config.updateEmployee && (
                            <button
                              type="button"
                              className="admin-table-action admin-table-action--warning"
                              onClick={() => openEditInfo(row)}
                            >
                              <Pencil size={14} />
                              Sửa thông tin
                            </button>
                          )}
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
