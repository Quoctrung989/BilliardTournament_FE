import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import AdminButton from "../../../components/admin/ui/AdminButton";
import AdminCard from "../../../components/admin/ui/AdminCard";
import TournamentConfigFieldForm from "../../../components/tournaments/TournamentConfigFieldForm";
import TournamentRaceToOverrides from "../../../components/tournaments/TournamentRaceToOverrides";
import TournamentWizardStepper from "../../../components/tournaments/TournamentWizardStepper";
import { PARTICIPANT_TYPES, SEEDING_OPTIONS } from "../../../constants/tournamentConfig";
import {
  getApiErrorMessage,
  getApiValidationDetails,
} from "../../../utils/apiError";

const defaultBasic = {
  name: "",
  description: "",
  gameType: "",
  format: "",
  participantType: "SINGLE",
  maxParticipants: 16,
  entryFee: "",
  prizePool: "",
  prizeDescription: "",
  registrationDeadline: "",
  startAt: "",
  endAt: "",
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

const buildRaceToOverrides = (rules) =>
  (rules || [])
    .filter((r) => r.isOverridden || r.raceTo !== r.defaultRaceTo)
    .map((r) => ({ roundKey: r.roundKey, raceTo: r.raceTo }));

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
  const [basic, setBasic] = useState(defaultBasic);
  const [tournamentStatus, setTournamentStatus] = useState("DRAFT");

  const [seedingMethod, setSeedingMethod] = useState("RANDOM");
  const [configFields, setConfigFields] = useState([]);
  const [raceToRules, setRaceToRules] = useState([]);
  const [resolvedConfig, setResolvedConfig] = useState(null);
  const [validateResult, setValidateResult] = useState(null);

  const loadOptions = useCallback(async () => {
    try {
      const [gt, fm] = await Promise.all([api.listGameTypes(), api.listFormats()]);
      setGameTypes(gt?.items || []);
      setFormats(fm?.items || []);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  }, [api]);

  const loadTournament = useCallback(async () => {
    if (!tournamentId) return;
    setLoading(true);
    try {
      const detail = await api.getTournament(tournamentId);
      setBasic({
        name: detail.name || "",
        description: detail.description || "",
        gameType: detail.gameType || "",
        format: detail.format || "",
        participantType: detail.participantType || "SINGLE",
        maxParticipants: detail.maxParticipants ?? 16,
        entryFee: detail.entryFee ?? "",
        prizePool: detail.prizePool ?? "",
        prizeDescription: detail.prizeDescription || "",
        registrationDeadline: toLocalInput(detail.registrationDeadline),
        startAt: toLocalInput(detail.startAt),
        endAt: toLocalInput(detail.endAt),
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
      const [resolved, validation] = await Promise.all([
        api.getResolvedConfig(tournamentId),
        api.validateConfig(tournamentId),
      ]);
      setResolvedConfig(resolved);
      setValidateResult(validation);
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

  useEffect(() => {
    loadOptions();
  }, [loadOptions]);

  useEffect(() => {
    if (!isNew) loadTournament();
  }, [isNew, loadTournament]);

  useEffect(() => {
    if (step === 2 && tournamentId) loadConfigForm();
  }, [step, tournamentId, loadConfigForm]);

  useEffect(() => {
    if (step === 3 && tournamentId) loadReview();
  }, [step, tournamentId, loadReview]);

  const buildBasicPayload = () => ({
    name: basic.name.trim(),
    description: basic.description?.trim() || null,
    gameType: basic.gameType,
    format: basic.format,
    participantType: basic.participantType,
    maxParticipants: Number(basic.maxParticipants),
    entryFee: basic.entryFee === "" ? 0 : Number(basic.entryFee),
    prizePool: basic.prizePool === "" ? null : Number(basic.prizePool),
    prizeDescription: basic.prizeDescription?.trim() || null,
    registrationDeadline: toInstantOrNull(basic.registrationDeadline),
    startAt: toInstantOrNull(basic.startAt),
    endAt: toInstantOrNull(basic.endAt),
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

  const handleSaveStep1 = async () => {
    if (!basic.name.trim() || !basic.gameType || !basic.format) {
      toast.warn("Vui lòng điền tên, loại bi và thể thức");
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

  if (loading && step === 1 && !isNew && !basic.name) {
    return <p className="text-slate-500 py-12 text-center">Đang tải...</p>;
  }

  return (
    <div>
      <TournamentWizardStepper currentStep={step} />

      {step === 1 && (
        <AdminCard title="Bước 1 — Thông tin giải">
          <p className="text-sm text-slate-500 mb-4">
            Chọn loại bi và thể thức từ cấu hình Admin. {roleLabel} có thể chỉnh lại ở bước sau.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="admin-label">Tên giải *</label>
              <input
                className="admin-input w-full"
                value={basic.name}
                onChange={(e) => setBasic((b) => ({ ...b, name: e.target.value }))}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="admin-label">Mô tả</label>
              <textarea
                className="admin-input w-full min-h-[80px]"
                value={basic.description}
                onChange={(e) => setBasic((b) => ({ ...b, description: e.target.value }))}
              />
            </div>
            <div>
              <label className="admin-label">Loại bi *</label>
              <select
                className="admin-select w-full"
                value={basic.gameType}
                onChange={(e) => setBasic((b) => ({ ...b, gameType: e.target.value }))}
              >
                <option value="">-- Chọn --</option>
                {gameTypes.map((g) => (
                  <option key={g.code} value={g.code}>
                    {g.name}
                  </option>
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
                <option value="">-- Chọn --</option>
                {formats.map((f) => (
                  <option key={f.code} value={f.code}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="admin-label">Hình thức tham gia</label>
              <select
                className="admin-select w-full"
                value={basic.participantType}
                onChange={(e) => setBasic((b) => ({ ...b, participantType: e.target.value }))}
              >
                {PARTICIPANT_TYPES.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
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
                onChange={(e) =>
                  setBasic((b) => ({ ...b, maxParticipants: e.target.value }))
                }
              />
            </div>
            <div>
              <label className="admin-label">Phí đăng ký (VNĐ)</label>
              <input
                type="number"
                min={0}
                className="admin-input w-full"
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
                value={basic.prizePool}
                onChange={(e) => setBasic((b) => ({ ...b, prizePool: e.target.value }))}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="admin-label">Mô tả giải thưởng</label>
              <input
                className="admin-input w-full"
                value={basic.prizeDescription}
                onChange={(e) =>
                  setBasic((b) => ({ ...b, prizeDescription: e.target.value }))
                }
              />
            </div>
            <div>
              <label className="admin-label">Hạn đăng ký</label>
              <input
                type="datetime-local"
                className="admin-input w-full"
                value={basic.registrationDeadline}
                onChange={(e) =>
                  setBasic((b) => ({ ...b, registrationDeadline: e.target.value }))
                }
              />
            </div>
            <div>
              <label className="admin-label">Bắt đầu</label>
              <input
                type="datetime-local"
                className="admin-input w-full"
                value={basic.startAt}
                onChange={(e) => setBasic((b) => ({ ...b, startAt: e.target.value }))}
              />
            </div>
            <div>
              <label className="admin-label">Kết thúc</label>
              <input
                type="datetime-local"
                className="admin-input w-full"
                value={basic.endAt}
                onChange={(e) => setBasic((b) => ({ ...b, endAt: e.target.value }))}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <AdminButton variant="primary" onClick={handleSaveStep1} disabled={saving}>
              {isNew ? "Tạo giải & tiếp tục" : "Lưu & tiếp tục"}
            </AdminButton>
          </div>
        </AdminCard>
      )}

      {step === 2 && (
        <AdminCard title="Bước 2 — Cấu hình thi đấu">
          {loading ? (
            <p className="text-slate-500 py-8 text-center">Đang tải form...</p>
          ) : (
            <>
              <div className="mb-6 max-w-md">
                <label className="admin-label">Xếp hạt giống *</label>
                <select
                  className="admin-select w-full"
                  value={seedingMethod}
                  onChange={(e) => setSeedingMethod(e.target.value)}
                >
                  {SEEDING_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              <h3 className="text-sm font-semibold text-slate-700 mb-3">Trường cấu hình</h3>
              <TournamentConfigFieldForm fields={configFields} onChange={setConfigFields} />
              <h3 className="text-sm font-semibold text-slate-700 mt-8 mb-3">Race-to theo vòng</h3>
              <TournamentRaceToOverrides rules={raceToRules} onChange={setRaceToRules} />
              <div className="flex justify-between gap-2 mt-6">
                <AdminButton variant="secondary" onClick={() => setStep(1)}>
                  Quay lại
                </AdminButton>
                <AdminButton variant="primary" onClick={handleSaveStep2} disabled={saving}>
                  Lưu config & xem lại
                </AdminButton>
              </div>
            </>
          )}
        </AdminCard>
      )}

      {step === 3 && (
        <AdminCard title="Bước 3 — Xem lại & mở đăng ký">
          {loading ? (
            <p className="text-slate-500 py-8 text-center">Đang tải...</p>
          ) : (
            <>
              {validateResult && !validateResult.isValid && (
                <div className="mb-4 p-4 rounded-lg bg-red-50 border border-red-200">
                  <p className="text-sm font-medium text-red-800 mb-2">Lỗi cấu hình</p>
                  <ul className="text-sm text-red-700 list-disc pl-5 space-y-1">
                    {(validateResult.errors || []).map((e, i) => (
                      <li key={i}>
                        {e.fieldKey}: {e.message}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {resolvedConfig && (
                <div className="grid gap-4 sm:grid-cols-2 mb-6">
                  <div>
                    <p className="text-xs text-slate-500 uppercase">Thể thức</p>
                    <p className="font-medium">{resolvedConfig.formatName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase">Xếp hạt</p>
                    <p className="font-medium">{resolvedConfig.seedingMethod}</p>
                  </div>
                  <div className="sm:col-span-2">
                    <p className="text-xs text-slate-500 uppercase mb-2">Config fields</p>
                    <pre className="text-xs bg-slate-50 p-3 rounded-lg overflow-auto max-h-48">
                      {JSON.stringify(resolvedConfig.fields, null, 2)}
                    </pre>
                  </div>
                  <div className="sm:col-span-2">
                    <p className="text-xs text-slate-500 uppercase mb-2">Race-to</p>
                    <pre className="text-xs bg-slate-50 p-3 rounded-lg overflow-auto max-h-32">
                      {JSON.stringify(resolvedConfig.raceToRules, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
              <div className="flex flex-wrap justify-between gap-2">
                <AdminButton variant="secondary" onClick={() => setStep(2)}>
                  Chỉnh config
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
                    disabled={saving}
                  >
                    Mở đăng ký
                  </AdminButton>
                </div>
              </div>
            </>
          )}
        </AdminCard>
      )}
    </div>
  );
};

export default TournamentWizardPage;
