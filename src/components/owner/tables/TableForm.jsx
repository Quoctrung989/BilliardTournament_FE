import { useEffect, useState } from "react";
import { ownerBranchApi } from "../../../api/branchApi";
import { TABLE_TYPE_OPTIONS } from "../../../constants/tableConfig";

const TableForm = ({ form, errors = {}, onChange, formId = "table-form", onSubmit }) => {
  const [branches, setBranches] = useState([]);

  useEffect(() => {
    ownerBranchApi
      .listBranches({ status: "ACTIVE", size: 100 })
      .then((res) => setBranches(res.content || []))
      .catch(() => setBranches([]));
  }, []);

  return (
    <form id={formId} onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className="admin-label">Tên bàn *</label>
          <input
            className="admin-input mt-1"
            placeholder="VD: Bàn 1, Bàn VIP A"
            value={form.name}
            onChange={(e) => onChange({ name: e.target.value })}
          />
          {errors.name && <p className="text-xs text-rose-600 mt-1">{errors.name}</p>}
        </div>

        <div>
          <label className="admin-label">Số hiển thị</label>
          <input
            type="number"
            min="1"
            className="admin-input mt-1"
            placeholder="VD: 1"
            value={form.tableNumber}
            onChange={(e) => onChange({ tableNumber: e.target.value })}
          />
        </div>

        <div>
          <label className="admin-label">Loại bàn</label>
          <select
            className="admin-select mt-1 w-full"
            value={form.tableType}
            onChange={(e) => onChange({ tableType: e.target.value })}
          >
            <option value="">Không xác định</option>
            {TABLE_TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-2">
          <label className="admin-label">Chi nhánh</label>
          <select
            className="admin-select mt-1 w-full"
            value={form.branchId}
            onChange={(e) => onChange({ branchId: e.target.value })}
          >
            <option value="">Dùng chung cả chuỗi</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>
      </div>
    </form>
  );
};

export const validateTableForm = (form) => {
  const errors = {};
  if (!form.name?.trim()) errors.name = "Tên bàn là bắt buộc";

  if (Object.keys(errors).length > 0) return { errors };

  const body = {
    name: form.name.trim(),
    tableNumber: form.tableNumber ? Number(form.tableNumber) : null,
    tableType: form.tableType || null,
    branchId: form.branchId ? Number(form.branchId) : null,
    ...(form.branchId ? {} : { clearBranch: true }),
  };

  return { body, errors: null };
};

export default TableForm;
