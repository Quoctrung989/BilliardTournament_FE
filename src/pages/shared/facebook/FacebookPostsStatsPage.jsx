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
import { useCountUp } from "../../../hooks/useCountUp";
import { useReveal } from "../../../hooks/useReveal";
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

const MetricCard = ({ icon: Icon, label, value, tone = "slate", index = 0 }) => {
  /* Đếm từ 0 lên khi thẻ lọt vào tầm nhìn. Hook tự bỏ qua khi người dùng tắt
     chuyển động ở cấp hệ điều hành. */
  const { ref: countRef, value: shown } = useCountUp(Number(value) || 0);

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
    /* Stagger ở lớp ngoài, hover ở lớp trong: gộp chung thì transition-delay
       của stagger rò sang hover, thẻ càng ở sau càng chậm nhấc lên. */
    <div className="ui-stagger" style={{ "--i": index }}>
      <div className={`group ui-card h-full rounded-2xl border px-5 py-4 ${t.card}`}>
        <div className="flex items-center justify-between gap-3 mb-3">
          <p className={`text-sm font-semibold ${t.label}`}>{label}</p>
          {Icon && (
            <span
              className={`inline-flex h-9 w-9 items-center justify-center rounded-xl transition-transform duration-300 ease-[cubic-bezier(0.34,1.4,0.5,1)] group-hover:-rotate-6 group-hover:scale-110 ${t.icon}`}
            >
              <Icon size={18} strokeWidth={2.25} />
            </span>
          )}
        </div>
        <p ref={countRef} className={`text-4xl font-bold tabular-nums tracking-tight ${t.value}`}>
          {value == null ? "—" : shown.toLocaleString("vi-VN")}
        </p>
      </div>
    </div>
  );
};

const FacebookPostsStatsPage = ({ basePath }) => {
  const navigate = useNavigate();
  /* Gắn `is-in` cho các .ui-stagger con khi khối lọt vào tầm nhìn — bốn thẻ
     số liệu vào lần lượt thay vì hiện cùng lúc. */
  const metricsRef = useReveal({ threshold: 0.1 });
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
      <div ref={metricsRef} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard icon={Share2} label="Tổng bài đăng" value={summary.posts} tone="slate" index={0} />
        <MetricCard icon={ThumbsUp} label={`Like (trang ${page + 1})`} value={summary.likes} tone="sky" index={1} />
        <MetricCard icon={MessageCircle} label={`Comment (trang ${page + 1})`} value={summary.comments} tone="violet" index={2} />
        <MetricCard icon={Share2} label={`Share (trang ${page + 1})`} value={summary.shares} tone="rose" index={3} />
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
                /* Khung xương giữ đúng hình dạng bảng trong lúc chờ, thay vì
                   một dòng chữ rồi bảng bật ra đột ngột khi có dữ liệu. */
                [...Array(5)].map((_, i) => (
                  <tr key={`sk-${i}`}>
                    {[...Array(7)].map((__, c) => (
                      <td key={c} className="py-3">
                        <div className="ui-skeleton h-4 rounded" style={{ width: c === 3 ? "90%" : "70%" }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : posts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-400 dark:text-white/40">
                    Chưa có bài đăng Facebook nào. Mở đăng ký giải để hệ thống tự đăng bài.
                  </td>
                </tr>
              ) : (
                posts.map((post, idx) => {
                  const content = post.content || "";
                  const preview = content.length > CONTENT_PREVIEW_LEN
                    ? `${content.slice(0, CONTENT_PREVIEW_LEN).trim()}...`
                    : (content || "—");
                  const synced = !!post.statsSyncedAt;

                  return (
                    /* Cả hàng bấm được — nút "Xem chi tiết" giữ lại làm chỉ dẫn
                       thị giác, nhưng không bắt người dùng nhắm vào đúng nó. */
                    <tr
                      key={post.id}
                      className="ui-row ui-stagger is-in cursor-pointer border-l-2 border-l-transparent hover:bg-slate-50 dark:hover:bg-white/5"
                      style={{ "--i": Math.min(idx, 11) }}
                      onClick={() => navigate(`${basePath}/${post.id}`)}
                    >
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
                          /* Chặn nổi bọt: không có dòng này thì bấm nút sẽ kích
                             hoạt cả onClick của hàng, điều hướng hai lần. */
                          onClick={(e) => { e.stopPropagation(); navigate(`${basePath}/${post.id}`); }}
                        >
                          <Eye size={14} />
                          Xem chi tiết
                          <span className="ui-arrow-x inline-block">→</span>
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
