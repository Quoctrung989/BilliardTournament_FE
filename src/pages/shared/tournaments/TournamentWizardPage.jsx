import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Search, X } from "lucide-react";
import { toast } from "react-toastify";
import AdminButton from "../../../components/admin/ui/AdminButton";
import AdminCard from "../../../components/admin/ui/AdminCard";
import ImageUploader from "../../../components/shared/ImageUploader";
import { ownerBranchApi, managerBranchApi } from "../../../api/branchApi";
import TournamentConfigFieldForm from "../../../components/tournaments/TournamentConfigFieldForm";
import TournamentRaceToOverrides from "../../../components/tournaments/TournamentRaceToOverrides";
import TournamentWizardStepper from "../../../components/tournaments/TournamentWizardStepper";
import { PARTICIPANT_TYPES, SEEDING_OPTIONS, TOURNAMENT_STATUS_LABELS } from "../../../constants/tournamentConfig";
import {
  getApiErrorMessage,
  getApiValidationDetails,
} from "../../../utils/apiError";

const defaultBasic = {
  name: "",
  description: "",
  thumbnailUrl: "",
  bannerUrl: "",
  gameType: "",
  format: "",
  branchId: "",
  participantType: "SINGLE",
  maxParticipants: 16,
  entryFee: "",
  prizePool: "",
  prizeDescription: "",
  registrationDeadline: "",
  startAt: "",
  endAt: "",
  isRegister: false,
  registrationFormTemplateId: "",
};

const toInstantOrNull = (localValue) => {
  if (!localValue) return null;
  const d = new Date(localValue);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
};

const toLocalInput = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

/** "YYYY-MM-DDTHH:mm" từ một Date object, dùng cho thuộc tính min */
const toMinAttr = (date) => toLocalInput(date.toISOString());

const NOW_MIN = toMinAttr(new Date());

/**
 * Validate 3 trường ngày. Trả về object { registrationDeadline, startAt, endAt }
 * với chuỗi lỗi (rỗng = hợp lệ).
 */
const validateDates = ({ registrationDeadline, startAt, endAt }) => {
  const now = new Date();
  const errs = { registrationDeadline: "", startAt: "", endAt: "" };

  const rd = registrationDeadline ? new Date(registrationDeadline) : null;
  const sa = startAt ? new Date(startAt) : null;
  const ea = endAt ? new Date(endAt) : null;

  if (rd && rd <= now)
    errs.registrationDeadline = "Hạn đăng ký không được là thời điểm trong quá khứ.";

  if (sa) {
    if (sa <= now)
      errs.startAt = "Ngày bắt đầu thi đấu không được là thời điểm trong quá khứ.";
    else if (rd && sa <= rd)
      errs.startAt = "Ngày bắt đầu thi đấu phải sau hạn đăng ký.";
  }

  if (ea) {
    if (ea <= now)
      errs.endAt = "Ngày kết thúc không được là thời điểm trong quá khứ.";
    else if (rd && ea <= rd)
      errs.endAt = "Ngày kết thúc phải sau hạn đăng ký.";
    else if (sa && ea < sa)
      errs.endAt = "Ngày kết thúc phải từ ngày bắt đầu thi đấu trở đi.";
  }

  return errs;
};

