import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, Search, X } from "lucide-react";
import { toast } from "react-toastify";
import AdminButton from "../../../components/admin/ui/AdminButton";
import AdminCard from "../../../components/admin/ui/AdminCard";
import ImageUploader from "../../../components/shared/ImageUploader";
import RegistrationFormPreviewPanel from "../../../components/registration-form/RegistrationFormPreviewPanel";
import { ownerBranchApi, managerBranchApi } from "../../../api/branchApi";
import TournamentConfigFieldForm from "../../../components/tournaments/TournamentConfigFieldForm";
import TournamentRaceToOverrides from "../../../components/tournaments/TournamentRaceToOverrides";
import TournamentWizardStepper from "../../../components/tournaments/TournamentWizardStepper";
import { PARTICIPANT_TYPES, SEEDING_OPTIONS, TOURNAMENT_STATUS_LABELS } from "../../../constants/tournamentConfig";
import {
  getApiErrorMessage,
  getApiValidationDetails,
} from "../../../utils/apiError";

/** Query intent khi vào wizard từ lỗi đóng đăng ký (TOURNAMENT_010). */
const INTENT_CLOSE_REGISTRATION = "close-registration";

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
  tableCount: 4,
  entryFee: "",
  prizePool: "",
  prizeDescription: "",
  registrationDeadline: "",
  startAt: "",
  endAt: "",
  isRegister: false,
  isShowTournament: false,
  isPublicRatio: false,
  registrationFormTemplateId: "",
};

/**
 * Bước nhảy của nút +/- ở ô "Tổng giải thưởng".
 *
 * Giải thưởng thực tế toàn ở mức vài triệu tới vài chục triệu, mà mũi tên mặc
 * định của `input[type=number]` chỉ nhảy 1 đồng — bấm cả ngày không tới đâu.
 * Vẫn cho gõ tay số lẻ, hai nút này chỉ là lối tắt.
 */
const PRIZE_STEP = 1_000_000;

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

