import { useCallback, useEffect, useState } from "react";
import { Eye } from "lucide-react";
import { toast } from "react-toastify";
import { adminEmailApi } from "../../../api/emailApi";
import AdminButton from "../../../components/admin/ui/AdminButton";
import AdminCard from "../../../components/admin/ui/AdminCard";
import AdminModal from "../../../components/admin/ui/AdminModal";
import AdminPagination from "../../../components/admin/ui/AdminPagination";
import {
  EMAIL_SEND_STATUS_LABELS,
  EMAIL_SEND_STATUS_STYLES,
  EMAIL_TRIGGER_TYPE_LABELS,
} from "../../../constants/emailConfig";
import { getApiErrorMessage } from "../../../utils/apiError";
import { buildListParams, DEFAULT_PAGE_SIZE } from "../../../utils/pagination";

const StatusBadge = ({ status }) => (
  <span className={`px-2 py-0.5 rounded text-xs font-medium ${EMAIL_SEND_STATUS_STYLES[status] || ""}`}>
    {EMAIL_SEND_STATUS_LABELS[status] || status}
  </span>
);

const EmailLogListPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [statusFilter, setStatusFilter] = useState("");
  const [tournamentIdFilter, setTournamentIdFilter] = useState("");
  const [triggerTypeFilter, setTriggerTypeFilter] = useState("");
  const [templateCodeFilter, setTemplateCodeFilter] = useState("");
  const [recipientEmailFilter, setRecipientEmailFilter] = useState("");
  const [fromDateFilter, setFromDateFilter] = useState("");
  const [toDateFilter, setToDateFilter] = useState("");
  const [templates, setTemplates] = useState([]);

  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    adminEmailApi
      .listTemplates({ size: 200 })
      .then((result) => setTemplates(result.content))
      .catch(() => {});
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await adminEmailApi.listLogs(
        buildListParams({
          page,
          size: pageSize,
          status: statusFilter || undefined,
          tournamentId: tournamentIdFilter || undefined,
          triggerType: triggerTypeFilter || undefined,
          templateCode: templateCodeFilter || undefined,
          recipientEmail: recipientEmailFilter || undefined,
          fromDate: fromDateFilter || undefined,
          toDate: toDateFilter || undefined,
        })
      );
      setLogs(result.content);
      setTotalElements(result.totalElements);
      setTotalPages(result.totalPages);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [
    page,
    pageSize,
    statusFilter,
    tournamentIdFilter,
    triggerTypeFilter,
    templateCodeFilter,
    recipientEmailFilter,
    fromDateFilter,
    toDateFilter,
  ]);

  useEffect(() => {
    load();
  }, [load]);

  const resetFilters = () => {
    setPage(0);
    setStatusFilter("");
    setTournamentIdFilter("");
    setTriggerTypeFilter("");
    setTemplateCodeFilter("");
    setRecipientEmailFilter("");
    setFromDateFilter("");
    setToDateFilter("");
  };

  const openDetail = async (row) => {
    setDetailLoading(true);
    setDetail({});
    try {
      const data = await adminEmailApi.getLogDetail(row.id);
      setDetail(data);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
      setDetail(null);
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <AdminCard title={`Nhật ký gửi email (${totalElements})`}>
        <div className="admin-toolbar flex flex-wrap gap-2 mb-4">
          <select
            className="admin-select w-auto"
            value={statusFilter}
            onChange={(e) => {
              setPage(0);
              setStatusFilter(e.target.value);
            }}
          >
            <option value="">Tất cả trạng thái</option>
            {Object.entries(EMAIL_SEND_STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <input
            className="admin-input w-auto"
            placeholder="Lọc theo tournamentId"
            value={tournamentIdFilter}
            onChange={(e) => {
              setPage(0);
              setTournamentIdFilter(e.target.value.replace(/\D/g, ""));
            }}
          />
          <select
            className="admin-select w-auto"
            value={triggerTypeFilter}
            onChange={(e) => {
              setPage(0);
              setTriggerTypeFilter(e.target.value);
            }}
          >
            <option value="">Tất cả kích hoạt</option>
            {Object.entries(EMAIL_TRIGGER_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <select
            className="admin-select w-auto"
            value={templateCodeFilter}
            onChange={(e) => {
              setPage(0);
              setTemplateCodeFilter(e.target.value);
            }}
          >
            <option value="">Tất cả mẫu email</option>
            {templates.map((t) => (
              <option key={t.code} value={t.code}>
                {t.name} ({t.code})
              </option>
            ))}
          </select>
          <input
            className="admin-input w-auto"
            placeholder="Lọc theo email người nhận"
            value={recipientEmailFilter}
            onChange={(e) => {
              setPage(0);
              setRecipientEmailFilter(e.target.value);
            }}
          />
          <input
            type="date"
            className="admin-input w-auto"
            title="Từ ngày"
            value={fromDateFilter}
            onChange={(e) => {
              setPage(0);
              setFromDateFilter(e.target.value);
            }}
          />
          <input
            type="date"
            className="admin-input w-auto"
            title="Đến ngày"
            value={toDateFilter}
            onChange={(e) => {
              setPage(0);
              setToDateFilter(e.target.value);
            }}
          />
          <AdminButton variant="secondary" onClick={resetFilters}>
            Xóa lọc
          </AdminButton>
        </div>

        <div className="overflow-x-auto">
          <table className="admin-table w-full text-sm">
            <thead>
              <tr>
                <th>Người nhận</th>
                <th>Tiêu đề</th>
                <th>Mẫu</th>
                <th>Kích hoạt</th>
                <th>Giải đấu</th>
                <th>Trạng thái</th>
                <th>Thời gian</th>
                <th className="align-right"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-6 text-slate-400">
                    Đang tải...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-6 text-slate-400">
                    Chưa có nhật ký
                  </td>
                </tr>
              ) : (
                logs.map((row) => (
                  <tr key={row.id}>
                    <td className="text-xs">
                      <code className="admin-table-code" title={row.recipientEmail}>{row.recipientEmail}</code>
                    </td>
                    <td className="text-xs max-w-[220px] truncate">{row.subjectRendered}</td>
                    <td className="text-xs">
                      <code className="admin-table-code" title={row.templateCode}>{row.templateCode}</code>
                    </td>
                    <td className="text-xs">
                      <code className="admin-table-code" title={row.triggerType}>{row.triggerType}</code>
                    </td>
                    <td className="text-xs">{row.tournamentName || "—"}</td>
                    <td>
                      <StatusBadge status={row.status} />
                    </td>
                    <td className="text-xs">
                      {new Date(row.sentAt || row.createdAt).toLocaleString("vi-VN")}
                    </td>
                    <td className="align-right">
                      <div className="admin-table-actions">
                        <AdminButton variant="ghost" className="!px-2" onClick={() => openDetail(row)}>
                          <Eye size={16} />
                        </AdminButton>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <AdminPagination
          page={page}
          totalPages={totalPages}
          totalElements={totalElements}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={(s) => {
            setPageSize(s);
            setPage(0);
          }}
        />
      </AdminCard>

      <AdminModal
        open={!!detail}
        onClose={() => setDetail(null)}
        title="Chi tiết lượt gửi"
        size="lg"
        footer={
          <AdminButton variant="secondary" onClick={() => setDetail(null)}>
            Đóng
          </AdminButton>
        }
      >
        {detailLoading || !detail ? (
          <p className="text-slate-400 text-sm">Đang tải...</p>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <p className="admin-label">Người nhận</p>
                <p>{detail.recipientEmail}</p>
              </div>
              <div>
                <p className="admin-label">Trạng thái</p>
                <StatusBadge status={detail.status} />
              </div>
              <div>
                <p className="admin-label">Mẫu email</p>
                <p>{detail.templateName} ({detail.templateCode})</p>
              </div>
              <div>
                <p className="admin-label">Giải đấu</p>
                <p>{detail.tournamentName || "—"}</p>
              </div>
              {detail.errorMessage && (
                <div className="col-span-2">
                  <p className="admin-label">Lỗi</p>
                  <p className="text-rose-600">{detail.errorMessage}</p>
                </div>
              )}
            </div>
            <div>
              <p className="admin-label">Tiêu đề</p>
              <p className="font-medium">{detail.subjectRendered}</p>
            </div>
            <div>
              <p className="admin-label mb-1">Nội dung đã gửi</p>
              <div
                className="border border-slate-200 dark:border-white/10 rounded-lg p-4 bg-white dark:bg-[#101319]"
                dangerouslySetInnerHTML={{ __html: detail.bodyRendered }}
              />
            </div>
          </div>
        )}
      </AdminModal>
    </div>
  );
};

export default EmailLogListPage;
