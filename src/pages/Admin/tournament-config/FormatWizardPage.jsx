import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Layers, Plus, RefreshCw } from "lucide-react";
import { toast } from "react-toastify";
import {
  activateFormat,
  bootstrapDefaults,
  createFormat,
  getConfigFields,
  getFormat,
  getRaceToRules,
  getSetupStatus,
  getSetupSummary,
  saveConfigFields,
  saveRaceToRules,
  updateFormat,
} from "../../../api/adminFormatApi";
import { getCatalog, getCatalogItem } from "../../../api/adminConfigFieldApi";
import AdminButton from "../../../components/admin/ui/AdminButton";
import AdminCard from "../../../components/admin/ui/AdminCard";
import DynamicConfigFieldForm from "../../../components/admin/tournament-config/DynamicConfigFieldForm";
import FormatWizardStepper from "../../../components/admin/tournament-config/FormatWizardStepper";
import RaceToRulesTable from "../../../components/admin/tournament-config/RaceToRulesTable";
import SetupStatusBadge from "../../../components/admin/tournament-config/SetupStatusBadge";
import { getApiErrorMessage } from "../../../utils/apiError";
import {
  getActivateBlockReason,
  normalizeSetupSummary,
} from "../../../utils/formatSetup";
import { buildListParams } from "../../../utils/pagination";
import {
  isDirty,
  serializeFields,
  serializeInfo,
  serializeRules,
} from "../../../utils/wizardDirty";

const defaultInfo = {
  code: "",
  name: "",
  description: "",
  handlerKey: "",
  schemaVersion: "1.0",
  isActive: false,
};

