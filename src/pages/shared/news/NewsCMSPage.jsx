import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { Plus, Eye, EyeOff, Trash2, Edit } from "lucide-react";
import AdminButton from "../../../components/admin/ui/AdminButton";
import AdminCard from "../../../components/admin/ui/AdminCard";
import AdminPagination from "../../../components/admin/ui/AdminPagination";
import AdminModal from "../../../components/admin/ui/AdminModal";
import { getApiErrorMessage } from "../../../utils/apiError";
import { buildListParams, DEFAULT_PAGE_SIZE } from "../../../utils/pagination";

const STATUS_STYLES = {
  DRAFT:     "bg-slate-100 text-slate-600",
  PUBLISHED: "bg-emerald-100 text-emerald-800",
  HIDDEN:    "bg-amber-100 text-amber-800",
};
const STATUS_LABELS = { DRAFT: "Nháp", PUBLISHED: "Đã xuất bản", HIDDEN: "Đã ẩn" };

const fmtDate = (iso) => iso ? new Date(iso).toLocaleDateString("vi-VN") : "—";

const NewsCMSPage = ({ api, editorPath }) => {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [deleteModal, setDeleteModal] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await api.listPosts(buildListParams({ page, size: DEFAULT_PAGE_SIZE }));
      setPosts(result.content);
      setTotalPages(result.totalPages);
      setTotalElements(result.totalElements);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [api, page]);

  useEffect(() => { load(); }, [load]);

  const handlePublish = async (id) => {
    setActionLoading(true);
    try {
      await api.publishPost(id);
      setPosts((prev) => prev.map((p) => (p.id === id ? { ...p, status: "PUBLISHED", publishedAt: new Date().toISOString() } : p)));
      toast.success("Đã xuất bản");
    } catch (err) { toast.error(getApiErrorMessage(err)); }
    finally { setActionLoading(false); }
  };

  const handleHide = async (id) => {
    setActionLoading(true);
    try {
      await api.hidePost(id);
      setPosts((prev) => prev.map((p) => (p.id === id ? { ...p, status: "HIDDEN" } : p)));
      toast.success("Đã ẩn bài viết");
    } catch (err) { toast.error(getApiErrorMessage(err)); }
    finally { setActionLoading(false); }
  };

  const handleDelete = async () => {
    if (!deleteModal) return;
    setActionLoading(true);
    try {
      await api.deletePost(deleteModal.id);
      setPosts((prev) => prev.filter((p) => p.id !== deleteModal.id));
      setTotalElements((prev) => Math.max(0, prev - 1));
      toast.success("Đã xoá");
      setDeleteModal(null);
    } catch (err) { toast.error(getApiErrorMessage(err)); }
    finally { setActionLoading(false); }
  };

  return (
    <div className="space-y-5">
      <AdminCard padding={false}>
        <div className="p-5 flex items-center justify-between border-b border-slate-100">
          <h2 className="font-semibold text-slate-900">Bài viết</h2>
          <AdminButton
            variant="primary"
            onClick={() => navigate(`${editorPath}/new`)}
            className="flex items-center gap-1.5"
          >
            <Plus size={15} />
            Tạo bài viết
          </AdminButton>
        </div>

        <div className="admin-table-wrap">
          {loading ? (
            <div className="admin-empty">Đang tải...</div>
          ) : posts.length === 0 ? (
            <div className="admin-empty">Chưa có bài viết nào.</div>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Tiêu đề</th>
                  <th>Danh mục</th>
                  <th>Trạng thái</th>
                  <th>Ngày xuất bản</th>
                  <th className="align-right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {posts.map((post) => (
                  <tr key={post.id}>
                    <td>
                      <p className="font-medium text-slate-900 line-clamp-1">{post.title}</p>
                      <p className="text-xs text-slate-400">/news/{post.slug}</p>
                    </td>
                    <td className="text-sm text-slate-600">{post.categoryName || "—"}</td>
                    <td>
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[post.status] || "bg-slate-100 text-slate-600"}`}>
                        {STATUS_LABELS[post.status] || post.status}
                      </span>
                    </td>
                    <td className="text-sm text-slate-500">{fmtDate(post.publishedAt)}</td>
                    <td className="align-right">
                      <div className="admin-table-actions">
                        <button
                          type="button"
                          className="admin-table-action"
                          title="Sửa"
                          onClick={() => navigate(`${editorPath}/${post.id}`)}
                        >
                          <Edit size={14} />
                        </button>
                        {post.status !== "PUBLISHED" && (
                          <button
                            type="button"
                            className="admin-table-action text-emerald-600"
                            title="Xuất bản"
                            disabled={actionLoading}
                            onClick={() => handlePublish(post.id)}
                          >
                            <Eye size={14} />
                          </button>
                        )}
                        {post.status === "PUBLISHED" && (
                          <button
                            type="button"
                            className="admin-table-action text-amber-600"
                            title="Ẩn"
                            disabled={actionLoading}
                            onClick={() => handleHide(post.id)}
                          >
                            <EyeOff size={14} />
                          </button>
                        )}
                        <button
                          type="button"
                          className="admin-table-action text-red-500"
                          title="Xoá"
                          onClick={() => setDeleteModal({ id: post.id, title: post.title })}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
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
          pageSize={DEFAULT_PAGE_SIZE}
          disabled={loading}
          onPageChange={setPage}
          onPageSizeChange={() => {}}
        />
      </AdminCard>

      <AdminModal
        open={!!deleteModal}
        onClose={() => setDeleteModal(null)}
        title="Xoá bài viết"
        footer={
          <>
            <AdminButton variant="secondary" onClick={() => setDeleteModal(null)}>Hủy</AdminButton>
            <AdminButton variant="danger" onClick={handleDelete} disabled={actionLoading}>Xoá</AdminButton>
          </>
        }
      >
        <p className="text-slate-600">Xoá bài viết <strong>"{deleteModal?.title}"</strong>?</p>
      </AdminModal>
    </div>
  );
};

export default NewsCMSPage;
