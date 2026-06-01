import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { getGameTypes, updateGameType } from "../../../api/adminGameTypeApi";
import AdminButton from "../../../components/admin/ui/AdminButton";
import AdminCard from "../../../components/admin/ui/AdminCard";
import AdminModal from "../../../components/admin/ui/AdminModal";
import AdminPagination from "../../../components/admin/ui/AdminPagination";
import { getApiErrorMessage } from "../../../utils/apiError";
import { buildListParams, DEFAULT_PAGE_SIZE } from "../../../utils/pagination";

const GameTypeListPage = () => {
  const [gameTypes, setGameTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    defaultRaceTo: 1,
    isActive: true,
  });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getGameTypes(buildListParams({ page, size: pageSize }));
      setGameTypes(result.content);
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

  const openEdit = (row) => {
    setEditing(row);
    setForm({
      name: row.name || "",
      description: row.description || "",
      defaultRaceTo: row.defaultRaceTo ?? 1,
      isActive: row.isActive !== false,
    });
  };

  const handleSave = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      await updateGameType(editing.code, form);
      toast.success("Cập nhật loại bi thành công");
      setEditing(null);
      load();
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <AdminCard padding={false}>
        <div className="admin-table-wrap">
          {loading ? (
            <div className="admin-empty">Đang tải...</div>
          ) : gameTypes.length === 0 ? (
            <div className="admin-empty">Chưa có loại bi.</div>
          ) : (
            <table className="admin-table">
              <colgroup>
                <col style={{ width: "14%" }} />
                <col style={{ width: "18%" }} />
                <col style={{ width: "36%" }} />
                <col style={{ width: "12%" }} />
                <col style={{ width: "10%" }} />
                <col style={{ width: "10%" }} />
              </colgroup>
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Tên</th>
                  <th>Mô tả</th>
                  <th className="align-center">Race-to</th>
                  <th className="align-center">Active</th>
                  <th className="align-right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {gameTypes.map((row) => (
                  <tr key={row.code}>
                    <td>
                      <code className="admin-table-code">{row.code}</code>
                    </td>
                    <td>
                      <span className="admin-table-name">{row.name}</span>
                    </td>
                    <td>
                      <span className="block text-slate-600 truncate" title={row.description}>
                        {row.description || "—"}
                      </span>
                    </td>
                    <td className="align-center">
                      <span className="admin-table-num">{row.defaultRaceTo}</span>
                    </td>
                    <td className="align-center">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
                          row.isActive
                            ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
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
                          onClick={() => openEdit(row)}
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
        open={!!editing}
        onClose={() => setEditing(null)}
        title={`Sửa loại bi: ${editing?.code || ""}`}
        footer={
          <>
            <AdminButton variant="secondary" onClick={() => setEditing(null)}>
              Hủy
            </AdminButton>
            <AdminButton onClick={handleSave} disabled={saving}>
              {saving ? "Đang lưu..." : "Lưu"}
            </AdminButton>
          </>
        }
      >
        <div className="space-y-3">
          <div>
            <label className="admin-label">Tên</label>
            <input
              className="admin-input mt-1"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div>
            <label className="admin-label">Mô tả</label>
            <textarea
              className="admin-input mt-1"
              rows={2}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div>
            <label className="admin-label">defaultRaceTo</label>
            <input
              type="number"
              min={1}
              className="admin-input mt-1"
              value={form.defaultRaceTo}
              onChange={(e) =>
                setForm({ ...form, defaultRaceTo: Number(e.target.value) })
              }
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
            />
            isActive
          </label>
        </div>
      </AdminModal>
    </div>
  );
};

export default GameTypeListPage;