/* Bảng preset cố định số người đi tiếp mỗi giai đoạn (PROGRESSIVE_ROUND_ROBIN) theo số người tham gia. */
const PROGRESSIVE_PRESETS = {
  6: "4", 8: "6,4", 10: "6,4", 12: "8,4", 16: "10,6,4", 24: "16,10,6,4", 32: "20,12,8,4",
};
const roundEven = (x) => { const r = Math.round(x); return r % 2 === 0 ? r : r + 1; };
/** Suy ra chuỗi survivors từ số người tham gia: dùng bảng cố định, nếu không có thì theo công thức S×0.6. */
const progressiveSurvivorsPreset = (max, playoffSize = 4) => {
  if (PROGRESSIVE_PRESETS[max]) return PROGRESSIVE_PRESETS[max];
  const out = [];
  let s = max;
  while (true) {
    const next = Math.max(playoffSize, roundEven(s * 0.6));
    if (next >= s) break;
    out.push(next);
    s = next;
    if (next === playoffSize) break;
  }
  if (out.length === 0 || out[out.length - 1] !== playoffSize) out.push(playoffSize);
  return out.join(",");
};


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
          className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-white/40"
        />
        <input
          className="admin-input w-full pl-8 text-sm"
          placeholder="Tìm chi nhánh theo tên..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          disabled={disabled}
        />
      </div>

      <div className="flex flex-col gap-0.5 p-2 rounded-lg border border-slate-100 dark:border-white/10 bg-slate-50/80 max-h-40 overflow-y-auto">
        {branches.length === 0 ? (
          <p className="text-xs text-slate-500 dark:text-white/60 px-1">Chưa có chi nhánh nào khả dụng.</p>
        ) : filtered.length === 0 ? (
          <p className="text-xs text-slate-500 dark:text-white/60 px-1">Không tìm thấy chi nhánh phù hợp.</p>
        ) : (
          filtered.map((b) => (
            <label
              key={b.id}
              className={`flex items-center gap-2 text-sm text-slate-700 dark:text-white/75 px-1.5 py-1 rounded ${
                disabled ? "cursor-not-allowed opacity-60" : "hover:bg-white dark:hover:bg-white/5 cursor-pointer"
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
  const [approvedCount, setApprovedCount] = useState(0);
  /** Optimistic lock: version đọc lúc load form, gửi lại khi lưu để backend phát hiện xung đột
   * (2 người cùng sửa 1 giải). null = bỏ qua kiểm tra (chưa load hoặc giải mới tạo). */
  const [tournamentVersion, setTournamentVersion] = useState(null);
  /** Vào từ lỗi đóng ĐK (TOURNAMENT_010) → chỉnh survivors rồi lưu + đóng luôn. */
  const closeRegistrationIntent = searchParams.get("intent") === INTENT_CLOSE_REGISTRATION;
  const isCloseRegistrationMode =
    closeRegistrationIntent && tournamentStatus === "OPEN_FOR_REGISTRATION";
  const closePresetAppliedRef = useRef(false);

  const branchScope = basePath.startsWith("/owner") ? "owner" : "manager";

  const [dateErrors, setDateErrors] = useState({ registrationDeadline: "", startAt: "", endAt: "" });
  const [fieldErrors, setFieldErrors] = useState({});

  const [seedingMethod, setSeedingMethod] = useState("RANDOM");
  const [configFields, setConfigFields] = useState([]);
  const [raceToRules, setRaceToRules] = useState([]);
  const [resolvedConfig, setResolvedConfig] = useState(null);
  const [validateResult, setValidateResult] = useState(null);
  const [templatePreview, setTemplatePreview] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);

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
        branchId: detail.venue?.branchId ? String(detail.venue.branchId) : "",
        participantType: detail.participantType || "SINGLE",
        maxParticipants: detail.maxParticipants ?? 16,
        tableCount: detail.tableCount ?? 4,
        entryFee: detail.entryFee ?? "",
        prizePool: detail.prizePool ?? "",
        prizeDescription: detail.prizeDescription || "",
        registrationDeadline: toLocalInput(detail.registrationDeadline),
        startAt: toLocalInput(detail.startAt),
        endAt: toLocalInput(detail.endAt),
        isRegister: !!detail.isRegister,
        isShowTournament: !!detail.isShowTournament,
        isPublicRatio: !!detail.isPublicRatio,
        registrationFormTemplateId: detail.registrationFormTemplateId
          ? String(detail.registrationFormTemplateId)
          : "",
      });
      setTournamentStatus(detail.status || "DRAFT");
      setApprovedCount(Number(detail.approvedCount ?? 0));
      setTournamentVersion(detail.version ?? null);
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

  // Khi vào từ lỗi đóng ĐK: gợi ý preset theo số người thực tế (approvedCount), không giữ chuỗi cũ theo maxSlots.
  useEffect(() => {
    if (!isCloseRegistrationMode || step !== 2) return;
    if (basic.format !== "PROGRESSIVE_ROUND_ROBIN") return;
    if (!approvedCount || approvedCount < 2) return;
    if (configFields.length === 0) return;
    if (closePresetAppliedRef.current) return;

    const survivorsField = configFields.find((f) => f.fieldKey === "pe_survivors_per_stage");
    if (!survivorsField) return;

    const preset = progressiveSurvivorsPreset(approvedCount);
    const current = String(survivorsField.value ?? survivorsField.defaultValue ?? "");
    closePresetAppliedRef.current = true;
    if (current === preset) return;

    setConfigFields((prev) =>
      prev.map((f) => (f.fieldKey === "pe_survivors_per_stage" ? { ...f, value: preset } : f))
    );
    toast.info(`Đã gợi ý cấu hình theo ${approvedCount} người đã đăng ký: ${preset}`);
  }, [isCloseRegistrationMode, step, basic.format, approvedCount, configFields]);

  useEffect(() => {
    if (!closeRegistrationIntent) closePresetAppliedRef.current = false;
  }, [closeRegistrationIntent]);

  useEffect(() => {
    if (!basic.isRegister || !basic.registrationFormTemplateId || !api.getRegistrationFormTemplatePreview) {
      setTemplatePreview(null);
      return;
    }
    let cancelled = false;
    setPreviewLoading(true);
    api.getRegistrationFormTemplatePreview(basic.registrationFormTemplateId)
      .then((data) => { if (!cancelled) setTemplatePreview(data); })
      .catch((err) => {
        if (!cancelled) {
          setTemplatePreview(null);
          toast.error(getApiErrorMessage(err));
        }
      })
      .finally(() => { if (!cancelled) setPreviewLoading(false); });
    return () => { cancelled = true; };
  }, [api, basic.isRegister, basic.registrationFormTemplateId]);

  const buildBasicPayload = () => ({
    version: tournamentVersion,
    name: basic.name.trim(),
    description: basic.description?.trim() || null,
    thumbnailUrl: basic.thumbnailUrl?.trim() || "",
    bannerUrl: basic.bannerUrl?.trim() || "",
    gameType: basic.gameType,
    format: basic.format,
    branchId: Number(basic.branchId) || null,
    participantType: basic.participantType,
    maxParticipants: Number(basic.maxParticipants),
    tableCount: Number(basic.tableCount) > 0 ? Number(basic.tableCount) : 1,
    entryFee: basic.entryFee === "" ? 0 : Number(basic.entryFee),
    prizePool: basic.prizePool === "" ? null : Number(basic.prizePool),
    prizeDescription: basic.prizeDescription?.trim() || null,
    registrationDeadline: toInstantOrNull(basic.registrationDeadline),
    startAt: toInstantOrNull(basic.startAt),
    endAt: toInstantOrNull(basic.endAt),
    isRegister: !!basic.isRegister,
    isShowTournament: !!basic.isShowTournament,
    isPublicRatio: !!basic.isPublicRatio,
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

  /**
   * Cộng/trừ tổng giải thưởng theo bước 1 triệu.
   *
   * Cộng thẳng vào số đang có chứ không làm tròn về bội số của 1 triệu: người
   * nhập 5.500.000 rồi bấm "+" là muốn 6.500.000, không phải bị nắn về 6.000.000.
   * Chặn dưới ở 0 để không ra giải thưởng âm.
   */
  const stepPrizePool = (delta) => {
    setBasic((b) => {
      const current = Number(b.prizePool);
      const base = Number.isFinite(current) && b.prizePool !== "" ? current : 0;
      return { ...b, prizePool: String(Math.max(0, base + delta)) };
    });
  };

  /* Số tiền dài rất khó soi bằng mắt (5000000 hay 50000000?) — in lại có dấu phân cách */
  const prizePoolHint =
    basic.prizePool === "" || !Number.isFinite(Number(basic.prizePool))
      ? "Bỏ trống nếu chưa công bố. Hai nút +/- thay đổi 1.000.000 đ mỗi lần."
      : `${Number(basic.prizePool).toLocaleString("vi-VN")} đ`;

  const validateStep1 = () => {
    const errs = {};
    if (!basic.name.trim()) errs.name = "Tên giải đấu không được để trống.";
    if (!basic.gameType) errs.gameType = "Vui lòng chọn loại bi.";
    if (!basic.format) errs.format = "Vui lòng chọn thể thức.";
    if (!basic.branchId) errs.branchId = "Vui lòng chọn chi nhánh tổ chức.";
    if (!basic.maxParticipants || Number(basic.maxParticipants) < 2)
      errs.maxParticipants = "Số người tham gia tối thiểu là 2.";
    if (basic.isRegister && !basic.registrationFormTemplateId)
      errs.registrationFormTemplateId = "Vui lòng chọn template form đăng ký.";
    return errs;
  };

  const handleSaveStep1 = async () => {
    const errs = validateStep1();
    const dErrs = validateDates(basic);
    setFieldErrors(errs);
    setDateErrors(dErrs);
    if (Object.keys(errs).length > 0 || Object.values(dErrs).some(Boolean)) {
      toast.warn("Vui lòng kiểm tra lại các trường bắt buộc");
      return;
    }
    setSaving(true);
    try {
      if (isNew) {
        const created = await api.createTournament(buildBasicPayload());
        setFieldErrors({});
        toast.success("Đã tạo giải đấu");
        navigate(`${basePath}/${created.id}?step=2`, { replace: true });
      } else {
        const updated = await api.updateTournament(tournamentId, buildBasicPayload());
        setTournamentVersion(updated?.version ?? tournamentVersion);
        setFieldErrors({});
        toast.success("Đã cập nhật thông tin giải");
        setStep(2);
      }
    } catch (err) {
      showValidationToast(err);
    } finally {
      setSaving(false);
    }
  };

  const buildConfigPayload = () => {
    return {
      body: {
        seedingMethod,
        fields: configFields.map((f) => ({
          fieldKey: f.fieldKey,
          value: String(f.value ?? f.defaultValue ?? ""),
        })),
        raceToOverrides: buildRaceToOverrides(raceToRules),
      },
    };
  };

  const handleSaveStep2 = async () => {
    if (!tournamentId) return;
    const { body } = buildConfigPayload();
    setSaving(true);
    try {
      await api.saveConfig(tournamentId, body);
      toast.success("Đã lưu cấu hình giải");
      setStep(3);
    } catch (err) {
      showValidationToast(err);
    } finally {
      setSaving(false);
    }
  };

  /** Lưu pe_survivors (và config khác) rồi đóng đăng ký ngay — dùng khi số người thực tế < slot. */
  const handleSaveAndCloseRegistration = async () => {
    if (!tournamentId) return;
    const { body } = buildConfigPayload();
    setSaving(true);
    try {
      await api.saveConfig(tournamentId, body);
      await api.patchStatus(tournamentId, { status: "REGISTRATION_CLOSED" });
      toast.success("Đã lưu cấu hình và đóng đăng ký");
      navigate(`${basePath}/${tournamentId}`);
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

  /** Step 3 khi giải đã mở ĐK: đóng đăng ký sau khi đã lưu/validate config. */
  const handleCloseRegistrationFromReview = async () => {
    if (!tournamentId) return;
    setSaving(true);
    try {
      const validation = await api.validateConfig(tournamentId);
      if (!validation.isValid) {
        setValidateResult(validation);
        toast.error("Config chưa hợp lệ — kiểm tra lỗi bên dưới");
        return;
      }
      await api.patchStatus(tournamentId, { status: "REGISTRATION_CLOSED" });
      toast.success("Đã đóng đăng ký giải đấu");
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
    return <p className="text-slate-500 dark:text-white/60 py-12 text-center">Đang tải...</p>;
  }

  return (
    <div>
      <TournamentWizardStepper
        currentStep={step}
        closeRegistrationMode={isCloseRegistrationMode || tournamentStatus === "OPEN_FOR_REGISTRATION"}
      />

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
              <label className="admin-label">Tên giải <span className="text-red-500">*</span></label>
              <input
                className={`admin-input w-full ${fieldErrors.name ? "border-rose-400 focus:ring-rose-300" : ""}`}
                placeholder="VD: CLB Bi-a FPT — Mở rộng 9-Ball 2026"
                value={basic.name}
                onChange={(e) => {
                  setBasic((b) => ({ ...b, name: e.target.value }));
                  if (fieldErrors.name) setFieldErrors((f) => ({ ...f, name: "" }));
                }}
              />
              {fieldErrors.name && <p className="mt-1 text-xs text-rose-600">{fieldErrors.name}</p>}
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
              <label className="admin-label">Loại bi <span className="text-red-500">*</span></label>
              <select
                className={`admin-select w-full ${fieldErrors.gameType ? "border-rose-400 focus:ring-rose-300" : ""}`}
                value={basic.gameType}
                onChange={(e) => {
                  setBasic((b) => ({ ...b, gameType: e.target.value }));
                  if (fieldErrors.gameType) setFieldErrors((f) => ({ ...f, gameType: "" }));
                }}
              >
                <option value="">-- Chọn loại bi --</option>
                {gameTypes.map((g) => (
                  <option key={g.code} value={g.code}>{g.name}</option>
                ))}
              </select>
              {fieldErrors.gameType && <p className="mt-1 text-xs text-rose-600">{fieldErrors.gameType}</p>}
            </div>

            <div>
              <label className="admin-label">Thể thức <span className="text-red-500">*</span></label>
              <select
                className={`admin-select w-full ${fieldErrors.format ? "border-rose-400 focus:ring-rose-300" : ""}`}
                value={basic.format}
                onChange={(e) => {
                  setBasic((b) => ({ ...b, format: e.target.value }));
                  if (fieldErrors.format) setFieldErrors((f) => ({ ...f, format: "" }));
                }}
                disabled={!isNew && tournamentStatus !== "DRAFT"}
              >
                <option value="">-- Chọn thể thức --</option>
                {formats.map((f) => (
                  <option key={f.code} value={f.code}>{f.name}</option>
                ))}
              </select>
              {fieldErrors.format && <p className="mt-1 text-xs text-rose-600">{fieldErrors.format}</p>}
              {!isNew && tournamentStatus !== "DRAFT" && (
                <p className="text-xs text-slate-400 dark:text-white/40 mt-1">Không thể đổi thể thức sau khi rời trạng thái Nháp.</p>
              )}
            </div>

            <div>
              <label className="admin-label">Chi nhánh tổ chức <span className="text-red-500">*</span></label>
              <select
                className={`admin-select w-full ${fieldErrors.branchId ? "border-rose-400 focus:ring-rose-300" : ""}`}
                value={basic.branchId}
                onChange={(e) => {
                  setBasic((b) => ({ ...b, branchId: e.target.value }));
                  if (fieldErrors.branchId) setFieldErrors((f) => ({ ...f, branchId: "" }));
                }}
                disabled={branches.length === 0 || (!isNew && tournamentStatus !== "DRAFT")}
              >
                <option value="">
                  {branches.length === 0 ? "Chưa có chi nhánh khả dụng" : "-- Chọn chi nhánh --"}
                </option>
                {branches.map((b) => (
                  <option key={b.id} value={String(b.id)}>{b.name}</option>
                ))}
              </select>

              {fieldErrors.branchId && <p className="mt-1 text-xs text-rose-600">{fieldErrors.branchId}</p>}
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
              <label className="admin-label">Số người tối đa <span className="text-red-500">*</span></label>
              <input
                type="number"
                min={2}
                className={`admin-input w-full ${fieldErrors.maxParticipants ? "border-rose-400 focus:ring-rose-300" : ""}`}
                value={basic.maxParticipants}
                onChange={(e) => {
                  setBasic((b) => ({ ...b, maxParticipants: e.target.value }));
                  if (fieldErrors.maxParticipants) setFieldErrors((f) => ({ ...f, maxParticipants: "" }));
                }}
              />
              {fieldErrors.maxParticipants && <p className="mt-1 text-xs text-rose-600">{fieldErrors.maxParticipants}</p>}
            </div>

            <div>
              <label className="admin-label">Số bàn thi đấu</label>
              <input
                type="number"
                min={1}
                className="admin-input w-full"
                placeholder="VD: 4"
                value={basic.tableCount}
                onChange={(e) => setBasic((b) => ({ ...b, tableCount: e.target.value }))}
              />
              <p className="mt-1 text-xs text-slate-400 dark:text-white/40">
                Trận đấu sẽ được tự động gán bàn (1 → {basic.tableCount || "N"}) và ước lượng giờ thi đấu.
              </p>
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
              <div className="flex items-stretch gap-2">
                <button
                  type="button"
                  className="admin-btn admin-btn-secondary px-3 shrink-0"
                  onClick={() => stepPrizePool(-PRIZE_STEP)}
                  aria-label="Giảm 1 triệu"
                  title="Giảm 1 triệu"
                >
                  −
                </button>
                <input
                  type="number"
                  min={0}
                  step={PRIZE_STEP}
                  className="admin-input w-full text-center"
                  placeholder="Tùy chọn"
                  value={basic.prizePool}
                  onChange={(e) => setBasic((b) => ({ ...b, prizePool: e.target.value }))}
                />
                <button
                  type="button"
                  className="admin-btn admin-btn-secondary px-3 shrink-0"
                  onClick={() => stepPrizePool(PRIZE_STEP)}
                  aria-label="Tăng 1 triệu"
                  title="Tăng 1 triệu"
                >
                  +
                </button>
              </div>
              <p className="mt-1 text-xs text-slate-400 dark:text-white/40">
                {prizePoolHint}
              </p>
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

            {/* Ảnh giải — gom thành một khối riêng ở cuối phần thông tin thay vì
                chen giữa Mô tả và Loại bi như trước. Hai khung đặt đúng tỉ lệ nơi
                ảnh sẽ hiển thị thật, để owner thấy ngay phần nào của ảnh bị cắt.

                Cả hai khung chốt chung chiều cao h-52 để thẳng hàng nhau; hình dạng
                đến từ chiều rộng. Thumbnail dùng aspect-[3/4] nên rộng suy ra từ
                chiều cao (~156px) — khớp `aspectRatio: 3/4` của card ở
                pages/Event/index.jsx. Banner lấy hết phần rộng còn lại nên tự thành
                dải ngang. Đừng đặt aspect cố định cho banner: 3/1 sẽ ép chiều rộng
                lên ~624px và tràn khỏi form ở màn hẹp.

                Lưu ý `bannerUrl` hiện chưa được render ở màn hình nào — hero trang
                chi tiết vẫn đang lấy `thumbnailUrl`. */}
            <div className="sm:col-span-2 pt-3 border-t border-slate-100">
              <p className="admin-label mb-3">Hình ảnh giải đấu</p>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="shrink-0">
                  <ImageUploader
                    label="Thumbnail — thẻ dọc 3:4"
                    folder="tournament-thumbnails"
                    previewUrl={basic.thumbnailUrl}
                    aspectClass="h-52 aspect-[3/4] rounded-xl"
                    onUpload={({ objectKey }) =>
                      setBasic((b) => ({ ...b, thumbnailUrl: objectKey }))
                    }
                  />
                  <p className="mt-1.5 text-xs text-slate-400 leading-snug">
                    Hiện ở card danh sách giải.
                  </p>
                </div>

                <div className="min-w-0 flex-1">
                  <ImageUploader
                    label="Banner — dải ngang"
                    folder="tournament-banners"
                    previewUrl={basic.bannerUrl}
                    aspectClass="h-52 w-full rounded-xl"
                    onUpload={({ objectKey }) =>
                      setBasic((b) => ({ ...b, bannerUrl: objectKey }))
                    }
                  />
                  <p className="mt-1.5 text-xs text-slate-400 leading-snug">
                    Ảnh ngang khổ rộng, dự phòng cho các trang hiển thị dạng dải.
                  </p>
                </div>
              </div>
            </div>

            {/* Registration toggle */}
            <div className="sm:col-span-2 pt-3 border-t border-slate-100 dark:border-white/10">
              <label className="flex items-center gap-3 text-sm font-medium text-slate-700 dark:text-white/75 cursor-pointer">
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
                  <span className="block text-xs font-normal text-slate-400 dark:text-white/40 mt-0.5">
                    Player sẽ điền form và nộp qua hệ thống. Cần chọn template form bên dưới.
                  </span>
                </span>
              </label>
            </div>

            {basic.isRegister && (
              <div className="sm:col-span-2">
                <label className="admin-label">Template form đăng ký <span className="text-red-500">*</span></label>
                {registrationTemplates.length === 0 ? (
                  <p className="text-sm text-amber-700 bg-amber-50 px-3 py-2 rounded-lg">
                    Chưa có template nào. Admin cần tạo template trước.
                  </p>
                ) : (
                  <select
                    className={`admin-select w-full ${fieldErrors.registrationFormTemplateId ? "border-rose-400 focus:ring-rose-300" : ""}`}
                    value={basic.registrationFormTemplateId}
                    onChange={(e) => {
                      setBasic((b) => ({ ...b, registrationFormTemplateId: e.target.value }));
                      if (fieldErrors.registrationFormTemplateId) setFieldErrors((f) => ({ ...f, registrationFormTemplateId: "" }));
                    }}
                  >
                    <option value="">-- Chọn template --</option>
                    {registrationTemplates.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.code}) — {t.fieldCount ?? 0} field
                      </option>
                    ))}
                  </select>
                )}
                {fieldErrors.registrationFormTemplateId && <p className="mt-1 text-xs text-rose-600">{fieldErrors.registrationFormTemplateId}</p>}
              </div>
            )}

            {basic.isRegister && basic.registrationFormTemplateId && (
              <div className="sm:col-span-2">
                <label className="admin-label">Xem trước form đăng ký</label>
                {previewLoading ? (
                  <p className="text-sm text-slate-500 dark:text-white/60 py-6 text-center border border-dashed rounded-lg">
                    Đang tải preview...
                  </p>
                ) : (
                  <RegistrationFormPreviewPanel preview={templatePreview} />
                )}
              </div>
            )}

            {/* Public visibility toggle */}
            <div className="sm:col-span-2 pt-3 border-t border-slate-100 dark:border-white/10">
              <label className="flex items-center gap-3 text-sm font-medium text-slate-700 dark:text-white/75 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded"
                  checked={basic.isShowTournament}
                  onChange={(e) =>
                    setBasic((b) => ({ ...b, isShowTournament: e.target.checked }))
                  }
                />
                <span>
                  Hiển thị giải đấu công khai
                  <span className="block text-xs font-normal text-slate-400 dark:text-white/40 mt-0.5">
                    Giải đấu sẽ xuất hiện trên trang sự kiện công khai và được đăng lên Facebook khi công bố.
                  </span>
                </span>
              </label>
            </div>

            {/* Public ratio toggle */}
            <div className="sm:col-span-2">
              <label className="flex items-center gap-3 text-sm font-medium text-slate-700 dark:text-white/75 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded"
                  checked={basic.isPublicRatio}
                  onChange={(e) =>
                    setBasic((b) => ({ ...b, isPublicRatio: e.target.checked }))
                  }
                />
                <span>
                  Công khai tỉ số & xếp hạng
                  <span className="block text-xs font-normal text-slate-400 dark:text-white/40 mt-0.5">
                    Cho phép người xem công khai theo dõi trận đấu, tỉ số và bảng xếp hạng.
                  </span>
                </span>
              </label>
            </div>
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
        <AdminCard title={isCloseRegistrationMode
          ? "Chỉnh cấu hình trước khi đóng đăng ký"
          : "Bước 2 — Cấu hình thi đấu"}>
          {loading ? (
            <p className="text-slate-500 dark:text-white/60 py-8 text-center">Đang tải form cấu hình...</p>
          ) : (
            <>
              {isCloseRegistrationMode ? (
                <div className="mb-4 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                  <p className="font-semibold mb-1">Không thể đóng đăng ký với cấu hình hiện tại</p>
                  <p>
                    Số người đã đăng ký thực tế là <strong>{approvedCount}</strong>, trong khi
                    "Số người đi tiếp mỗi giai đoạn" đang theo giả định tối đa{" "}
                    <strong>{basic.maxParticipants}</strong> người. Hệ thống đã gợi ý preset theo số
                    người thực tế — kiểm tra lại rồi bấm <strong>Lưu và đóng đăng ký</strong>.
                  </p>
                </div>
              ) : (
                <p className="text-sm text-slate-500 dark:text-white/60 mb-6">
                  Các giá trị mặc định do Admin thiết lập. {roleLabel} có thể chỉnh theo yêu cầu giải.
                </p>
              )}

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
                {seedingMethod === "RANK" && (
                  <p className="text-xs text-slate-400 dark:text-white/40 mt-3">
                    Thứ tự hạt giống lấy theo hạng cơ thủ (CN → A → … → L). Hạng đến từ hồ sơ của cơ
                    thủ khi đăng ký online, hoặc do BQT nhập khi thêm tay / import Excel. Người cùng
                    hạng bốc thăm ngẫu nhiên với nhau; người chưa xếp hạng xếp sau nhóm đã có hạng
                    để các cơ thủ mạnh nằm ở những nhánh khác nhau, không gặp nhau sớm.
                  </p>
                )}
                {seedingMethod === "SEED" && (
                  <p className="text-xs text-slate-400 dark:text-white/40 mt-3">
                    BQT tự gán số hạt giống (1 = mạnh nhất) cho từng người khi thêm tay hoặc import
                    Excel — form và template import sẽ hiện thêm cột "Hạt giống". Có thể seed một
                    phần: người chưa được gán xếp sau, bốc thăm ngẫu nhiên với nhau. Mỗi số hạt
                    giống chỉ được gán cho đúng 1 người trong giải.
                  </p>
                )}
              </div>

              <h3 className="text-sm font-semibold text-slate-700 dark:text-white/75 mb-3">Trường cấu hình giải</h3>
              {basic.format === "PROGRESSIVE_ROUND_ROBIN" && (
                <div className="mb-4 rounded-xl border border-indigo-200 bg-indigo-50/60 px-4 py-3">
                  <p className="text-xs text-indigo-700 mb-2">
                    <strong>Vòng tròn loại dần:</strong> nhập "Số người đi tiếp mỗi giai đoạn" dạng danh sách
                    giảm dần, cách nhau dấu phẩy (vd <code>10,6,4</code>). Phần tử cuối = số người vào Playoff.
                    Mọi phần tử phải là số chẵn.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {!isCloseRegistrationMode && (
                      <AdminButton
                        variant="secondary"
                        onClick={() => {
                          const preset = progressiveSurvivorsPreset(Number(basic.maxParticipants) || 16);
                          setConfigFields((prev) => prev.map((f) =>
                            f.fieldKey === "pe_survivors_per_stage" ? { ...f, value: preset } : f));
                          toast.success(`Đã dùng preset: ${preset}`);
                        }}
                      >
                        Dùng preset theo {basic.maxParticipants} người (tối đa)
                      </AdminButton>
                    )}
                    {!isNew && approvedCount > 0 && (
                      <AdminButton
                        variant={isCloseRegistrationMode ? "primary" : "secondary"}
                        onClick={() => {
                          const preset = progressiveSurvivorsPreset(approvedCount);
                          setConfigFields((prev) => prev.map((f) =>
                            f.fieldKey === "pe_survivors_per_stage" ? { ...f, value: preset } : f));
                          toast.success(`Đã dùng preset: ${preset}`);
                        }}
                      >
                        Dùng preset theo {approvedCount} người (đã đăng ký thực tế)
                      </AdminButton>
                    )}
                  </div>
                  {!isNew && approvedCount > 0 && approvedCount !== Number(basic.maxParticipants) && (
                    <p className="text-xs text-amber-700 mt-2">
                      Hiện có <strong>{approvedCount}</strong> người đã đăng ký (được duyệt), trong khi giải
                      đang mở cho tối đa <strong>{basic.maxParticipants}</strong> người. Nếu chốt sổ với số
                      người ít hơn giả định, hãy dùng preset theo số người thực tế ở trên hoặc tự nhập lại
                      "Số người đi tiếp mỗi giai đoạn" cho khớp.
                    </p>
                  )}
                </div>
              )}
              <TournamentConfigFieldForm fields={configFields} onChange={setConfigFields} />

              <h3 className="text-sm font-semibold text-slate-700 dark:text-white/75 mt-8 mb-3">Số ván thắng theo vòng đấu</h3>
              <TournamentRaceToOverrides rules={raceToRules} onChange={setRaceToRules} />

              <div className="flex justify-between gap-2 mt-6 pt-4 border-t border-slate-100 dark:border-white/10">
                {isCloseRegistrationMode ? (
                  <AdminButton
                    variant="secondary"
                    onClick={() => navigate(`${basePath}/${tournamentId}`)}
                  >
                    <ArrowLeft size={14} /> Quay lại chi tiết
                  </AdminButton>
                ) : (
                  <AdminButton variant="secondary" onClick={() => setStep(1)}>
                    <ArrowLeft size={14} /> Bước 1
                  </AdminButton>
                )}
                {isCloseRegistrationMode ? (
                  <div className="flex flex-wrap gap-2">
                    <AdminButton
                      variant="secondary"
                      onClick={handleSaveStep2}
                      disabled={saving}
                    >
                      {saving ? "Đang lưu..." : "Chỉ lưu config"}
                    </AdminButton>
                    <AdminButton
                      variant="primary"
                      onClick={handleSaveAndCloseRegistration}
                      disabled={saving}
                    >
                      {saving ? "Đang xử lý..." : "Lưu và đóng đăng ký"}
                    </AdminButton>
                  </div>
                ) : (
                  <AdminButton variant="primary" onClick={handleSaveStep2} disabled={saving}>
                    {saving ? "Đang lưu..." : "Lưu config & xem lại →"}
                  </AdminButton>
                )}
              </div>
            </>
          )}
        </AdminCard>
      )}

      {/* ── STEP 3: Review ── */}
      {step === 3 && (
        <div className="space-y-4">
          <AdminCard title={tournamentStatus === "OPEN_FOR_REGISTRATION"
            ? "Bước 3 — Xem lại & đóng đăng ký"
            : "Bước 3 — Xem lại & mở đăng ký"}>
            {loading ? (
              <p className="text-slate-500 dark:text-white/60 py-8 text-center">Đang tải...</p>
            ) : (
              <>
                {/* Validation errors */}
                {validateResult && !validateResult.isValid && (
                  <div className="mb-5 p-4 rounded-lg bg-red-50 border border-red-200">
                    <p className="text-sm font-semibold text-red-800 mb-2">
                      ⚠ Cấu hình chưa hợp lệ — không thể{" "}
                      {tournamentStatus === "OPEN_FOR_REGISTRATION" ? "đóng đăng ký" : "mở đăng ký"}
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
                    ✓ Cấu hình hợp lệ — sẵn sàng{" "}
                    {tournamentStatus === "OPEN_FOR_REGISTRATION" ? "đóng đăng ký" : "mở đăng ký"}
                  </div>
                )}

                {tournamentStatus === "OPEN_FOR_REGISTRATION" && approvedCount > 0 && (
                  <div className="mb-5 p-3 rounded-lg bg-amber-50 border border-amber-200 text-sm text-amber-900">
                    Giải đang mở đăng ký với <strong>{approvedCount}</strong> người đã duyệt
                    (tối đa {basic.maxParticipants}). Đóng đăng ký sẽ chốt sổ với số người thực tế này.
                  </div>
                )}

                {/* Summary info */}
                <div className="grid gap-3 sm:grid-cols-2 text-sm mb-6">
                  <div>
                    <p className="text-xs text-slate-400 dark:text-white/40 uppercase mb-1">Tên giải</p>
                    <p className="font-semibold text-slate-900 dark:text-white">{basic.name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 dark:text-white/40 uppercase mb-1">Loại bi · Thể thức</p>
                    <p className="font-medium">{selectedGameTypeName || "—"} · {selectedFormatName || "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 dark:text-white/40 uppercase mb-1">Số người tối đa</p>
                    <p className="font-medium">{basic.maxParticipants}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 dark:text-white/40 uppercase mb-1">Phí đăng ký</p>
                    <p className="font-medium">
                      {!basic.entryFee || Number(basic.entryFee) === 0
                        ? "Miễn phí"
                        : `${Number(basic.entryFee).toLocaleString("vi-VN")} đ`}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 dark:text-white/40 uppercase mb-1">Hạn đăng ký</p>
                    <p className="font-medium">{fmtDateLocal(basic.registrationDeadline)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 dark:text-white/40 uppercase mb-1">Bắt đầu thi đấu</p>
                    <p className="font-medium">{fmtDateLocal(basic.startAt)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 dark:text-white/40 uppercase mb-1">Đăng ký online</p>
                    <p className="font-medium">
                      {basic.isRegister
                        ? `Có${selectedTemplateName ? ` — ${selectedTemplateName}` : ""}`
                        : "Không"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 dark:text-white/40 uppercase mb-1">Hiển thị công khai</p>
                    <p className="font-medium">{basic.isShowTournament ? "Có" : "Không"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 dark:text-white/40 uppercase mb-1">Công khai tỉ số</p>
                    <p className="font-medium">{basic.isPublicRatio ? "Có" : "Không"}</p>
                  </div>
                  {resolvedConfig && (
                    <div>
                      <p className="text-xs text-slate-400 dark:text-white/40 uppercase mb-1">Xếp hạt giống</p>
                      <p className="font-medium">{resolvedConfig.seedingMethod}</p>
                    </div>
                  )}
                </div>

                {/* Config fields */}
                {configFields.length > 0 && (
                  <div className="mb-6">
                    <p className="text-xs text-slate-400 dark:text-white/40 uppercase mb-3">Cấu hình giải</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {configFields.map((field) => {
                        const val = field.value ?? field.defaultValue;
                        const isBool = field.uiComponent === "CHECKBOX";
                        const boolOn = isBool ? String(val) === "true" : false;
                        return (
                          <div key={field.fieldKey} className="admin-card p-4">
                            <div className="flex items-start justify-between gap-2 mb-1.5">
                              <p className="font-medium text-slate-800 dark:text-white/85 text-sm leading-snug">
                                {field.label || field.fieldKey}
                              </p>
                              {field.source && (
                                <span className="flex-shrink-0 text-[10px] uppercase tracking-wide text-slate-400 dark:text-white/40 bg-slate-100 dark:bg-white/10 px-1.5 py-0.5 rounded">
                                  {field.source === "TOURNAMENT" ? "Đã chỉnh" : "Mặc định"}
                                </span>
                              )}
                            </div>
                            {field.description && (
                              <p className="text-xs text-slate-500 dark:text-white/60 mb-2 leading-relaxed">{field.description}</p>
                            )}
                            <div className="pt-1 border-t border-slate-100 dark:border-white/10 mt-2">
                              {isBool ? (
                                <span className={`inline-flex items-center gap-1.5 text-sm font-semibold ${boolOn ? "text-green-700" : "text-slate-400 dark:text-white/40"}`}>
                                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${boolOn ? "bg-green-500" : "bg-slate-300"}`} />
                                  {boolOn ? "Kích hoạt" : "Tắt"}
                                </span>
                              ) : (
                                <span className="text-sm font-semibold text-slate-900 dark:text-white">{String(val ?? "—")}</span>
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
                    <p className="text-xs text-slate-400 dark:text-white/40 uppercase mb-2">Số ván thắng theo vòng</p>
                    <div className="bg-slate-50 dark:bg-white/5 rounded-lg border border-slate-100 dark:border-white/10 divide-y divide-slate-100 dark:divide-white/10">
                      {Object.entries(resolvedConfig.raceToRules).map(([roundKey, raceTo]) => {
                        const isOverridden = resolvedConfig.overriddenRounds?.includes(roundKey);
                        return (
                          <div key={roundKey} className="flex justify-between items-center px-4 py-2 text-sm">
                            <span className="text-slate-600 dark:text-white/70 capitalize">
                              {roundKey.replace(/_/g, " ")}
                            </span>
                            <span className="flex items-center gap-2">
                              <span className="font-semibold text-slate-800 dark:text-white/85">Đánh tới {raceTo} ván</span>
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

                <div className="flex flex-wrap justify-between gap-2 pt-4 border-t border-slate-100 dark:border-white/10">
                  <AdminButton variant="secondary" onClick={() => setStep(2)}>
                    <ArrowLeft size={14} /> Chỉnh config
                  </AdminButton>
                  <div className="flex gap-2">
                    <AdminButton
                      variant="secondary"
                      onClick={() => navigate(`${basePath}/${tournamentId}`)}
                    >
                      {tournamentStatus === "OPEN_FOR_REGISTRATION" ? "Quay lại" : "Lưu nháp"}
                    </AdminButton>
                    {tournamentStatus === "OPEN_FOR_REGISTRATION" ? (
                      <AdminButton
                        variant="primary"
                        onClick={handleCloseRegistrationFromReview}
                        disabled={saving || (validateResult && !validateResult.isValid)}
                      >
                        {saving ? "Đang xử lý..." : "Đóng đăng ký →"}
                      </AdminButton>
                    ) : (
                      <AdminButton
                        variant="primary"
                        onClick={handleOpenRegistration}
                        disabled={saving || (validateResult && !validateResult.isValid)}
                      >
                        {saving ? "Đang xử lý..." : "Mở đăng ký →"}
                      </AdminButton>
                    )}
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