const fmtDateLocal = (localStr) => {
  if (!localStr) return "—";
  try {
    return new Date(localStr).toLocaleString("vi-VN", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  } catch { return localStr; }
};

const buildRaceToOverrides = (rules) =>
  (rules || [])
    .filter((r) => r.isOverridden || r.raceTo !== r.defaultRaceTo)
    .map((r) => ({ roundKey: r.roundKey, raceTo: r.raceTo }));

/** Ô tìm kiếm + chọn 1 chi nhánh tổ chức giải — cùng kiểu giao diện với phần phân quyền
 * chi nhánh của Manager/Staff (ô tìm kiếm + danh sách cuộn), nhưng chỉ chọn được 1. */
const BranchSearchSelect = ({ value, onChange, branches, disabled }) => {
  const [search, setSearch] = useState("");

  const keyword = search.trim().toLowerCase();
  const filtered = keyword
    ? branches.filter((b) => b.name.toLowerCase().includes(keyword))
    : branches;
  const selected = branches.find((b) => String(b.id) === String(value));

  return (
    <div className="space-y-2">
      {selected && (
        <div className="flex flex-wrap gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-medium pl-2.5 pr-1.5 py-1 ring-1 ring-indigo-200">
            {selected.name}
            {!disabled && (
              <button
                type="button"
                onClick={() => onChange("")}
                className="text-indigo-500 hover:text-indigo-700"
                aria-label={`Bỏ chọn ${selected.name}`}
              >
                <X size={12} />
              </button>
            )}
          </span>
        </div>
      )}

      <div className="relative">
        <Search
          size={14}
          className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
        />
        <input
          className="admin-input w-full pl-8 text-sm"
          placeholder="Tìm chi nhánh theo tên..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          disabled={disabled}
        />
      </div>

      <div className="flex flex-col gap-0.5 p-2 rounded-lg border border-slate-100 bg-slate-50/80 max-h-40 overflow-y-auto">
        {branches.length === 0 ? (
          <p className="text-xs text-slate-500 px-1">Chưa có chi nhánh nào khả dụng.</p>
        ) : filtered.length === 0 ? (
          <p className="text-xs text-slate-500 px-1">Không tìm thấy chi nhánh phù hợp.</p>
        ) : (
          filtered.map((b) => (
            <label
              key={b.id}
              className={`flex items-center gap-2 text-sm text-slate-700 px-1.5 py-1 rounded ${
                disabled ? "cursor-not-allowed opacity-60" : "hover:bg-white cursor-pointer"
              }`}
            >
              <input
                type="radio"
                name="tournament-branch"
                checked={String(value) === String(b.id)}
                onChange={() => onChange(String(b.id))}
                disabled={disabled}
              />
              {b.name}
            </label>
          ))
        )}
      </div>
    </div>
  );
};

const TournamentWizardPage = ({ api, basePath, roleLabel = "Owner" }) => {
  const { id: routeId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isNew = location.pathname.endsWith("/new");
  const tournamentId = isNew ? null : Number(routeId);

  const [step, setStep] = useState(() => {
    const s = Number(searchParams.get("step"));
    return s >= 2 && s <= 3 && tournamentId ? s : 1;
  });
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);

  const [gameTypes, setGameTypes] = useState([]);
  const [formats, setFormats] = useState([]);
  const [registrationTemplates, setRegistrationTemplates] = useState([]);
  const [branches, setBranches] = useState([]);
  const [basic, setBasic] = useState(defaultBasic);
  const [tournamentStatus, setTournamentStatus] = useState("DRAFT");

  const branchScope = basePath.startsWith("/owner") ? "owner" : "manager";

  const [dateErrors, setDateErrors] = useState({ registrationDeadline: "", startAt: "", endAt: "" });

  const [seedingMethod, setSeedingMethod] = useState("RANDOM");
  const [configFields, setConfigFields] = useState([]);
  const [raceToRules, setRaceToRules] = useState([]);
  const [resolvedConfig, setResolvedConfig] = useState(null);
  const [validateResult, setValidateResult] = useState(null);

  const loadOptions = useCallback(async () => {
    try {
      const [gt, fm, templates] = await Promise.all([
        api.listGameTypes(),
        api.listFormats(),
        api.listRegistrationFormTemplates?.() ?? Promise.resolve({ items: [] }),
      ]);
      setGameTypes(gt?.items || []);
      setFormats(fm?.items || []);
      setRegistrationTemplates(templates?.items || []);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  }, [api]);

  const loadBranches = useCallback(async () => {
    try {
      const branchApi = branchScope === "owner" ? ownerBranchApi : managerBranchApi;
      const result = await branchApi.listBranches({ page: 0, size: 100 });
      setBranches(result?.content || []);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  }, [branchScope]);

  const loadTournament = useCallback(async () => {
    if (!tournamentId) return;
    setLoading(true);
    try {
      const detail = await api.getTournament(tournamentId);
      setBasic({
        name: detail.name || "",
        description: detail.description || "",
        thumbnailUrl: detail.thumbnailUrl || "",
        bannerUrl: detail.bannerUrl || "",
        gameType: detail.gameType || "",
        format: detail.format || "",
        branchId: detail.branchId ? String(detail.branchId) : "",
        participantType: detail.participantType || "SINGLE",
        maxParticipants: detail.maxParticipants ?? 16,
        entryFee: detail.entryFee ?? "",
        prizePool: detail.prizePool ?? "",
        prizeDescription: detail.prizeDescription || "",
        registrationDeadline: toLocalInput(detail.registrationDeadline),
        startAt: toLocalInput(detail.startAt),
        endAt: toLocalInput(detail.endAt),
        isRegister: !!detail.isRegister,
        registrationFormTemplateId: detail.registrationFormTemplateId
          ? String(detail.registrationFormTemplateId)
          : "",
      });
      setTournamentStatus(detail.status || "DRAFT");
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [api, tournamentId]);

  const loadConfigForm = useCallback(async () => {
    if (!tournamentId) return;
    setLoading(true);
    try {
      const form = await api.getConfigForm(tournamentId);
      setSeedingMethod(form.seedingMethod || "RANDOM");
      setConfigFields(form.fields || []);
      setRaceToRules(form.raceToRules || []);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [api, tournamentId]);

  const loadReview = useCallback(async () => {
    if (!tournamentId) return;
    setLoading(true);
    try {
      const [resolved, validation, form] = await Promise.all([
        api.getResolvedConfig(tournamentId),
        api.validateConfig(tournamentId),
        api.getConfigForm(tournamentId),
      ]);
      setResolvedConfig(resolved);
      setValidateResult(validation);
      setSeedingMethod(form.seedingMethod || "RANDOM");
      setConfigFields(form.fields || []);
      setRaceToRules(form.raceToRules || []);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [api, tournamentId]);

  useEffect(() => {
    const s = Number(searchParams.get("step"));
    if (s >= 1 && s <= 3 && tournamentId) setStep(s);
  }, [searchParams, tournamentId]);

  useEffect(() => { loadOptions(); }, [loadOptions]);
  useEffect(() => { loadBranches(); }, [loadBranches]);
  useEffect(() => {
    if (branches.length === 1 && !basic.branchId) {
      setBasic((b) => ({ ...b, branchId: String(branches[0].id) }));
    }
  }, [branches, basic.branchId]);
  useEffect(() => { if (!isNew) loadTournament(); }, [isNew, loadTournament]);
  useEffect(() => { if (step === 2 && tournamentId) loadConfigForm(); }, [step, tournamentId, loadConfigForm]);
  useEffect(() => { if (step === 3 && tournamentId) loadReview(); }, [step, tournamentId, loadReview]);

  const buildBasicPayload = () => ({
    name: basic.name.trim(),
    description: basic.description?.trim() || null,
    thumbnailUrl: basic.thumbnailUrl?.trim() || "",
    bannerUrl: basic.bannerUrl?.trim() || "",
    gameType: basic.gameType,
    format: basic.format,
    branchId: Number(basic.branchId) || null,
    participantType: basic.participantType,
    maxParticipants: Number(basic.maxParticipants),
    entryFee: basic.entryFee === "" ? 0 : Number(basic.entryFee),
    prizePool: basic.prizePool === "" ? null : Number(basic.prizePool),
    prizeDescription: basic.prizeDescription?.trim() || null,
    registrationDeadline: toInstantOrNull(basic.registrationDeadline),
    startAt: toInstantOrNull(basic.startAt),
    endAt: toInstantOrNull(basic.endAt),
    isRegister: !!basic.isRegister,
    registrationFormTemplateId: basic.isRegister && basic.registrationFormTemplateId
      ? Number(basic.registrationFormTemplateId)
      : null,
  });

  const showValidationToast = (err) => {
    const details = getApiValidationDetails(err);
    if (details?.length) {
      details.forEach((d) =>
        toast.error(`${d.fieldKey || d.field}: ${d.message}`)
      );
      return;
    }
    toast.error(getApiErrorMessage(err));
  };

  /** Cập nhật 1 trường ngày + re-validate toàn bộ 3 trường */
  const handleDateChange = (field, value) => {
    const next = { ...basic, [field]: value };
    setBasic((b) => ({ ...b, [field]: value }));
    setDateErrors(validateDates(next));
  };

  const handleSaveStep1 = async () => {
    if (!basic.name.trim() || !basic.gameType || !basic.format) {
      toast.warn("Vui lòng điền tên, loại bi và thể thức");
      return;
    }
    if (!basic.branchId) {
      toast.warn("Vui lòng chọn chi nhánh tổ chức");
      return;
    }
    if (basic.isRegister && !basic.registrationFormTemplateId) {
      toast.warn("Chọn template form đăng ký khi bật đăng ký online");
      return;
    }
    const errs = validateDates(basic);
    setDateErrors(errs);
    if (Object.values(errs).some(Boolean)) {
      toast.warn("Vui lòng kiểm tra lại các trường ngày tháng");
      return;
    }
    setSaving(true);
    try {
      if (isNew) {
        const created = await api.createTournament(buildBasicPayload());
        toast.success("Đã tạo giải đấu");
        navigate(`${basePath}/${created.id}?step=2`, { replace: true });
      } else {
        await api.updateTournament(tournamentId, buildBasicPayload());
        toast.success("Đã cập nhật thông tin giải");
        setStep(2);
      }
    } catch (err) {
      showValidationToast(err);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveStep2 = async () => {
    if (!tournamentId) return;
    setSaving(true);
    try {
      await api.saveConfig(tournamentId, {
        seedingMethod,
        fields: configFields.map((f) => ({
          fieldKey: f.fieldKey,
          value: String(f.value ?? f.defaultValue ?? ""),
        })),
        raceToOverrides: buildRaceToOverrides(raceToRules),
      });
      toast.success("Đã lưu cấu hình giải");
      setStep(3);
    } catch (err) {
      showValidationToast(err);
    } finally {
      setSaving(false);
    }
  };

  const handleOpenRegistration = async () => {
    if (!tournamentId) return;
    setSaving(true);
    try {
      const validation = await api.validateConfig(tournamentId);
      if (!validation.isValid) {
        setValidateResult(validation);
        toast.error("Config chưa hợp lệ — kiểm tra lỗi bên dưới");
        return;
      }
      await api.patchStatus(tournamentId, { status: "OPEN_FOR_REGISTRATION" });
      toast.success("Đã mở đăng ký giải đấu");
      navigate(`${basePath}/${tournamentId}`);
    } catch (err) {
      showValidationToast(err);
    } finally {
      setSaving(false);
    }
  };

  const selectedGameTypeName = gameTypes.find((g) => g.code === basic.gameType)?.name || basic.gameType;
  const selectedFormatName = formats.find((f) => f.code === basic.format)?.name || basic.format;
  const selectedTemplateName = registrationTemplates.find(
    (t) => String(t.id) === String(basic.registrationFormTemplateId)
  )?.name;

  if (loading && step === 1 && !isNew && !basic.name) {
    return <p className="text-slate-500 py-12 text-center">Đang tải...</p>;
  }

  return (
    <div>
      <TournamentWizardStepper currentStep={step} />

      {/* ── STEP 1: Basic info ── */}
      {step === 1 && (
        <AdminCard title="Bước 1 — Thông tin giải">
          {!isNew && tournamentStatus !== "DRAFT" && (
            <div className="mb-4 px-4 py-2 rounded-lg bg-amber-50 border border-amber-200 text-sm text-amber-800">
              Giải đang ở trạng thái <strong>{TOURNAMENT_STATUS_LABELS[tournamentStatus]}</strong> — một số trường không thể chỉnh.
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="admin-label">Tên giải *</label>
              <input
                className="admin-input w-full"
                placeholder="VD: CLB Bi-a FPT — Mở rộng 9-Ball 2026"
                value={basic.name}
                onChange={(e) => setBasic((b) => ({ ...b, name: e.target.value }))}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="admin-label">Mô tả</label>
              <textarea
                className="admin-input w-full min-h-[80px]"
                placeholder="Giới thiệu ngắn về giải đấu..."
                value={basic.description}
                onChange={(e) => setBasic((b) => ({ ...b, description: e.target.value }))}
              />
            </div>

            <div>
              <ImageUploader
                label="Ảnh thumbnail"
                folder="tournament-thumbnails"
                previewUrl={basic.thumbnailUrl}
                aspectClass="h-40 w-full rounded-xl"
                onUpload={({ objectKey }) =>
                  setBasic((b) => ({ ...b, thumbnailUrl: objectKey }))
                }
              />
            </div>

            <div>
              <ImageUploader
                label="Ảnh banner"
                folder="tournament-banners"
                previewUrl={basic.bannerUrl}
                aspectClass="h-40 w-full rounded-xl"
                onUpload={({ objectKey }) =>
                  setBasic((b) => ({ ...b, bannerUrl: objectKey }))
                }
              />
            </div>

            <div>
              <label className="admin-label">Loại bi *</label>
              <select
                className="admin-select w-full"
                value={basic.gameType}
                onChange={(e) => setBasic((b) => ({ ...b, gameType: e.target.value }))}
              >
                <option value="">-- Chọn loại bi --</option>
                {gameTypes.map((g) => (
                  <option key={g.code} value={g.code}>{g.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="admin-label">Thể thức *</label>
              <select
                className="admin-select w-full"
                value={basic.format}
                onChange={(e) => setBasic((b) => ({ ...b, format: e.target.value }))}
                disabled={!isNew && tournamentStatus !== "DRAFT"}
              >
                <option value="">-- Chọn thể thức --</option>
                {formats.map((f) => (
                  <option key={f.code} value={f.code}>{f.name}</option>
                ))}
              </select>
              {!isNew && tournamentStatus !== "DRAFT" && (
                <p className="text-xs text-slate-400 mt-1">Không thể đổi thể thức sau khi rời trạng thái Nháp.</p>
              )}
            </div>

            <div>
              <label className="admin-label">Chi nhánh tổ chức *</label>
              {branches.length <= 1 ? (
                <input
                  className="admin-input w-full bg-slate-50"
                  value={branches[0]?.name || "Chưa có chi nhánh khả dụng"}
                  readOnly
                />
              ) : (
                <BranchSearchSelect
                  value={basic.branchId}
                  onChange={(branchId) => setBasic((b) => ({ ...b, branchId }))}
                  branches={branches}
                  disabled={!isNew && tournamentStatus !== "DRAFT"}
                />
              )}
              {branches.length === 0 && (
                <p className="text-xs text-amber-600 mt-1">
                  Chưa có chi nhánh nào khả dụng — tạo chi nhánh trước khi tạo giải.
                </p>
              )}
            </div>

            <div>
              <label className="admin-label">Hình thức tham gia</label>
              <select
                className="admin-select w-full"
                value={basic.participantType}
                onChange={(e) => setBasic((b) => ({ ...b, participantType: e.target.value }))}
              >
                {PARTICIPANT_TYPES.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="admin-label">Số người tối đa</label>
              <input
                type="number"
                min={2}
                className="admin-input w-full"
                value={basic.maxParticipants}
                onChange={(e) => setBasic((b) => ({ ...b, maxParticipants: e.target.value }))}
              />
            </div>

            <div>
              <label className="admin-label">Phí đăng ký (VNĐ)</label>
              <input
                type="number"
                min={0}
                className="admin-input w-full"
                placeholder="0 = miễn phí"
                value={basic.entryFee}
                onChange={(e) => setBasic((b) => ({ ...b, entryFee: e.target.value }))}
              />
            </div>

            <div>
              <label className="admin-label">Tổng giải thưởng (VNĐ)</label>
              <input
                type="number"
                min={0}
                className="admin-input w-full"
                placeholder="Tùy chọn"
                value={basic.prizePool}
                onChange={(e) => setBasic((b) => ({ ...b, prizePool: e.target.value }))}
              />
            </div>

            <div className="sm:col-span-2">
              <label className="admin-label">Cơ cấu giải thưởng</label>
              <input
                className="admin-input w-full"
                placeholder="VD: Vô địch 4tr | Á quân 2.4tr | Hạng 3 1.6tr"
                value={basic.prizeDescription}
                onChange={(e) => setBasic((b) => ({ ...b, prizeDescription: e.target.value }))}
              />
            </div>

            <div>
              <label className="admin-label">Hạn đăng ký</label>
              <input
                type="datetime-local"
                className={`admin-input w-full ${dateErrors.registrationDeadline ? "border-rose-400 focus:ring-rose-300" : ""}`}
                value={basic.registrationDeadline}
                min={NOW_MIN}
                onChange={(e) => handleDateChange("registrationDeadline", e.target.value)}
              />
              {dateErrors.registrationDeadline && (
                <p className="mt-1 text-xs text-rose-600">{dateErrors.registrationDeadline}</p>
              )}
            </div>

            <div>
              <label className="admin-label">Bắt đầu thi đấu</label>
              <input
                type="datetime-local"
                className={`admin-input w-full ${dateErrors.startAt ? "border-rose-400 focus:ring-rose-300" : ""}`}
                value={basic.startAt}
                min={basic.registrationDeadline || NOW_MIN}
                onChange={(e) => handleDateChange("startAt", e.target.value)}
              />
              {dateErrors.startAt && (
                <p className="mt-1 text-xs text-rose-600">{dateErrors.startAt}</p>
              )}
            </div>

            <div>
              <label className="admin-label">Kết thúc</label>
              <input
                type="datetime-local"
                className={`admin-input w-full ${dateErrors.endAt ? "border-rose-400 focus:ring-rose-300" : ""}`}
                value={basic.endAt}
                min={basic.startAt || basic.registrationDeadline || NOW_MIN}
                onChange={(e) => handleDateChange("endAt", e.target.value)}
              />
              {dateErrors.endAt && (
                <p className="mt-1 text-xs text-rose-600">{dateErrors.endAt}</p>
              )}
            </div>

            {/* Registration toggle */}
            <div className="sm:col-span-2 pt-3 border-t border-slate-100">
              <label className="flex items-center gap-3 text-sm font-medium text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded"
                  checked={basic.isRegister}
                  onChange={(e) =>
                    setBasic((b) => ({
                      ...b,
                      isRegister: e.target.checked,
                      registrationFormTemplateId: e.target.checked ? b.registrationFormTemplateId : "",
                    }))
                  }
                />
                <span>
                  Cho phép người chơi đăng ký online
                  <span className="block text-xs font-normal text-slate-400 mt-0.5">
                    Player sẽ điền form và nộp qua hệ thống. Cần chọn template form bên dưới.
                  </span>
                </span>
              </label>
            </div>

            {basic.isRegister && (
              <div className="sm:col-span-2">
                <label className="admin-label">Template form đăng ký *</label>
                {registrationTemplates.length === 0 ? (
                  <p className="text-sm text-amber-700 bg-amber-50 px-3 py-2 rounded-lg">
                    Chưa có template nào. Admin cần tạo template trước.
                  </p>
                ) : (
                  <select
                    className="admin-select w-full"
                    value={basic.registrationFormTemplateId}
                    onChange={(e) => setBasic((b) => ({ ...b, registrationFormTemplateId: e.target.value }))}
                  >
                    <option value="">-- Chọn template --</option>
                    {registrationTemplates.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.code}) — {t.fieldCount ?? 0} field
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <AdminButton variant="secondary" onClick={() => navigate(basePath)}>
              Hủy
            </AdminButton>
            <AdminButton variant="primary" onClick={handleSaveStep1} disabled={saving}>
              {saving ? "Đang lưu..." : isNew ? "Tạo giải & tiếp tục" : "Lưu & tiếp tục"}
            </AdminButton>
          </div>
        </AdminCard>
      )}

      {/* ── STEP 2: Config ── */}
      {step === 2 && (
        <AdminCard title="Bước 2 — Cấu hình thi đấu">
          {loading ? (
            <p className="text-slate-500 py-8 text-center">Đang tải form cấu hình...</p>
          ) : (
            <>
              <p className="text-sm text-slate-500 mb-6">
                Các giá trị mặc định do Admin thiết lập. {roleLabel} có thể chỉnh theo yêu cầu giải.
              </p>

              <div className="mb-6 max-w-md">
                <label className="admin-label">Phương thức xếp hạt giống *</label>
                <select
                  className="admin-select w-full"
                  value={seedingMethod}
                  onChange={(e) => setSeedingMethod(e.target.value)}
                >
                  {SEEDING_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>

              <h3 className="text-sm font-semibold text-slate-700 mb-3">Trường cấu hình giải</h3>
              <TournamentConfigFieldForm fields={configFields} onChange={setConfigFields} />

              <h3 className="text-sm font-semibold text-slate-700 mt-8 mb-3">Race-to theo vòng đấu</h3>
              <TournamentRaceToOverrides rules={raceToRules} onChange={setRaceToRules} />

              <div className="flex justify-between gap-2 mt-6 pt-4 border-t border-slate-100">
                <AdminButton variant="secondary" onClick={() => setStep(1)}>
                  ← Bước 1
                </AdminButton>
                <AdminButton variant="primary" onClick={handleSaveStep2} disabled={saving}>
                  {saving ? "Đang lưu..." : "Lưu config & xem lại →"}
                </AdminButton>
              </div>
            </>
          )}
        </AdminCard>
      )}

      {/* ── STEP 3: Review ── */}
      {step === 3 && (
        <div className="space-y-4">
          <AdminCard title="Bước 3 — Xem lại & mở đăng ký">
            {loading ? (
              <p className="text-slate-500 py-8 text-center">Đang tải...</p>
            ) : (
              <>
                {/* Validation errors */}
                {validateResult && !validateResult.isValid && (
                  <div className="mb-5 p-4 rounded-lg bg-red-50 border border-red-200">
                    <p className="text-sm font-semibold text-red-800 mb-2">
                      ⚠ Cấu hình chưa hợp lệ — không thể mở đăng ký
                    </p>
                    <ul className="text-sm text-red-700 list-disc pl-5 space-y-1">
                      {(validateResult.errors || []).map((e, i) => (
                        <li key={i}>
                          <span className="font-medium">{e.fieldKey || e.field}</span>: {e.message}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {validateResult?.isValid && (
                  <div className="mb-5 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-sm text-emerald-800">
                    ✓ Cấu hình hợp lệ — sẵn sàng mở đăng ký
                  </div>
                )}

                {/* Summary info */}
                <div className="grid gap-3 sm:grid-cols-2 text-sm mb-6">
                  <div>
                    <p className="text-xs text-slate-400 uppercase mb-1">Tên giải</p>
                    <p className="font-semibold text-slate-900">{basic.name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 uppercase mb-1">Loại bi · Thể thức</p>
                    <p className="font-medium">{selectedGameTypeName || "—"} · {selectedFormatName || "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 uppercase mb-1">Số người tối đa</p>
                    <p className="font-medium">{basic.maxParticipants}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 uppercase mb-1">Phí đăng ký</p>
                    <p className="font-medium">
                      {!basic.entryFee || Number(basic.entryFee) === 0
                        ? "Miễn phí"
                        : `${Number(basic.entryFee).toLocaleString("vi-VN")} đ`}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 uppercase mb-1">Hạn đăng ký</p>
                    <p className="font-medium">{fmtDateLocal(basic.registrationDeadline)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 uppercase mb-1">Bắt đầu thi đấu</p>
                    <p className="font-medium">{fmtDateLocal(basic.startAt)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 uppercase mb-1">Đăng ký online</p>
                    <p className="font-medium">
                      {basic.isRegister
                        ? `Có${selectedTemplateName ? ` — ${selectedTemplateName}` : ""}`
                        : "Không"}
                    </p>
                  </div>
                  {resolvedConfig && (
                    <div>
                      <p className="text-xs text-slate-400 uppercase mb-1">Xếp hạt giống</p>
                      <p className="font-medium">{resolvedConfig.seedingMethod}</p>
                    </div>
                  )}
                </div>

                {/* Config fields */}
                {configFields.length > 0 && (
                  <div className="mb-6">
                    <p className="text-xs text-slate-400 uppercase mb-3">Cấu hình giải</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {configFields.map((field) => {
                        const val = field.value ?? field.defaultValue;
                        const isBool = field.uiComponent === "CHECKBOX";
                        const boolOn = isBool ? String(val) === "true" : false;
                        return (
                          <div key={field.fieldKey} className="admin-card p-4">
                            <div className="flex items-start justify-between gap-2 mb-1.5">
                              <p className="font-medium text-slate-800 text-sm leading-snug">
                                {field.label || field.fieldKey}
                              </p>
                              {field.source && (
                                <span className="flex-shrink-0 text-[10px] uppercase tracking-wide text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                                  {field.source === "TOURNAMENT" ? "Đã chỉnh" : "Mặc định"}
                                </span>
                              )}
                            </div>
                            {field.description && (
                              <p className="text-xs text-slate-500 mb-2 leading-relaxed">{field.description}</p>
                            )}
                            <div className="pt-1 border-t border-slate-100 mt-2">
                              {isBool ? (
                                <span className={`inline-flex items-center gap-1.5 text-sm font-semibold ${boolOn ? "text-green-700" : "text-slate-400"}`}>
                                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${boolOn ? "bg-green-500" : "bg-slate-300"}`} />
                                  {boolOn ? "Kích hoạt" : "Tắt"}
                                </span>
                              ) : (
                                <span className="text-sm font-semibold text-slate-900">{String(val ?? "—")}</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Race-to rules */}
                {resolvedConfig?.raceToRules && Object.keys(resolvedConfig.raceToRules).length > 0 && (
                  <div className="mb-6">
                    <p className="text-xs text-slate-400 uppercase mb-2">Race-to theo vòng</p>
                    <div className="bg-slate-50 rounded-lg border border-slate-100 divide-y divide-slate-100">
                      {Object.entries(resolvedConfig.raceToRules).map(([roundKey, raceTo]) => {
                        const isOverridden = resolvedConfig.overriddenRounds?.includes(roundKey);
                        return (
                          <div key={roundKey} className="flex justify-between items-center px-4 py-2 text-sm">
                            <span className="text-slate-600 capitalize">
                              {roundKey.replace(/_/g, " ")}
                            </span>
                            <span className="flex items-center gap-2">
                              <span className="font-semibold text-slate-800">Race to {raceTo}</span>
                              {isOverridden && (
                                <span className="text-xs bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded">
                                  Override
                                </span>
                              )}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap justify-between gap-2 pt-4 border-t border-slate-100">
                  <AdminButton variant="secondary" onClick={() => setStep(2)}>
                    ← Chỉnh config
                  </AdminButton>
                  <div className="flex gap-2">
                    <AdminButton
                      variant="secondary"
                      onClick={() => navigate(`${basePath}/${tournamentId}`)}
                    >
                      Lưu nháp
                    </AdminButton>
                    <AdminButton
                      variant="primary"
                      onClick={handleOpenRegistration}
                      disabled={saving || (validateResult && !validateResult.isValid)}
                    >
                      {saving ? "Đang xử lý..." : "Mở đăng ký →"}
                    </AdminButton>
                  </div>
                </div>
              </>
            )}
          </AdminCard>
        </div>
      )}
    </div>
  );
};

export default TournamentWizardPage;
