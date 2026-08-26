import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useGoBack } from "../../../hooks/useGoBack";
import { toast } from "react-toastify";
import { ArrowLeft, Plus } from "lucide-react";
import AdminButton from "../../../components/admin/ui/AdminButton";
import AdminCard from "../../../components/admin/ui/AdminCard";
import ImageUploader from "../../../components/shared/ImageUploader";
import RichTextEditor from "../../../components/shared/RichTextEditor";
import { newsTagsApi } from "../../../api/newsApi";
import { getApiErrorMessage } from "../../../utils/apiError";

const slugify = (text) =>
  text.toLowerCase().trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

const ArticleEditorPage = ({ api, basePath }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const goBack = useGoBack(basePath);
  const isNew = id === "new" || !id;

  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [newTagName, setNewTagName] = useState("");
  const [creatingTag, setCreatingTag] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "", slug: "", categoryId: "", thumbnailUrl: "", content: "", tagIds: [],
  });

  const loadCategories = useCallback(async () => {
    try {
      const cats = await api.listCategories();
      setCategories(Array.isArray(cats) ? cats : []);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  }, [api]);

  const loadTags = useCallback(async () => {
    try {
      const list = await newsTagsApi.listTags();
      setTags(Array.isArray(list) ? list : []);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  }, []);

  const loadPost = useCallback(async () => {
    if (isNew) return;
    try {
      const post = await api.getPost(Number(id));
      setForm({
        title: post.title || "",
        slug: post.slug || "",
        categoryId: post.categoryId != null ? String(post.categoryId) : "",
        thumbnailUrl: post.thumbnailUrl || "",
        content: post.content || "",
        tagIds: Array.isArray(post.tagIds) ? post.tagIds : [],
      });
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  }, [api, isNew, id]);

  useEffect(() => { loadCategories(); loadTags(); loadPost(); }, [loadCategories, loadTags, loadPost]);

  const toggleTag = (tagId) => {
    setForm((f) => ({
      ...f,
      tagIds: f.tagIds.includes(tagId)
        ? f.tagIds.filter((t) => t !== tagId)
        : [...f.tagIds, tagId],
    }));
  };

  const slugifyTag = (text) =>
    text.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-");

  const handleCreateTag = async () => {
    const name = newTagName.trim();
    if (!name) return;
    setCreatingTag(true);
    try {
      const tag = await newsTagsApi.createTag({ name, slug: slugifyTag(name) });
      setTags((prev) => [...prev, tag]);
      setForm((f) => ({ ...f, tagIds: [...f.tagIds, tag.id] }));
      setNewTagName("");
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setCreatingTag(false);
    }
  };

  const handleTitleChange = (v) => {
    setForm((f) => ({ ...f, title: v, slug: isNew ? slugify(v) : f.slug }));
  };

  const isContentEmpty = (html) => !html || !html.replace(/<[^>]*>/g, "").trim();

  const handleSave = async () => {
    if (!form.title.trim() || !form.slug.trim() || !form.categoryId || isContentEmpty(form.content)) {
      toast.warn("Vui lòng điền đầy đủ tiêu đề, slug, danh mục và nội dung");
      return;
    }
    setSaving(true);
    try {
      const body = {
        title: form.title.trim(),
        slug: form.slug.trim(),
        categoryId: Number(form.categoryId),
        thumbnailUrl: form.thumbnailUrl.trim() || null,
        content: form.content.trim(),
        tagIds: form.tagIds,
      };
      if (isNew) {
        await api.createPost(body);
        toast.success("Đã tạo bài viết");
      } else {
        await api.updatePost(Number(id), body);
        toast.success("Đã cập nhật bài viết");
      }
      navigate(basePath);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <AdminButton variant="secondary" onClick={goBack}>
        <ArrowLeft size={14} /> Quay lại
      </AdminButton>

      <AdminCard title={isNew ? "Tạo bài viết mới" : "Sửa bài viết"}>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="admin-label">Tiêu đề *</label>
            <input
              className="admin-input w-full mt-1"
              value={form.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Tiêu đề bài viết"
            />
          </div>

          <div>
            <label className="admin-label">Slug *</label>
            <input
              className="admin-input w-full mt-1"
              value={form.slug}
              onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
              placeholder="tieu-de-bai-viet"
            />
          </div>

          <div>
            <label className="admin-label">Danh mục *</label>
            <select
              className="admin-select w-full mt-1"
              value={form.categoryId}
              onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
            >
              <option value="">-- Chọn danh mục --</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="admin-label">Thẻ (tags)</label>
            <div className="flex flex-wrap gap-2 mt-1">
              {tags.map((t) => {
                const active = form.tagIds.includes(t.id);
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => toggleTag(t.id)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                      active
                        ? "bg-[#010851] text-white"
                        : "bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-white/70 hover:bg-slate-200 dark:hover:bg-white/10"
                    }`}
                  >
                    {t.name}
                  </button>
                );
              })}
              {tags.length === 0 && <span className="text-xs text-slate-400 dark:text-white/40">Chưa có thẻ nào.</span>}
            </div>
            <div className="flex gap-2 mt-2">
              <input
                className="admin-input flex-1"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleCreateTag(); } }}
                placeholder="Tên thẻ mới..."
              />
              <AdminButton
                type="button"
                variant="secondary"
                onClick={handleCreateTag}
                disabled={creatingTag || !newTagName.trim()}
                className="flex items-center gap-1"
              >
                <Plus size={14} /> Thêm
              </AdminButton>
            </div>
          </div>

          <div className="sm:col-span-2">
            <ImageUploader
              label="Ảnh thumbnail"
              folder="thumbnails"
              previewUrl={form.thumbnailUrl}
              aspectClass="h-40 w-full rounded-xl"
              onUpload={({ url }) =>
                setForm((f) => ({ ...f, thumbnailUrl: url }))
              }
            />
          </div>

          <div className="sm:col-span-2">
            <label className="admin-label">Nội dung *</label>
            <div className="mt-1">
              <RichTextEditor
                value={form.content}
                onChange={(html) => setForm((f) => ({ ...f, content: html }))}
              />
            </div>
            <p className="text-xs text-slate-400 dark:text-white/40 mt-1">Lưu dưới dạng nháp — bấm "Xuất bản" ở danh sách bài viết để công khai.</p>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-5">
          <AdminButton variant="secondary" onClick={() => navigate(basePath)}>Hủy</AdminButton>
          <AdminButton variant="primary" onClick={handleSave} disabled={saving}>
            {saving ? "Đang lưu..." : "Lưu bài viết"}
          </AdminButton>
        </div>
      </AdminCard>
    </div>
  );
};

export default ArticleEditorPage;
