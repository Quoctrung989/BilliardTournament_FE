import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  ExternalLink,
  Eye,
  MessageCircle,
  MousePointerClick,
  RefreshCw,
  Share2,
  ThumbsUp,
  Trophy,
  User,
  Users,
} from "lucide-react";
import { toast } from "react-toastify";
import { facebookApi } from "../../../api/facebookApi";
import AdminButton from "../../../components/admin/ui/AdminButton";
import AdminCard from "../../../components/admin/ui/AdminCard";
import { getApiErrorMessage } from "../../../utils/apiError";

const POST_TYPE_LABELS = {
  TEXT: "Văn bản",
  PHOTO: "Có ảnh",
  MULTI_PHOTO: "Nhiều ảnh",
};

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

const fmtNum = (value) =>
  value == null ? "—" : Number(value).toLocaleString("vi-VN");

const MetricCard = ({ icon: Icon, label, value, hint }) => (
  <div className="rounded-xl border border-slate-200 bg-white px-4 py-4">
    <div className="flex items-start justify-between gap-2 mb-3">
      <p className="text-sm text-slate-500">{label}</p>
      {Icon && (
        <span className="rounded-lg bg-slate-100 p-1.5 text-slate-500">
          <Icon size={14} />
        </span>
      )}
    </div>
    <p className="text-3xl font-semibold text-slate-900 tabular-nums tracking-tight">
      {fmtNum(value)}
    </p>
    {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
  </div>
);

const InfoRow = ({ label, value }) => (
  <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-3 py-2.5 border-b border-slate-100 last:border-0">
    <dt className="text-xs font-medium uppercase tracking-wide text-slate-400 sm:w-36 shrink-0">
      {label}
    </dt>
    <dd className="text-sm text-slate-800 break-words">{value || "—"}</dd>
  </div>
);

const FacebookPostDetailPage = ({ basePath }) => {
  const { postId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [post, setPost] = useState(null);
  const [stats, setStats] = useState(null);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      let data = await facebookApi.getInsights(postId, { refresh: isRefresh });
      // Cache cũ có thể chưa lưu ảnh — tải lại 1 lần từ Facebook
      if (!isRefresh && !data.fullPicture) {
        data = await facebookApi.getInsights(postId, { refresh: true });
      }
      setPost({
        id: data.id ?? Number(postId),
        facebookPostId: data.facebookPostId,
        content: data.content || data.message || "",
        postType: data.postType,
        postedAt: data.postedAt || data.createdTime,
        permalinkUrl: data.permalinkUrl,
        tournamentId: data.tournamentId,
        tournamentName: data.tournamentName,
        postedByEmail: data.postedByEmail,
        fullPicture: data.fullPicture || null,
      });
      setStats(data);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
      if (!isRefresh) navigate(basePath);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [postId, basePath, navigate]);

  useEffect(() => {
    load(false);
  }, [load]);

  const fbUrl = stats?.permalinkUrl || post?.permalinkUrl;

  if (loading) {
    return (
      <div className="py-20 text-center">
        <div className="admin-skeleton h-4 w-48 mx-auto mb-2" />
        <div className="admin-skeleton h-3 w-32 mx-auto" />
        <p className="mt-4 text-sm text-slate-400">Đang tải chi tiết bài đăng...</p>
      </div>
    );
  }

  if (!post) return null;

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <AdminButton variant="secondary" onClick={() => navigate(basePath)}>
          <ArrowLeft size={14} /> Danh sách bài đăng
        </AdminButton>
        <div className="flex flex-wrap gap-2">
          <AdminButton variant="secondary" onClick={() => load(true)} disabled={refreshing}>
            <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
            {refreshing ? "Đang làm mới..." : "Làm mới"}
          </AdminButton>
          {fbUrl && (
            <a
              href={fbUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="admin-btn admin-btn-primary inline-flex items-center gap-1.5"
            >
              <ExternalLink size={14} />
              Mở trên Facebook
            </a>
          )}
        </div>
      </div>

      {/* Header summary */}
      <div className="admin-card p-5">
        <div className="flex flex-wrap items-start justify-between gap-3 mb-1">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400 mb-1">
              Bài đăng Facebook
            </p>
            <h2 className="text-xl font-semibold text-slate-900">
              #{post.id}
              {post.tournamentName ? ` · ${post.tournamentName}` : ""}
            </h2>
          </div>
          <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
            {POST_TYPE_LABELS[post.postType] || post.postType || "—"}
          </span>
        </div>
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm text-slate-500">
          <span className="inline-flex items-center gap-1.5">
            <Calendar size={14} />
            {fmtDateTime(stats?.createdTime || post.postedAt)}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <User size={14} />
            {post.postedByEmail || "Hệ thống (tự động)"}
          </span>
          {post.tournamentName && (
            <span className="inline-flex items-center gap-1.5 text-amber-700">
              <Trophy size={14} />
              {post.tournamentName}
            </span>
          )}
        </div>
      </div>

      {/* Main layout: content + metrics */}
      <div className="grid gap-5 lg:grid-cols-5">
        {/* Left: content */}
        <div className="lg:col-span-3 space-y-5">
          <AdminCard title="Nội dung bài đăng">
            <div className="rounded-xl border border-slate-200 bg-slate-50/80 overflow-hidden">
              {(post.fullPicture || stats?.fullPicture) ? (
                <div className="border-b border-slate-200 bg-slate-100">
                  <img
                    src={post.fullPicture || stats.fullPicture}
                    alt="Ảnh bài đăng Facebook"
                    className="w-full max-h-80 object-contain bg-slate-100"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                </div>
              ) : (
                <div className="border-b border-slate-200 px-4 py-6 text-center text-sm text-slate-400">
                  {(post.postType === "PHOTO" || post.postType === "MULTI_PHOTO")
                    ? "Chưa có ảnh — bấm Làm mới để tải từ Facebook"
                    : "Bài đăng không kèm ảnh"}
                </div>
              )}
              <div className="p-4 max-h-[28rem] overflow-y-auto">
                <p className="text-[15px] text-slate-800 whitespace-pre-wrap leading-7">
                  {post.content || "—"}
                </p>
              </div>
            </div>
          </AdminCard>

          <AdminCard title="Thông tin hệ thống">
            <dl>
              <InfoRow label="ID nội bộ" value={post.id} />
              <InfoRow label="Facebook Post ID" value={post.facebookPostId || stats?.facebookPostId} />
              <InfoRow label="Giải đấu" value={post.tournamentName} />
              <InfoRow label="Người đăng" value={post.postedByEmail || "Hệ thống (tự động)"} />
              <InfoRow label="Thời gian đăng" value={fmtDateTime(stats?.createdTime || post.postedAt)} />
              <InfoRow
                label="Link bài viết"
                value={
                  fbUrl ? (
                    <a
                      href={fbUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:underline break-all"
                    >
                      {fbUrl}
                    </a>
                  ) : null
                }
              />
            </dl>
          </AdminCard>
        </div>

        {/* Right: stats */}
        <div className="lg:col-span-2 space-y-5">
          <AdminCard title="Tương tác">
            <div className="grid gap-3">
              <MetricCard icon={ThumbsUp} label="Lượt thích / Reactions" value={stats?.likes} />
              <MetricCard icon={MessageCircle} label="Bình luận" value={stats?.comments} />
              <MetricCard icon={Share2} label="Chia sẻ" value={stats?.shares} />
            </div>
          </AdminCard>

          <AdminCard title="Tiếp cận">
            <div className="grid gap-3">
              <MetricCard
                icon={Eye}
                label="Lượt hiển thị"
                value={stats?.insights?.post_impressions}
                hint="Impressions"
              />
              <MetricCard
                icon={Users}
                label="Người tiếp cận"
                value={stats?.insights?.post_impressions_unique}
                hint="Reach"
              />
              <MetricCard
                icon={MousePointerClick}
                label="Người tương tác"
                value={stats?.insights?.post_engaged_users}
                hint="Engaged users"
              />
            </div>
          </AdminCard>

          {(stats?.fromCache || stats?.statsSyncedAt || stats?.engagementNote || stats?.insightsNote) && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-500 space-y-1">
              {stats.fromCache && (
                <p>
                  Đang hiển thị số liệu cache
                  {stats.statsSyncedAt ? ` (cập nhật lúc ${fmtDateTime(stats.statsSyncedAt)})` : ""}.
                  Bấm &quot;Làm mới&quot; để lấy lại từ Facebook.
                </p>
              )}
              {!stats.fromCache && stats.statsSyncedAt && (
                <p>Đã đồng bộ từ Facebook lúc {fmtDateTime(stats.statsSyncedAt)}.</p>
              )}
              {stats.engagementSource && <p>Nguồn dữ liệu: {stats.engagementSource}</p>}
              {stats.engagementNote && <p>{stats.engagementNote}</p>}
              {stats.insightsNote && <p>{stats.insightsNote}</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FacebookPostDetailPage;
