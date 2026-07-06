import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { ArrowLeft } from "lucide-react";
import { getPostBySlug } from "../../api/newsApi";
import { getApiErrorMessage } from "../../utils/apiError";

const FALLBACK = "/images/tournaments/vn-player-1.jpg";

const fmtDate = (iso) => {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("vi-VN", { day: "2-digit", month: "long", year: "numeric" });
};

const ArticleDetailPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getPostBySlug(slug);
      setPost(data);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
      navigate("/news");
    } finally {
      setLoading(false);
    }
  }, [slug, navigate]);

  useEffect(() => { if (slug) load(); }, [slug, load]);

  if (loading) return <div className="max-w-3xl mx-auto px-4 py-16 text-center text-slate-400">Đang tải...</div>;
  if (!post) return null;

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <button
        type="button"
        onClick={() => navigate("/news")}
        className="flex items-center gap-1.5 text-sm text-[#010851]/60 hover:text-[#010851] mb-6"
      >
        <ArrowLeft size={14} />
        Quay lại tin tức
      </button>

      {post.categoryName && (
        <span className="text-[10px] font-bold uppercase tracking-widest text-[#EF342A]">
          {post.categoryName}
        </span>
      )}
      <h1 className="text-3xl font-black text-[#010851] mt-2 mb-3 leading-tight">{post.title}</h1>
      <p className="text-sm text-slate-400 mb-6">{fmtDate(post.publishedAt)}</p>

      <div className="rounded-2xl overflow-hidden mb-8 bg-slate-100">
        <img
          src={post.thumbnailUrl || FALLBACK}
          alt={post.title}
          className="w-full max-h-[420px] object-cover"
          onError={(e) => { e.target.src = FALLBACK; }}
        />
      </div>

      <div
        className="prose prose-slate max-w-none text-slate-700 leading-relaxed"
        dangerouslySetInnerHTML={{ __html: post.content }}
      />

      {post.tags?.length > 0 && (
        <div className="mt-8 flex flex-wrap gap-2">
          {post.tags.map((tag) => (
            <span key={tag} className="px-3 py-1 bg-slate-100 text-slate-600 text-xs rounded-full">
              #{tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export default ArticleDetailPage;
