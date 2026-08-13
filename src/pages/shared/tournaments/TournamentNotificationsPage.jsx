import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { ArrowLeft, RefreshCw } from "lucide-react";
import AdminButton from "../../../components/admin/ui/AdminButton";
import AdminCard from "../../../components/admin/ui/AdminCard";
import AdminPagination from "../../../components/admin/ui/AdminPagination";
import {
  EMAIL_MANUAL_RECIPIENT_TYPES,
  EMAIL_SEND_STATUS_LABELS,
  EMAIL_SEND_STATUS_STYLES,
  EMAIL_TRIGGER_TYPE_LABELS,
} from "../../../constants/emailConfig";
import { getApiErrorMessage } from "../../../utils/apiError";
import { buildListParams, DEFAULT_PAGE_SIZE } from "../../../utils/pagination";

const TABS = [
  { id: "manual", label: "Gửi thủ công" },
  { id: "automation", label: "Tự động" },
  { id: "history", label: "Lịch sử gửi" },
];

const StatusBadge = ({ status }) => (
  <span className={`px-2 py-0.5 rounded text-xs font-medium ${EMAIL_SEND_STATUS_STYLES[status] || ""}`}>
    {EMAIL_SEND_STATUS_LABELS[status] || status}
  </span>
);

const ManualSendTab = ({ api, tournamentId }) => {
  const [templates, setTemplates] = useState([]);
  const [templateId, setTemplateId] = useState("");
  const [recipientType, setRecipientType] = useState("ALL_PARTICIPANTS");
  const [customEmails, setCustomEmails] = useState("");
  const [subjectOverride, setSubjectOverride] = useState("");
  const [bodyOverride, setBodyOverride] = useState("");
  const [customMessage, setCustomMessage] = useState("");
  const [preview, setPreview] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    api
      .listTemplates(buildListParams({ page: 0, size: 100 }))
      .then((r) => setTemplates(r.content))
      .catch(() => setTemplates([]));
  }, [api]);

  const buildVariables = () => (customMessage.trim() ? { custom: { message: customMessage } } : undefined);

  const buildRequest = () => ({
    templateId: Number(templateId),
    subjectOverride: subjectOverride.trim() || null,
    bodyOverride: bodyOverride.trim() || null,
    recipientType,
    recipientEmails:
      recipientType === "CUSTOM_LIST"
        ? customEmails
            .split(/[\n,;]+/)
            .map((e) => e.trim())
            .filter(Boolean)
        : [],
    variables: buildVariables(),
  });

  const handlePreview = async () => {
    if (!templateId) {
      toast.error("Chọn mẫu email trước khi preview");
      return;
    }
    setPreviewLoading(true);
    try {
      const rendered = await api.preview(tournamentId, {
        templateId: Number(templateId),
        variables: buildVariables(),
      });
      setPreview(rendered);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleSend = async () => {
    if (!templateId) {
      toast.error("Chọn mẫu email trước khi gửi");
      return;
    }
    if (recipientType === "CUSTOM_LIST" && !customEmails.trim()) {
      toast.error("Nhập ít nhất 1 email");
      return;
    }
    setSending(true);
    try {
      const result = await api.sendManual(tournamentId, buildRequest());
      toast.success(`Đã xếp hàng gửi ${result.queuedCount} email`);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <AdminCard title="Soạn email">
        <div className="space-y-4">
          <div>
            <label className="admin-label">Mẫu email *</label>
            <select className="admin-select mt-1" value={templateId} onChange={(e) => setTemplateId(e.target.value)}>
              <option value="">— Chọn mẫu email —</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.code})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="admin-label">Người nhận</label>
            <select
              className="admin-select mt-1"
              value={recipientType}
              onChange={(e) => setRecipientType(e.target.value)}
            >
              {EMAIL_MANUAL_RECIPIENT_TYPES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
          {recipientType === "CUSTOM_LIST" && (
            <div>
              <label className="admin-label">Danh sách email (cách nhau bằng dấu phẩy hoặc xuống dòng)</label>
              <textarea
                className="admin-input mt-1"
                rows={3}
                value={customEmails}
                onChange={(e) => setCustomEmails(e.target.value)}
              />
            </div>
          )}
          <div>
            <label className="admin-label">Nội dung tuỳ chỉnh (chèn vào {"{{custom.message}}"})</label>
            <textarea
              className="admin-input mt-1"
              rows={3}
              placeholder="Mời bạn có mặt đúng giờ..."
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
            />
          </div>
          <details className="text-sm">
            <summary className="admin-label cursor-pointer select-none">Override tiêu đề / nội dung (nâng cao)</summary>
            <div className="mt-2 space-y-3">
              <div>
                <label className="admin-label">Tiêu đề override</label>
                <input
                  className="admin-input mt-1"
                  value={subjectOverride}
                  onChange={(e) => setSubjectOverride(e.target.value)}
                />
              </div>
              <div>
                <label className="admin-label">Nội dung HTML override</label>
                <textarea
                  className="admin-input mt-1 font-mono text-xs"
                  rows={6}
                  value={bodyOverride}
                  onChange={(e) => setBodyOverride(e.target.value)}
                />
              </div>
            </div>
          </details>

          <div className="flex gap-2 pt-2">
            <AdminButton variant="secondary" onClick={handlePreview} disabled={previewLoading}>
              {previewLoading ? "Đang xem trước..." : "Xem trước"}
            </AdminButton>
            <AdminButton onClick={handleSend} disabled={sending}>
              {sending ? "Đang gửi..." : "Gửi email"}
            </AdminButton>
          </div>
        </div>
      </AdminCard>

      <AdminCard title="Xem trước">
        {preview ? (
          <div className="space-y-3">
            <div>
              <p className="admin-label">Tiêu đề</p>
              <p className="font-medium">{preview.subject}</p>
            </div>
            <div>
              <p className="admin-label mb-1">Nội dung</p>
              <div
                className="border border-slate-200 dark:border-white/10 rounded-lg p-4 bg-white dark:bg-[#161a22]"
                dangerouslySetInnerHTML={{ __html: preview.bodyHtml }}
              />
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-400 dark:text-white/40">Bấm "Xem trước" để xem nội dung sẽ được gửi.</p>
        )}
      </AdminCard>
    </div>
  );
};

const AutomationTab = ({ api, tournamentId }) => {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.listAutomationRules(tournamentId);
      setRules(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [api, tournamentId]);

  useEffect(() => {
    load();
  }, [load]);

  const toggle = async (rule) => {
    try {
      await api.setRuleEnabled(tournamentId, rule.id, !rule.isEnabled);
      load();
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  return (
    <AdminCard title="Quy tắc tự động áp dụng cho giải đấu">
      <div className="overflow-x-auto">
        <table className="admin-table w-full text-sm">
          <thead>
            <tr>
              <th>Tên</th>
              <th>Sự kiện</th>
              <th>Mẫu email</th>
              <th>Người nhận</th>
              <th>Phạm vi</th>
              <th>Trạng thái</th>
              <th className="align-right">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="text-center py-6 text-slate-400 dark:text-white/40">
                  Đang tải...
                </td>
              </tr>
            ) : rules.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-6 text-slate-400 dark:text-white/40">
                  Chưa có quy tắc nào
                </td>
              </tr>
            ) : (
              rules.map((rule) => (
                <tr key={rule.id}>
                  <td>{rule.name}</td>
                  <td className="text-xs">{rule.eventTypeDisplayName}</td>
                  <td className="text-xs">{rule.templateName}</td>
                  <td className="text-xs">{rule.recipientTypeDisplayName}</td>
                  <td className="text-xs">{rule.scope === "GLOBAL" ? "Toàn hệ thống" : "Riêng giải này"}</td>
                  <td>
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium ${
                        rule.isEnabled ? "bg-green-100 text-green-800" : "bg-gray-200 text-gray-700 dark:text-white/75"
                      }`}
                    >
                      {rule.isEnabled ? "Đang bật" : "Đang tắt"}
                    </span>
                  </td>
                  <td className="align-right">
                    <div className="admin-table-actions">
                      <AdminButton variant={rule.isEnabled ? "danger" : "success"} onClick={() => toggle(rule)}>
                        {rule.isEnabled ? "Tắt" : "Bật"}
                      </AdminButton>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </AdminCard>
  );
};

const HistoryTab = ({ api, tournamentId }) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [statusFilter, setStatusFilter] = useState("");
  const [triggerTypeFilter, setTriggerTypeFilter] = useState("");
  const [templateCodeFilter, setTemplateCodeFilter] = useState("");
  const [recipientEmailFilter, setRecipientEmailFilter] = useState("");
  const [fromDateFilter, setFromDateFilter] = useState("");
  const [toDateFilter, setToDateFilter] = useState("");
  const [templates, setTemplates] = useState([]);

  useEffect(() => {
    api
      .listTemplates(buildListParams({ page: 0, size: 100 }))
      .then((r) => setTemplates(r.content))
      .catch(() => {});
  }, [api]);

  const load = useCallback(async ({ silent = false } = {}) => {
    if (silent) setRefreshing(true); else setLoading(true);
    try {
      const result = await api.listLogs(
        tournamentId,
        buildListParams({
          page,
          size: pageSize,
          status: statusFilter || undefined,
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
      setRefreshing(false);
    }
  }, [
    api,
    tournamentId,
    page,
    pageSize,
    statusFilter,
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
    setTriggerTypeFilter("");
    setTemplateCodeFilter("");
    setRecipientEmailFilter("");
    setFromDateFilter("");
    setToDateFilter("");
  };

  // Email vừa gửi ở trạng thái "Đang chờ gửi" sẽ được xử lý bất đồng bộ ở BE,
  // nên tự động làm mới định kỳ tới khi không còn dòng nào chờ nữa — khỏi phải F5 cả trang.
  useEffect(() => {
    const hasPending = logs.some((row) => row.status === "QUEUED");
    if (!hasPending) return undefined;
    const timer = setInterval(() => load({ silent: true }), 4000);
    return () => clearInterval(timer);
  }, [logs, load]);

  return (
    <AdminCard
      title={`Lịch sử gửi email (${totalElements})`}
      action={
        <AdminButton variant="secondary" onClick={() => load({ silent: true })} disabled={loading || refreshing}>
          <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} /> Làm mới
        </AdminButton>
      }
    >
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
              <th>Nguồn</th>
              <th>Trạng thái</th>
              <th>Thời gian</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="text-center py-6 text-slate-400 dark:text-white/40">
                  Đang tải...
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-6 text-slate-400 dark:text-white/40">
                  Chưa có lịch sử gửi
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
                    <code className="admin-table-code" title={row.triggerType}>{row.triggerType}</code>
                  </td>
                  <td>
                    <StatusBadge status={row.status} />
                  </td>
                  <td className="text-xs">{new Date(row.sentAt || row.createdAt).toLocaleString("vi-VN")}</td>
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
  );
};

const TournamentNotificationsPage = ({ api, basePath }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const tournamentId = Number(id);
  const [tab, setTab] = useState("manual");

  return (
    <div className="space-y-4">
      {basePath && (
        <AdminButton variant="secondary" onClick={() => navigate(`${basePath}/${tournamentId}`)}>
          <ArrowLeft size={14} /> Chi tiết giải
        </AdminButton>
      )}
      <div className="flex gap-2 border-b border-slate-200 dark:border-white/10">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === t.id
                ? "border-indigo-600 text-indigo-700"
                : "border-transparent text-slate-500 dark:text-white/60 hover:text-slate-700 dark:hover:text-white/75"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "manual" && <ManualSendTab api={api} tournamentId={tournamentId} />}
      {tab === "automation" && <AutomationTab api={api} tournamentId={tournamentId} />}
      {tab === "history" && <HistoryTab api={api} tournamentId={tournamentId} />}
    </div>
  );
};

export default TournamentNotificationsPage;
