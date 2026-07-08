import { X } from "lucide-react";
import ImageUploader from "../../shared/ImageUploader";

const BranchForm = ({
  form,
  errors = {},
  onChange,
  formId = "branch-form",
  onSubmit,
}) => {
  const images = form.images || [];

  const handleUpload = ({ objectKey, url }) => {
    if (!objectKey) return;
    onChange({ images: [...images, { key: objectKey, url }] });
  };

  const handleRemove = (key) => {
    onChange({ images: images.filter((img) => img.key !== key) });
  };

  return (
    <form id={formId} onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className="admin-label">Tên chi nhánh *</label>
          <input
            className="admin-input mt-1"
            placeholder="VD: CLB Bi-a FPT Quận 9"
            value={form.name}
            onChange={(e) => onChange({ name: e.target.value })}
          />
          {errors.name && <p className="text-xs text-rose-600 mt-1">{errors.name}</p>}
        </div>

        <div className="sm:col-span-2">
          <label className="admin-label">Địa chỉ *</label>
          <input
            className="admin-input mt-1"
            placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành"
            value={form.address}
            onChange={(e) => onChange({ address: e.target.value })}
          />
          {errors.address && <p className="text-xs text-rose-600 mt-1">{errors.address}</p>}
        </div>

        <div>
          <label className="admin-label">Số điện thoại</label>
          <input
            type="tel"
            className="admin-input mt-1"
            value={form.phone}
            onChange={(e) => onChange({ phone: e.target.value })}
          />
        </div>

        <div className="sm:col-span-2">
          <label className="admin-label">Mô tả</label>
          <textarea
            rows={2}
            className="admin-input mt-1"
            value={form.description}
            onChange={(e) => onChange({ description: e.target.value })}
          />
        </div>
      </div>

      <div className="pt-3 border-t border-slate-100">
        <label className="admin-label">Hình ảnh chi nhánh</label>
        <div className="mt-2 flex flex-wrap gap-3">
          {images.map((img) => (
            <div key={img.key} className="relative h-24 w-24 rounded-lg overflow-hidden border border-slate-200 group">
              <img src={img.url} alt="" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => handleRemove(img.key)}
                className="absolute top-1 right-1 p-1 bg-black/60 hover:bg-rose-600 rounded-full text-white transition-colors"
              >
                <X size={12} />
              </button>
            </div>
          ))}
          <ImageUploader
            label=""
            folder="branch-images"
            aspectClass="h-24 w-24 rounded-lg"
            onUpload={handleUpload}
            resetAfterUpload
          />
        </div>
      </div>
    </form>
  );
};

export const validateBranchForm = (form) => {
  const errors = {};
  if (!form.name?.trim()) errors.name = "Tên chi nhánh là bắt buộc";
  if (!form.address?.trim()) errors.address = "Địa chỉ là bắt buộc";

  if (Object.keys(errors).length > 0) return { errors };

  const body = {
    name: form.name.trim(),
    address: form.address.trim(),
    ...(form.phone?.trim() ? { phone: form.phone.trim() } : {}),
    ...(form.description?.trim() ? { description: form.description.trim() } : {}),
    images: (form.images || []).map((img) => img.key),
  };

  return { body, errors: null };
};

export default BranchForm;
