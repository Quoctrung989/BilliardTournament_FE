import { useRef, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { uploadImage } from "../../api/storageApi";

const ACCEPTED = "image/jpeg,image/png,image/webp,image/gif";

/**
 * ImageUploader — upload file lên MinIO rồi gọi onUpload({ url, objectKey }).
 *
 * Props:
 *   previewUrl  — URL hiển thị preview hiện tại (có thể là url tạm hoặc objectKey đã resolve)
 *   onUpload    — callback(result: { url, objectKey }) sau khi upload thành công
 *   folder      — MinIO folder (mặc định "avatars")
 *   aspectClass — class Tailwind cho khung ảnh (mặc định "h-36 w-36 rounded-xl")
 *   label       — nhãn hiển thị phía trên
 */
const ImageUploader = ({
  previewUrl = "",
  onUpload,
  folder = "avatars",
  aspectClass = "h-36 w-36 rounded-xl",
  label = "Ảnh",
}) => {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [localPreview, setLocalPreview] = useState("");

  const preview = localPreview || previewUrl;

  const handleFile = async (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Chỉ chấp nhận file ảnh (jpg, png, webp, gif).");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("File quá lớn — tối đa 5 MB.");
      return;
    }
    setError("");
    setLocalPreview(URL.createObjectURL(file));
    setUploading(true);
    try {
      const result = await uploadImage(file, folder);
      onUpload?.(result);
    } catch {
      setError("Upload thất bại. Vui lòng thử lại.");
      setLocalPreview("");
    } finally {
      setUploading(false);
    }
  };

  const handleChange = (e) => handleFile(e.target.files?.[0]);

  const handleDrop = (e) => {
    e.preventDefault();
    handleFile(e.dataTransfer.files?.[0]);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    setLocalPreview("");
    onUpload?.({ url: "", objectKey: "" });
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="flex flex-col gap-1.5">
      {label && <span className="admin-label">{label}</span>}

      <div
        className={`relative group overflow-hidden bg-slate-50 border-2 border-dashed border-slate-200 hover:border-indigo-400 transition-colors cursor-pointer flex items-center justify-center ${aspectClass}`}
        onClick={() => !uploading && inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
      >
        {preview ? (
          <>
            <img
              src={preview}
              alt=""
              className="h-full w-full object-cover"
              onError={() => setLocalPreview("")}
            />
            {/* Overlay khi hover */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <p className="text-white text-xs font-semibold">Đổi ảnh</p>
            </div>
            {/* Nút xóa */}
            {!uploading && (
              <button
                type="button"
                onClick={handleClear}
                className="absolute top-1.5 right-1.5 p-1 bg-black/60 hover:bg-rose-600 rounded-full text-white transition-colors z-10"
              >
                <X size={12} />
              </button>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center gap-2 text-slate-400 select-none">
            <ImagePlus size={28} strokeWidth={1.5} />
            <p className="text-xs text-center leading-tight">
              Nhấn hoặc<br />kéo thả ảnh
            </p>
          </div>
        )}

        {/* Loading overlay */}
        {uploading && (
          <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
            <Loader2 size={24} className="animate-spin text-indigo-500" />
          </div>
        )}
      </div>

      {error && <p className="text-xs text-rose-600">{error}</p>}

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED}
        className="hidden"
        onChange={handleChange}
      />
    </div>
  );
};

export default ImageUploader;