const FormatWizardPage = () => {
  const { code: routeCode } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const isNew = location.pathname.endsWith("/new");
  const [formatCode, setFormatCode] = useState(isNew ? "" : routeCode);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [info, setInfo] = useState(defaultInfo);
  const [setupStatus, setSetupStatus] = useState(null);
  const [fields, setFields] = useState([]);
  const [availableFields, setAvailableFields] = useState([]);
  const [catalogPick, setCatalogPick] = useState("");
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [catalogLoaded, setCatalogLoaded] = useState(null);
  const [rules, setRules] = useState([]);
  const [summary, setSummary] = useState(null);

  const infoBaselineRef = useRef(null);
  const fieldsBaselineRef = useRef(null);
  const rulesBaselineRef = useRef(null);
  const stepFetchedRef = useRef({ 2: false, 3: false, 4: false });

  const effectiveCode = formatCode || routeCode;

  const infoDirty = isDirty(infoBaselineRef.current, serializeInfo, info);
  const fieldsDirty = isDirty(fieldsBaselineRef.current, serializeFields, fields);
  const rulesDirty = isDirty(rulesBaselineRef.current, serializeRules, rules);

  const invalidateStepsFrom = (fromStep) => {
    for (let s = fromStep + 1; s <= 4; s += 1) {
      stepFetchedRef.current[s] = false;
    }
  };

  const loadFormatData = useCallback(async () => {
    if (!effectiveCode || effectiveCode === "new") return;
    setLoading(true);
    try {
      const [format, status] = await Promise.all([
        getFormat(effectiveCode),
        getSetupStatus(effectiveCode),
      ]);
      const loadedInfo = {
        code: format.code || effectiveCode,
        name: format.name || "",
        description: format.description || "",
        handlerKey: format.handlerKey || "",
        schemaVersion: format.schemaVersion || "1.0",
        isActive: !!format.isActive,
      };
      setInfo(loadedInfo);
      infoBaselineRef.current = serializeInfo(loadedInfo);
      setSetupStatus(status);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [effectiveCode]);

  useEffect(() => {
    if (!isNew) loadFormatData();
  }, [isNew, loadFormatData]);

  const loadConfigFields = async (force = false) => {
    if (!effectiveCode) return;
    if (stepFetchedRef.current[2] && !force) return;
    setLoading(true);
    try {
      const data = await getConfigFields(effectiveCode);
      const loaded = data?.fields || [];
      setFields(loaded);
      setAvailableFields(data?.availableFields || []);
      fieldsBaselineRef.current = serializeFields(loaded);
      stepFetchedRef.current[2] = true;
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const loadRules = async (force = false) => {
    if (!effectiveCode) return;
    if (stepFetchedRef.current[3] && !force) return;
    setLoading(true);
    try {
      const data = await getRaceToRules(effectiveCode);
      const loaded = data?.rules || [];
      setRules(loaded);
      rulesBaselineRef.current = serializeRules(loaded);
      stepFetchedRef.current[3] = true;
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const loadSummary = async (force = false) => {
    if (!effectiveCode) return;
    if (stepFetchedRef.current[4] && !force) return;
    setLoading(true);
    try {
      const data = await getSetupSummary(effectiveCode);
      setSummary(normalizeSetupSummary(data));
      stepFetchedRef.current[4] = true;
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (step === 2 && effectiveCode) loadConfigFields();
    if (step === 3 && effectiveCode) loadRules();
    if (step === 4 && effectiveCode) loadSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, effectiveCode]);

  const handleInfoSubmit = async () => {
    if (!info.code?.trim() || !info.name?.trim() || !info.handlerKey?.trim()) {
      toast.error("Vui lòng nhập code, tên và handlerKey");
      return;
    }
    setSaving(true);
    try {
      const body = {
        code: info.code.trim(),
        name: info.name.trim(),
        description: info.description?.trim() || "",
        handlerKey: info.handlerKey.trim(),
        schemaVersion: info.schemaVersion || "1.0",
        isActive: info.isActive,
      };
      if (isNew && !formatCode) {
        const created = await createFormat(body);
        const newCode = created?.code || body.code;
        setFormatCode(newCode);
        infoBaselineRef.current = serializeInfo(body);
        stepFetchedRef.current = { 2: false, 3: false, 4: false };
        toast.success("Tạo thể thức thành công");
        navigate(`/admin/tournament-config/formats/${newCode}/edit`, { replace: true });
        setStep(2);
      } else if (!infoDirty) {
        toast.info("Không có thay đổi — chuyển sang bước Thông số thi đấu.");
        setStep(2);
      } else {
        await updateFormat(effectiveCode, body);
        infoBaselineRef.current = serializeInfo(info);
        invalidateStepsFrom(1);
        toast.success("Cập nhật thông tin thành công");
        setStep(2);
      }
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleBootstrapShortcut = async () => {
    if (!effectiveCode) return;
    setSaving(true);
    try {
      await bootstrapDefaults(effectiveCode, { overwrite: false });
      stepFetchedRef.current = { 2: false, 3: false, 4: false };
      fieldsBaselineRef.current = null;
      rulesBaselineRef.current = null;
      toast.success("Bootstrap mặc định thành công");
      setStep(4);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleAddFromCatalog = async () => {
    if (!catalogPick) return;
    let item = availableFields.find((f) => f.fieldKey === catalogPick);
    if (!item) {
      try {
        item = await getCatalogItem(catalogPick);
      } catch (err) {
        toast.error(getApiErrorMessage(err));
        return;
      }
    }
    if (!item) {
      toast.error("Không tìm thấy field trong catalog");
      return;
    }
    if (fields.some((f) => f.fieldKey === item.fieldKey)) {
      toast.warn("Field đã có trong danh sách");
      return;
    }
    setFields([
      ...fields,
      {
        fieldKey: item.fieldKey,
        label: item.label,
        description: item.description,
        uiComponent: item.uiComponent,
        enumOptions: item.enumOptions,
        defaultValue: item.defaultValue || "",
        isRequired: false,
        isVisibleToOwner: true,
      },
    ]);
    setCatalogPick("");
  };

  const handleLoadCatalogOptions = async () => {
    setCatalogLoading(true);
    setCatalogLoaded(null);
    try {
      const result = await getCatalog(
        buildListParams({
          page: 0,
          size: 200,
          scope: "COMMON,KNOCKOUT",
          isActive: true,
        })
      );
      const list = result.content;
      setAvailableFields(list);
      setCatalogLoaded({ count: list.length, total: result.totalElements, at: Date.now() });
      if (list.length === 0) {
        toast.info("Catalog trống — không có field khả dụng với bộ lọc hiện tại.");
      } else {
        const totalHint =
          result.totalElements > list.length
            ? ` (hiển thị ${list.length}/${result.totalElements})`
            : "";
        toast.success(
          `Đã tải ${list.length} field từ catalog${totalHint}. Chọn field và bấm «Thêm field».`
        );
      }
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setCatalogLoading(false);
    }
  };

  const handleSaveConfigFields = async () => {
    if (!fieldsDirty) {
      toast.info("Không có thay đổi — chuyển sang bước Số ván mỗi vòng.");
      setStep(3);
      return;
    }
    setSaving(true);
    try {
      await saveConfigFields(effectiveCode, {
        fields: fields.map((f) => ({
          fieldKey: f.fieldKey,
          defaultValue: String(f.defaultValue ?? ""),
          isRequired: !!f.isRequired,
          isVisibleToOwner: f.isVisibleToOwner !== false,
        })),
      });
      fieldsBaselineRef.current = serializeFields(fields);
      invalidateStepsFrom(2);
      toast.success("Lưu config fields thành công");
      setStep(3);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleSaveRules = async () => {
    if (!rulesDirty) {
      toast.info("Không có thay đổi — chuyển sang bước Kích hoạt.");
      setStep(4);
      return;
    }
    setSaving(true);
    try {
      await saveRaceToRules(effectiveCode, {
        rules: rules.map((r) => ({
          roundKey: r.roundKey,
          label: r.label,
          bracketPhase: r.bracketPhase,
          raceTo: Number(r.raceTo) || 1,
          ...(r.id ? { id: r.id } : {}),
        })),
      });
      rulesBaselineRef.current = serializeRules(rules);
      invalidateStepsFrom(3);
      toast.success("Lưu race-to rules thành công");
      setStep(4);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleActivate = async () => {
    setSaving(true);
    try {
      await activateFormat(effectiveCode);
      toast.success("Kích hoạt thể thức thành công");
      navigate("/admin/tournament-config/formats");
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (loading && step === 1 && !isNew) {
    return <div className="animate-pulse text-gray-400 py-12 text-center">Đang tải...</div>;
  }

  return (
    <div className="w-full">
      <FormatWizardStepper currentStep={step} />
      {setupStatus && (
        <div className="mb-4">
          <SetupStatusBadge status={setupStatus.setupStatus || setupStatus.status} />
        </div>
      )}

      {step === 1 && (
        <AdminCard className="w-full">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            <div>
              <label className="admin-label">Code *</label>
              <input
                className="admin-input mt-1 disabled:bg-slate-100 dark:disabled:bg-white/10"
                value={info.code}
                disabled={!isNew && !!formatCode}
                onChange={(e) => setInfo({ ...info, code: e.target.value })}
              />
            </div>
            <div>
              <label className="admin-label">Tên *</label>
              <input
                className="admin-input mt-1"
                value={info.name}
                onChange={(e) => setInfo({ ...info, name: e.target.value })}
              />
            </div>
            <div>
              <label className="admin-label">handlerKey *</label>
              <input
                className="admin-input mt-1"
                value={info.handlerKey}
                onChange={(e) => setInfo({ ...info, handlerKey: e.target.value })}
              />
            </div>
            <div>
              <label className="admin-label">schemaVersion</label>
              <input
                className="admin-input mt-1"
                value={info.schemaVersion}
                onChange={(e) => setInfo({ ...info, schemaVersion: e.target.value })}
              />
            </div>
            <div className="md:col-span-2 xl:col-span-3">
              <label className="admin-label">Mô tả *</label>
              <textarea
                className="admin-input mt-1 min-h-[120px]"
                rows={4}
                value={info.description}
                onChange={(e) => setInfo({ ...info, description: e.target.value })}
              />
            </div>
            <div className="md:col-span-2 xl:col-span-3 flex items-center pt-1">
              <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-white/75">
                <input
                  type="checkbox"
                  checked={info.isActive}
                  onChange={(e) => setInfo({ ...info, isActive: e.target.checked })}
                />
                isActive (mặc định tắt khi tạo mới)
              </label>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mt-6">
            <AdminButton variant="secondary" onClick={() => navigate("/admin/tournament-config/formats")}>
              Hủy
            </AdminButton>
            {effectiveCode && effectiveCode !== "new" && (
              <AdminButton variant="secondary" onClick={handleBootstrapShortcut} disabled={saving}>
                Bootstrap nhanh
              </AdminButton>
            )}
            <AdminButton className="ml-auto" onClick={handleInfoSubmit} disabled={saving}>
              {saving
                ? "Đang lưu..."
                : isNew || !formatCode
                ? "Lưu & tiếp"
                : infoDirty
                ? "Lưu & tiếp"
                : "Tiếp tục"}
            </AdminButton>
          </div>
        </AdminCard>
      )}

      {step === 2 && (
        <div>
          {loading ? (
            <div className="animate-pulse py-8 text-center text-gray-400">Đang tải fields...</div>
          ) : (
            <>
              <div className="admin-toolbar mb-5">
                <div className="admin-toolbar-label">
                  <Layers size={18} aria-hidden />
                  <span>Thêm field từ catalog hệ thống</span>
                </div>
                <AdminButton
                  variant="secondary"
                  type="button"
                  onClick={handleLoadCatalogOptions}
                  disabled={catalogLoading}
                >
                  <RefreshCw size={16} className={catalogLoading ? "animate-spin" : ""} />
                  {catalogLoading ? "Đang tải..." : "Tải catalog"}
                </AdminButton>
                {catalogLoaded && !catalogLoading && (
                  <span
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                    role="status"
                  >
                    ✓ Đã tải {catalogLoaded.count}
                    {catalogLoaded.total > catalogLoaded.count
                      ? ` / ${catalogLoaded.total}`
                      : ""}{" "}
                    field
                  </span>
                )}
                <select
                  className="admin-select"
                  value={catalogPick}
                  onChange={(e) => setCatalogPick(e.target.value)}
                  aria-label="Chọn field từ catalog"
                >
                  <option value="">Chọn field để thêm...</option>
                  {availableFields.map((f) => (
                    <option key={f.fieldKey} value={f.fieldKey}>
                      {f.label || f.fieldKey}
                    </option>
                  ))}
                </select>
                <AdminButton type="button" onClick={handleAddFromCatalog} disabled={!catalogPick}>
                  <Plus size={16} />
                  Thêm field
                </AdminButton>
              </div>
              <DynamicConfigFieldForm
                fields={fields}
                onChange={setFields}
                onRemove={(index) => setFields(fields.filter((_, i) => i !== index))}
              />
            </>
          )}
          <WizardNav
            step={step}
            setStep={setStep}
            onSave={handleSaveConfigFields}
            saving={saving}
            canBack={!!effectiveCode}
            isDirty={fieldsDirty}
          />
        </div>
      )}

      {step === 3 && (
        <div>
          {loading ? (
            <div className="animate-pulse py-8 text-center text-gray-400">Đang tải rules...</div>
          ) : (
            <RaceToRulesTable rules={rules} onChange={setRules} />
          )}
          <WizardNav
            step={step}
            setStep={setStep}
            onSave={handleSaveRules}
            saving={saving}
            canBack
            isDirty={rulesDirty}
          />
        </div>
      )}

      {step === 4 && (
        <div>
          {loading ? (
            <div className="animate-pulse py-8 text-center text-gray-400">Đang tải tóm tắt...</div>
          ) : summary ? (
            <>
              {summary.canActivate ? (
                <div className="mb-4 p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-sm flex items-center gap-2">
                  <span className="font-semibold">Sẵn sàng kích hoạt</span>
                  <span className="text-emerald-600">— Owner có thể chọn thể thức sau khi bạn kích hoạt.</span>
                </div>
              ) : (
                <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-sm">
                  <p className="font-semibold">Chưa thể kích hoạt</p>
                  <p className="mt-1 text-amber-800">{getActivateBlockReason(summary)}</p>
                </div>
              )}
              {summary.validationErrors?.length > 0 && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  <p className="font-semibold mb-2">Lỗi validation:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    {summary.validationErrors.map((err, i) => (
                      <li key={i}>{typeof err === "string" ? err : err.message || JSON.stringify(err)}</li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="grid gap-4 md:grid-cols-3">
                <PreviewBlock title="Thông tin" items={[{ label: "Code", value: effectiveCode }]} />
                <PreviewBlock
                  title="Thông số thi đấu"
                  items={(summary.configFields || []).map((f) => ({
                    label: f.fieldKey || f.label,
                    value: f.defaultValue,
                  }))}
                />
                <PreviewBlock
                  title="Số ván thắng theo vòng"
                  items={(summary.raceToRules || []).map((r) => ({
                    label: r.label || r.roundKey,
                    value: `raceTo: ${r.raceTo}`,
                  }))}
                />
              </div>
              <div className="flex flex-wrap items-center gap-3 mt-6">
                <AdminButton variant="secondary" onClick={() => setStep(3)}>
                  Quay lại
                </AdminButton>
                <AdminButton
                  variant="secondary"
                  onClick={() => loadSummary(true)}
                  disabled={loading}
                >
                  Làm mới trạng thái
                </AdminButton>
                <AdminButton
                  variant="success"
                  className="ml-auto min-w-[140px]"
                  disabled={
                    saving ||
                    !summary.canActivate ||
                    (summary.validationErrors?.length ?? 0) > 0
                  }
                  title={getActivateBlockReason(summary) || "Kích hoạt thể thức"}
                  onClick={handleActivate}
                >
                  {saving ? "Đang kích hoạt..." : "Kích hoạt"}
                </AdminButton>
              </div>
              {!summary.canActivate && (
                <p className="text-xs text-slate-500 dark:text-white/60 mt-2 text-right max-w-md ml-auto">
                  Nút xám = chưa đủ điều kiện từ server. Lưu đủ bước 2–3 hoặc Bootstrap rồi bấm
                  &quot;Làm mới trạng thái&quot;.
                </p>
              )}
            </>
          ) : (
            <p className="text-gray-500">Không có dữ liệu tóm tắt.</p>
          )}
        </div>
      )}
    </div>
  );
};

const WizardNav = ({ step, setStep, onSave, saving, canBack, isDirty = true }) => (
  <div className="flex flex-wrap items-center gap-2 mt-6">
    {canBack && (
      <AdminButton variant="secondary" onClick={() => setStep(step - 1)}>
        Quay lại
      </AdminButton>
    )}
    {!isDirty && (
      <span className="text-xs text-slate-500 dark:text-white/60">Không có thay đổi — bấm Tiếp tục sẽ không gọi API lưu.</span>
    )}
    <AdminButton className="ml-auto" onClick={onSave} disabled={saving}>
      {saving ? "Đang xử lý..." : isDirty ? "Lưu & tiếp" : "Tiếp tục"}
    </AdminButton>
  </div>
);

const PreviewBlock = ({ title, items }) => (
  <div className="admin-card p-4">
    <h4 className="font-semibold text-slate-800 dark:text-slate-100 mb-3">{title}</h4>
    {items?.length ? (
      <ul className="text-xs space-y-2 text-gray-600 dark:text-white/70">
        {items.map((item, i) => (
          <li key={i}>
            <span className="font-medium">{item.label}:</span> {item.value ?? "—"}
          </li>
        ))}
      </ul>
    ) : (
      <p className="text-xs text-gray-400">Trống</p>
    )}
  </div>
);

export default FormatWizardPage;
