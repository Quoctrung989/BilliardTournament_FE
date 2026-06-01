import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { getCatalog, getCatalogItem } from "../../../api/adminConfigFieldApi";
import AdminCard from "../../../components/admin/ui/AdminCard";
import AdminPagination from "../../../components/admin/ui/AdminPagination";
import { getApiErrorMessage } from "../../../utils/apiError";
import { buildListParams, DEFAULT_PAGE_SIZE } from "../../../utils/pagination";

const ConfigFieldCatalogPage = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [scope, setScope] = useState("");
  const [scopeInput, setScopeInput] = useState("");
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const loadCatalog = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getCatalog(
        buildListParams({
          page,
          size: pageSize,
          isActive: true,
          ...(scope ? { scope } : {}),
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
  }, [page, pageSize, scope]);

  useEffect(() => {
    loadCatalog();
  }, [loadCatalog]);

  const applyScopeFilter = () => {
    setScope(scopeInput.trim());
    setPage(0);
  };

  const openDetail = async (fieldKey) => {
    setDetailLoading(true);
    setDetail({ fieldKey });
    try {
      const data = await getCatalogItem(fieldKey);
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
      <p className="text-sm text-slate-600">
        Catalog chỉ đọc — Admin không tạo/sửa định nghĩa field trên UI.
      </p>
      <div className="flex flex-col sm:flex-row gap-2 max-w-xl">
        <div className="flex-1">
          <label className="admin-label">Scope (tùy chọn)</label>
          <input
            className="admin-input"
            placeholder="COMMON,KNOCKOUT,..."
            value={scopeInput}
            onChange={(e) => setScopeInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && applyScopeFilter()}
          />
        </div>
        <button
          type="button"
          className="admin-btn admin-btn-secondary self-end h-10 px-4"
          onClick={applyScopeFilter}
        >
          Lọc
        </button>
      </div>

      <AdminCard padding={false}>
        <div className="admin-table-wrap">
          {loading ? (
            <div className="admin-empty">Đang tải catalog...</div>
          ) : items.length === 0 ? (
            <div className="admin-empty">Không có field phù hợp bộ lọc.</div>
          ) : (
            <table className="admin-table">
              <colgroup>
                <col style={{ width: "28%" }} />
                <col style={{ width: "28%" }} />
                <col style={{ width: "22%" }} />
                <col style={{ width: "22%" }} />
              </colgroup>
              <thead>
                <tr>
                  <th>fieldKey</th>
                  <th>label</th>
                  <th>uiComponent</th>
                  <th>scope</th>
                </tr>
              </thead>
              <tbody>
                {items.map((row) => (
                  <tr
                    key={row.fieldKey}
                    className="cursor-pointer"
                    onClick={() => openDetail(row.fieldKey)}
                  >
                    <td>
                      <code className="admin-table-code">{row.fieldKey}</code>
                    </td>
                    <td>
                      <span className="admin-table-name">{row.label}</span>
                    </td>
                    <td>
                      <span className="text-slate-600">{row.uiComponent}</span>
                    </td>
                    <td>
                      <span className="text-slate-500 text-sm">{row.scope}</span>
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

      {detail && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setDetail(null)}
            role="presentation"
          />
          <div className="relative w-full max-w-md admin-card h-full shadow-2xl p-6 overflow-y-auto rounded-none sm:rounded-l-xl">
            <button
              type="button"
              className="text-sm text-gray-500 mb-4"
              onClick={() => setDetail(null)}
            >
              Đóng
            </button>
            {detailLoading ? (
              <p className="animate-pulse text-gray-400">Đang tải chi tiết...</p>
            ) : (
              <div className="space-y-3 text-sm">
                <h3 className="text-lg font-semibold text-slate-800">
                  {detail.label || detail.fieldKey}
                </h3>
                {[
                  ["fieldKey", detail.fieldKey],
                  ["uiComponent", detail.uiComponent],
                  ["scope", detail.scope],
                  ["description", detail.description],
                  ["isActive", String(detail.isActive)],
                  ["enumOptions", (detail.enumOptions || []).join(", ")],
                  ["minValue", detail.minValue],
                  ["maxValue", detail.maxValue],
                ].map(([label, value]) =>
                  value !== undefined && value !== "" ? (
                    <div key={label}>
                      <span className="text-gray-500 text-xs uppercase">{label}</span>
                      <p className="mt-0.5">{value}</p>
                    </div>
                  ) : null
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ConfigFieldCatalogPage;
