import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, MapPin, Navigation, Phone, Image as ImageIcon, PhoneCall } from "lucide-react";
import { toast } from "react-toastify";
import { getPublicBranchDetail } from "../../api/publicBranchApi";
import { getApiErrorMessage } from "../../utils/apiError";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1615488107055-cf8dd25d6cf7?q=80&w=1200&auto=format&fit=crop";

/** "140 ..., phường Từ Liêm, thành phố Hà Nội" → "phường Từ Liêm, thành phố Hà Nội" */
const extractRegionLabel = (address) => {
  if (!address) return null;
  const parts = address.split(",").map((p) => p.trim()).filter(Boolean);
  if (parts.length === 0) return null;
  return parts.slice(-2).join(", ");
};

const fmtMonthYear = (iso) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("vi-VN", { month: "2-digit", year: "numeric" });
};

const telHref = (phone) => `tel:${(phone || "").replace(/[^\d+]/g, "")}`;
const mapsHref = (address) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;

const StatFact = ({ label, value }) => (
  <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#161a22] px-4 py-3.5 shadow-sm">
    <p className="text-[0.62rem] font-bold uppercase tracking-widest text-slate-400 dark:text-white/40">
      {label}
    </p>
    <p className="mt-1 text-base font-bold text-slate-900 dark:text-white">{value}</p>
  </div>
);

const BranchDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [branch, setBranch] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getPublicBranchDetail(id);
      setBranch(data);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
      navigate("/branches");
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return <div className="w-full bg-white dark:bg-[#0b0d12] py-24 text-center text-slate-400 dark:text-white/50">Đang tải...</div>;
  }
  if (!branch) return null;

  const images = branch.images && branch.images.length > 0 ? branch.images : [];
  const heroPhoto = images[0]?.url || FALLBACK_IMAGE;
  const region = extractRegionLabel(branch.address);

  return (
    <div className="w-full bg-white dark:bg-[#0b0d12] transition-colors duration-300">
      {/* ── Hero ── */}
      <div className="relative overflow-hidden bg-white dark:bg-[#0b0d12] border-b border-slate-100 dark:border-white/10">
        <div className="relative max-w-[1300px] mx-auto px-8 pt-6 pb-10">
          <button
            type="button"
            onClick={() => navigate("/branches")}
            className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-white/50 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft size={14} />
            Hệ thống cơ sở
          </button>

          <div className="mt-6 grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-8 items-center">
            <div>
              {region && (
                <p className="text-xs font-bold uppercase tracking-[0.15em] mb-2 text-slate-400 dark:text-white/40">
                  {region}
                </p>
              )}
              <h1 className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white leading-[1.15]">
                {branch.name}
              </h1>
              {branch.description && (
                <p className="mt-4 max-w-lg text-sm sm:text-base text-slate-500 dark:text-white/60 leading-relaxed">
                  {branch.description}
                </p>
              )}

              <div className="mt-7 flex flex-wrap gap-3">
                {branch.phone && (
                  <a
                    href={telHref(branch.phone)}
                    className="inline-flex items-center gap-2 rounded-full bg-black dark:bg-white px-6 py-2.5 text-xs font-bold uppercase tracking-wide text-white dark:text-[#0b0d12] transition-transform hover:scale-105"
                  >
                    <PhoneCall size={14} />
                    Gọi đặt bàn
                  </a>
                )}
                <a
                  href={mapsHref(branch.address)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-slate-300 dark:border-white/20 px-6 py-2.5 text-xs font-bold uppercase tracking-wide text-slate-800 dark:text-white/80 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
                >
                  <Navigation size={14} />
                  Chỉ đường
                </a>
              </div>
            </div>

            <div className="rounded-2xl overflow-hidden shadow-lg border border-slate-200 dark:border-white/10" style={{ aspectRatio: "4/3" }}>
              <img
                src={heroPhoto}
                alt={branch.name}
                className="h-full w-full object-cover"
                onError={(e) => { e.currentTarget.src = FALLBACK_IMAGE; }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="max-w-[1300px] mx-auto px-8 py-10">

        {/* Quick facts */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatFact label="Trạng thái" value="Đang mở cửa" />
          <StatFact label="Hotline" value={branch.phone || "—"} />
          <StatFact label="Hoạt động từ" value={fmtMonthYear(branch.createdAt)} />
          <StatFact label="Số ảnh" value={images.length} />
        </div>

        {/* Address card */}
        <div className="mt-4 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#161a22] p-5 shadow-sm flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 dark:bg-white/10 text-slate-900 dark:text-white">
            <MapPin size={16} />
          </span>
          <div className="min-w-0">
            <p className="text-[0.62rem] font-bold uppercase tracking-widest text-slate-400 dark:text-white/40">Địa chỉ</p>
            <p className="mt-0.5 text-sm font-semibold text-slate-800 dark:text-white/85 break-words">{branch.address}</p>
            <a
              href={mapsHref(branch.address)}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-block text-xs font-bold uppercase tracking-wide text-slate-900 dark:text-white hover:underline"
            >
              Mở trong Google Maps ↗
            </a>
          </div>
        </div>

        {/* Gallery */}
        {images.length > 0 && (
          <div className="mt-10">
            <div className="mb-5 flex items-end justify-between">
              <h2 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                <ImageIcon size={22} className="text-slate-900 dark:text-white" />
                Không gian quán
              </h2>
              <span className="text-sm font-semibold text-slate-400 dark:text-white/40">{images.length} ảnh</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 auto-rows-[140px] sm:auto-rows-[160px]">
              {images.map((img, i) => (
                <a
                  key={img.key || i}
                  href={img.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`relative block overflow-hidden rounded-xl group border border-slate-200 dark:border-white/10 ${i === 0 ? "col-span-2 row-span-2" : ""}`}
                >
                  <img
                    src={img.url}
                    alt={`${branch.name} ${i + 1}`}
                    className="absolute inset-0 h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => { e.currentTarget.src = FALLBACK_IMAGE; }}
                  />
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Floating call button ── */}
      {branch.phone && (
        <a
          href={telHref(branch.phone)}
          className="fixed bottom-6 right-6 z-40 inline-flex items-center gap-2 rounded-full bg-black dark:bg-white px-5 py-3 text-xs font-bold uppercase tracking-wide text-white dark:text-[#0b0d12] shadow-xl hover:scale-105 transition-transform"
        >
          <Phone size={14} />
          Gọi ngay
        </a>
      )}
    </div>
  );
};

export default BranchDetailPage;
