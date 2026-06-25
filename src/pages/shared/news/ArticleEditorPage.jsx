import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import AdminButton from "../../../components/admin/ui/AdminButton";
import AdminCard from "../../../components/admin/ui/AdminCard";
import ImageUploader from "../../../components/shared/ImageUploader";
import { getApiErrorMessage } from "../../../utils/apiError";

const slugify = (text) =>
  text.toLowerCase().trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

const ArticleEditorPage = ({ api, basePath }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = id === "new" || !id;

  const [categories, setCategories] = useState([]);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "", slug: "", categoryId: "", thumbnailUrl: "", content: "",
  });

  const loadCategories = useCallback(async () => {
    try {
      const cats = await api.listCategories();
      setCategories(Array.isArray(cats) ? cats : []);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  }, [api]);

  const loadPost = useCallback(async () => {
    if (isNew) return;
    try {
      // Get post list and find by id — simple approach
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  }, [isNew, id]);

  useEffect(() => { loadCategories(); loadPost(); }, [loadCategories, loadPost]);

  const handleTitleChange = (v) => {
    setForm((f) => ({ ...f, title: v, slug: isNew ? slugify(v) : f.slug }));
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.slug.trim() || !form.categoryId || !form.content.trim()) {
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
        tagIds: [],
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
      <AdminButton variant="secondary" onClick={() => navigate(basePath)}>
        ← Danh sách bài viết
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
            <label className="admin-label">Nội dung * (HTML)</label>
            <textarea
              className="admin-input w-full mt-1 font-mono text-xs"
              rows={16}
              value={form.content}
              onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
              placeholder="<p>Nội dung bài viết...</p>"
            />
            <p className="text-xs text-slate-400 mt-1">Hỗ trợ HTML. Xuất bản sau khi lưu.</p>
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
