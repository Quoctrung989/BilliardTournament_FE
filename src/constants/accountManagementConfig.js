import * as adminAccountApi from "../api/adminAccountApi";
import * as ownerEmployeeApi from "../api/ownerEmployeeApi";
import * as managerEmployeeApi from "../api/managerEmployeeApi";
import { ownerBranchApi, managerBranchApi } from "../api/branchApi";
import { ADMIN_ROLE_FILTER, OWNER_ROLE_FILTER } from "./accountConfig";

export const ADMIN_ACCOUNT_CONFIG = {
  mode: "admin",
  listAccounts: adminAccountApi.getAccounts,
  createAdmin: adminAccountApi.createAdmin,
  createOwner: adminAccountApi.createOwner,
  deactivateAccount: adminAccountApi.deactivateAccount,
  getEmployeeDetail: null,
  roleFilterOptions: ADMIN_ROLE_FILTER,
  createActions: ["admin", "owner"],
  pageTitle: "Quản lý tài khoản",
  emptyMessage: "Chưa có tài khoản phù hợp bộ lọc.",
  searchPlaceholder: "Tìm họ tên hoặc email…",
};

export const OWNER_EMPLOYEE_CONFIG = {
  mode: "owner",
  listAccounts: ownerEmployeeApi.getEmployees,
  createManager: ownerEmployeeApi.createManager,
  createStaff: ownerEmployeeApi.createStaff,
  deactivateAccount: ownerEmployeeApi.deactivateEmployee,
  getEmployeeDetail: ownerEmployeeApi.getEmployee,
  listBranches: ownerBranchApi.listBranches,
  updateEmployee: ownerEmployeeApi.updateEmployee,
  roleFilterOptions: OWNER_ROLE_FILTER,
  createActions: ["manager", "staff"],
  pageTitle: "Quản lý nhân viên",
  emptyMessage: "Chưa có Manager hoặc Staff.",
  searchPlaceholder: "Tìm tên hiển thị, họ tên hoặc email…",
};

export const MANAGER_STAFF_CONFIG = {
  mode: "manager",
  listAccounts: managerEmployeeApi.getStaffs,
  createStaff: managerEmployeeApi.createStaff,
  deactivateAccount: managerEmployeeApi.deactivateStaff,
  getEmployeeDetail: managerEmployeeApi.getEmployee,
  listBranches: managerBranchApi.listBranches,
  roleFilterOptions: null,
  createActions: ["staff"],
  pageTitle: "Quản lý nhân viên",
  emptyMessage: "Chưa có Staff trong hệ thống.",
  searchPlaceholder: "Tìm họ tên hoặc email…",
};
