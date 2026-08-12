import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Eye,
  MessageCircle,
  RefreshCw,
  Share2,
  ThumbsUp,
} from "lucide-react";
import { toast } from "react-toastify";
import { facebookApi } from "../../../api/facebookApi";
import AdminButton from "../../../components/admin/ui/AdminButton";
import AdminCard from "../../../components/admin/ui/AdminCard";
import AdminPagination from "../../../components/admin/ui/AdminPagination";
import { getApiErrorMessage } from "../../../utils/apiError";
import { buildListParams, DEFAULT_PAGE_SIZE } from "../../../utils/pagination";

const POST_TYPE_LABELS = {
  TEXT: "Văn bản",
  PHOTO: "Có ảnh",
  MULTI_PHOTO: "Nhiều ảnh",
};

const CONTENT_PREVIEW_LEN = 80;

const fmtDateTime = (iso) => {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return String(iso);
  }
};

const MetricCard = ({ icon: Icon, label, value, tone = "slate" }) => {
  const tones = {
    slate: {
      card: "border-slate-200 dark:border-white/10 bg-white dark:bg-[#161a22] shadow-sm shadow-slate-200/60 ring-1 ring-slate-100",
      icon: "bg-slate-900 text-white",
      label: "text-slate-500 dark:text-white/60",
      value: "text-slate-900 dark:text-white",
    },
    sky: {
      card: "border-sky-200 bg-gradient-to-br from-sky-50 to-white shadow-md shadow-sky-100 ring-1 ring-sky-100",
      icon: "bg-sky-600 text-white",
      label: "text-sky-700",
      value: "text-sky-900",
    },
    violet: {
      card: "border-violet-200 bg-gradient-to-br from-violet-50 to-white shadow-md shadow-violet-100 ring-1 ring-violet-100",
      icon: "bg-violet-600 text-white",
      label: "text-violet-700",
      value: "text-violet-950",
    },
    rose: {
      card: "border-rose-200 bg-gradient-to-br from-rose-50 to-white shadow-md shadow-rose-100 ring-1 ring-rose-100",
      icon: "bg-rose-600 text-white",
      label: "text-rose-700",
      value: "text-rose-950",
    },
  };
  const t = tones[tone] || tones.slate;

  return (
    <div className={`rounded-2xl border px-5 py-4 ${t.card}`}>
      <div className="flex items-center justify-between gap-3 mb-3">
        <p className={`text-sm font-semibold ${t.label}`}>{label}</p>
        {Icon && (
          <span className={`inline-flex h-9 w-9 items-center justify-center rounded-xl ${t.icon}`}>
            <Icon size={18} strokeWidth={2.25} />
          </span>
        )}
      </div>
      <p className={`text-4xl font-bold tabular-nums tracking-tight ${t.value}`}>
        {value == null ? "—" : Number(value).toLocaleString("vi-VN")}
      </p>
    </div>
  );
};

const FacebookPostsStatsPage = ({ basePath }) => {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await facebookApi.listPosts(
        buildListParams({ page, size: pageSize })
      );
      setPosts(result.content || []);
      setTotalElements(result.totalElements);
      setTotalPages(result.totalPages);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [page, pageSize]);

  useEffect(() => {
    load();
  }, [load]);

  const summary = useMemo(() => ({
    posts: totalElements,
    likes: posts.reduce((s, p) => s + (Number(p.likes) || 0), 0),
    comments: posts.reduce((s, p) => s + (Number(p.comments) || 0), 0),
    shares: posts.reduce((s, p) => s + (Number(p.shares) || 0), 0),
  }), [posts, totalElements]);

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard icon={Share2} label="Tổng bài đăng" value={summary.posts} tone="slate" />
        <MetricCard icon={ThumbsUp} label={`Like (trang ${page + 1})`} value={summary.likes} tone="sky" />
        <MetricCard icon={MessageCircle} label={`Comment (trang ${page + 1})`} value={summary.comments} tone="violet" />
        <MetricCard icon={Share2} label={`Share (trang ${page + 1})`} value={summary.shares} tone="rose" />
      </div>

      <AdminCard
        title={`Bài đăng Facebook (${totalElements})`}
        action={
          <AdminButton variant="secondary" onClick={load} disabled={loading}>
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Làm mới
          </AdminButton>
        }
      >
        <p className="text-sm text-slate-500 dark:text-white/60 mb-4">
          Số liệu tương tác lấy từ cache DB (nhanh). Vào chi tiết rồi bấm &quot;Làm mới&quot; để đồng bộ lại từ Facebook.
        </p>

        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Thời gian đăng</th>
                <th>Giải đấu</th>
                <th>Loại</th>
                <th>Nội dung</th>
                <th>Tương tác</th>
                <th>Người đăng</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-400 dark:text-white/40">
                    Đang tải danh sách...
                  </td>
                </tr>
              ) : posts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-400 dark:text-white/40">
                    Chưa có bài đăng Facebook nào. Mở đăng ký giải để hệ thống tự đăng bài.
                  </td>
                </tr>
              ) : (
                posts.map((post) => {
                  const content = post.content || "";
                  const preview = content.length > CONTENT_PREVIEW_LEN
                    ? `${content.slice(0, CONTENT_PREVIEW_LEN).trim()}...`
                    : (content || "—");
                  const synced = !!post.statsSyncedAt;

                  return (
                    <tr key={post.id}>
                      <td className="whitespace-nowrap text-sm">{fmtDateTime(post.postedAt)}</td>
                      <td className="text-sm">
                        {post.tournamentName || (
                          <span className="text-slate-400 dark:text-white/40">—</span>
                        )}
                      </td>
                      <td>
                        <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-white/75">
                          {POST_TYPE_LABELS[post.postType] || post.postType}
                        </span>
                      </td>
                      <td className="max-w-xs">
                        <p className="text-sm text-slate-700 dark:text-white/75 line-clamp-2 whitespace-pre-wrap">
                          {preview}
                        </p>
                      </td>
                      <td className="text-xs text-slate-600 dark:text-white/70 whitespace-nowrap">
                        {synced ? (
                          <div className="space-y-0.5 tabular-nums">
                            <div>Like: {post.likes ?? 0}</div>
                            <div>Comment: {post.comments ?? 0}</div>
                            <div>Share: {post.shares ?? 0}</div>
                          </div>
                        ) : (
                          <span className="text-slate-400 dark:text-white/40">Chưa đồng bộ</span>
                        )}
                      </td>
                      <td className="text-sm text-slate-600 dark:text-white/70 max-w-[140px] truncate">
                        {post.postedByEmail || "—"}
                      </td>
                      <td>
                        <AdminButton
                          variant="secondary"
                          onClick={() => navigate(`${basePath}/${post.id}`)}
                        >
                          <Eye size={14} />
                          Xem chi tiết
                        </AdminButton>
                      </td>
                    </tr>
                  );
                })
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
          onPageSizeChange={(size) => {
            setPage(0);
            setPageSize(size);
          }}
        />
      </AdminCard>
    </div>
  );
};

export default FacebookPostsStatsPage;
