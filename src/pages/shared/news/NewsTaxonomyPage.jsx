import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Plus } from "lucide-react";
import AdminButton from "../../../components/admin/ui/AdminButton";
import AdminCard from "../../../components/admin/ui/AdminCard";
import AdminModal from "../../../components/admin/ui/AdminModal";
import { newsTagsApi } from "../../../api/newsApi";
import { getApiErrorMessage } from "../../../utils/apiError";

const slugify = (text) =>
  text.toLowerCase().trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

const EMPTY_FORM = { name: "", slug: "" };

const NewsTaxonomyPage = ({ api }) => {
  const [tab, setTab] = useState("categories");

  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [tags, setTags] = useState([]);
  const [loadingTags, setLoadingTags] = useState(true);

  const [formMode, setFormMode] = useState(null); // "create-category" | "edit-category" | "create-tag" | "edit-tag"
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleteTagModal, setDeleteTagModal] = useState(null);

  const loadCategories = useCallback(async () => {
    setLoadingCategories(true);
    try {
      const list = await api.listCategories();
      setCategories(Array.isArray(list) ? list : []);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setLoadingCategories(false);
    }
  }, [api]);

  const loadTags = useCallback(async () => {
    setLoadingTags(true);
    try {
      const list = await newsTagsApi.listTags();
      setTags(Array.isArray(list) ? list : []);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setLoadingTags(false);
    }
  }, []);

  useEffect(() => { loadCategories(); loadTags(); }, [loadCategories, loadTags]);

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setFormMode(tab === "categories" ? "create-category" : "create-tag");
  };

  const openEdit = (row) => {
    setForm({ name: row.name, slug: row.slug });
    setEditingId(row.id);
    setFormMode(tab === "categories" ? "edit-category" : "edit-tag");
  };

  const closeForm = () => {
    setFormMode(null);
    setSaving(false);
  };

  const handleNameChange = (v) => {
    setForm((f) => ({ ...f, name: v, slug: editingId ? f.slug : slugify(v) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.slug.trim()) {
      toast.warn("Vui lòng điền đầy đủ tên và slug");
      return;
    }
    setSaving(true);
    const body = { name: form.name.trim(), slug: form.slug.trim() };
    try {
      const isCategory = formMode?.endsWith("category");
      const isCreate = formMode?.startsWith("create");
      if (isCategory) {
        if (isCreate) {
          await api.createCategory(body);
          toast.success("Đã tạo danh mục");
        } else {
          await api.updateCategory(editingId, body);
          toast.success("Đã cập nhật danh mục");
        }
        loadCategories();
      } else {
        if (isCreate) {
          await newsTagsApi.createTag(body);
          toast.success("Đã tạo thẻ");
        } else {
          await newsTagsApi.updateTag(editingId, body);
          toast.success("Đã cập nhật thẻ");
        }
        loadTags();
      }
      closeForm();
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleToggleCategoryStatus = async (row) => {
    const nextStatus = row.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    try {
      await api.setCategoryStatus(row.id, nextStatus);
      setCategories((prev) => prev.map((c) => (c.id === row.id ? { ...c, status: nextStatus } : c)));
      toast.success(nextStatus === "ACTIVE" ? "Đã kích hoạt danh mục" : "Đã tắt danh mục");
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  const handleDeleteTag = async () => {
    if (!deleteTagModal) return;
    setSaving(true);
    try {
      await newsTagsApi.deleteTag(deleteTagModal.id);
      setTags((prev) => prev.filter((t) => t.id !== deleteTagModal.id));
      toast.success("Đã xoá thẻ");
      setDeleteTagModal(null);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const isCategoryTab = tab === "categories";

  return (
    <div className="space-y-5">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setTab("categories")}
          className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${isCategoryTab ? "bg-[#010851] text-white" : "bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-white/70 hover:bg-slate-200 dark:hover:bg-white/10"}`}
        >
          Danh mục
        </button>
        <button
          type="button"
          onClick={() => setTab("tags")}
          className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${!isCategoryTab ? "bg-[#010851] text-white" : "bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-white/70 hover:bg-slate-200 dark:hover:bg-white/10"}`}
        >
          Thẻ
        </button>
      </div>

      <AdminCard padding={false}>
        <div className="p-5 flex items-center justify-between border-b border-slate-100 dark:border-white/10">
          <h2 className="font-semibold text-slate-900 dark:text-white">{isCategoryTab ? "Danh mục bài viết" : "Thẻ bài viết"}</h2>
          <AdminButton variant="primary" onClick={openCreate} className="flex items-center gap-1.5">
            <Plus size={15} />
            {isCategoryTab ? "Tạo danh mục" : "Tạo thẻ"}
          </AdminButton>
        </div>

        <div className="admin-table-wrap">
          {isCategoryTab ? (
            loadingCategories ? (
              <div className="admin-empty">Đang tải...</div>
            ) : categories.length === 0 ? (
              <div className="admin-empty">Chưa có danh mục nào.</div>
            ) : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Tên</th>
                    <th>Slug</th>
                    <th className="align-center">Trạng thái</th>
                    <th className="align-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((row) => (
                    <tr key={row.id}>
                      <td className="font-medium text-slate-900 dark:text-white">{row.name}</td>
                      <td className="text-sm text-slate-500 dark:text-white/60">{row.slug}</td>
                      <td className="align-center">
                        <button
                          type="button"
                          role="switch"
                          aria-checked={row.status === "ACTIVE"}
                          className="admin-toggle"
                          data-on={row.status === "ACTIVE"}
                          onClick={() => handleToggleCategoryStatus(row)}
                        >
                          <span className="admin-toggle-knob" />
                        </button>
                      </td>
                      <td className="align-right">
                        <div className="admin-table-actions">
                          <button type="button" className="admin-table-action" title="Sửa" onClick={() => openEdit(row)}>
                            Sửa
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          ) : loadingTags ? (
            <div className="admin-empty">Đang tải...</div>
          ) : tags.length === 0 ? (
            <div className="admin-empty">Chưa có thẻ nào.</div>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Tên</th>
                  <th>Slug</th>
                  <th className="align-right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {tags.map((row) => (
                  <tr key={row.id}>
                    <td className="font-medium text-slate-900 dark:text-white">{row.name}</td>
                    <td className="text-sm text-slate-500 dark:text-white/60">{row.slug}</td>
                    <td className="align-right">
                      <div className="admin-table-actions">
                        <button type="button" className="admin-table-action" title="Sửa" onClick={() => openEdit(row)}>
                          Sửa
                        </button>
                        <button
                          type="button"
                          className="admin-table-action text-red-500"
                          title="Xoá"
                          onClick={() => setDeleteTagModal(row)}
                        >
                          Xoá
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </AdminCard>

      <AdminModal
        open={!!formMode}
        onClose={closeForm}
        title={
          formMode === "create-category" ? "Tạo danh mục" :
          formMode === "edit-category" ? "Sửa danh mục" :
          formMode === "create-tag" ? "Tạo thẻ" : "Sửa thẻ"
        }
        footer={
          <>
            <AdminButton variant="secondary" onClick={closeForm} disabled={saving}>Hủy</AdminButton>
            <AdminButton type="submit" form="taxonomy-form" disabled={saving}>
              {saving ? "Đang lưu..." : "Lưu"}
            </AdminButton>
          </>
        }
      >
        <form id="taxonomy-form" onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="admin-label">Tên *</label>
            <input
              className="admin-input w-full mt-1"
              value={form.name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Tên hiển thị"
            />
          </div>
          <div>
            <label className="admin-label">Slug *</label>
            <input
              className="admin-input w-full mt-1"
              value={form.slug}
              onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
              placeholder="ten-hien-thi"
            />
          </div>
        </form>
      </AdminModal>

      <AdminModal
        open={!!deleteTagModal}
        onClose={() => setDeleteTagModal(null)}
        title="Xoá thẻ"
        footer={
          <>
            <AdminButton variant="secondary" onClick={() => setDeleteTagModal(null)}>Hủy</AdminButton>
            <AdminButton variant="danger" onClick={handleDeleteTag} disabled={saving}>Xoá</AdminButton>
          </>
        }
      >
        <p className="text-slate-600 dark:text-white/70">Xoá thẻ <strong>"{deleteTagModal?.name}"</strong>?</p>
      </AdminModal>
    </div>
  );
};

export default NewsTaxonomyPage;
