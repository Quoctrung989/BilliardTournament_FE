import {
  COMPATIBLE_TABLE_TYPES,
  GAME_TYPE_CODE_PATTERN,
} from "../../../constants/gameTypeConfig";

const GameTypeForm = ({
  mode = "create",
  form,
  onChange,
  errors = {},
  formId = "game-type-form",
  onSubmit,
}) => {
  const isCreate = mode === "create";

  const toggleTableType = (value) => {
    const set = new Set(form.compatibleTableTypes || []);
    if (set.has(value)) set.delete(value);
    else set.add(value);
    onChange({ compatibleTableTypes: [...set] });
  };

  return (
    <form id={formId} onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {isCreate ? (
          <div className="sm:col-span-2">
            <label className="admin-label">Mã loại bi *</label>
            <input
              className="admin-input mt-1 font-mono uppercase"
              placeholder="9_BALL"
              value={form.code}
              onChange={(e) => onChange({ code: e.target.value.toUpperCase() })}
            />
            {errors.code && <p className="text-xs text-rose-600 mt-1">{errors.code}</p>}
            <p className="text-xs text-slate-500 mt-1">
              Viết hoa, gạch dưới (vd. 9_BALL) — không đổi sau khi tạo.
            </p>
          </div>
        ) : (
          <div className="sm:col-span-2">
            <label className="admin-label">Mã loại bi</label>
            <input className="admin-input mt-1 font-mono bg-slate-50" value={form.code} readOnly />
          </div>
        )}

        <div className="sm:col-span-2">
          <label className="admin-label">Tên hiển thị *</label>
          <input
            className="admin-input mt-1"
            placeholder="9-Ball (Bida lỗ 9 bi)"
            value={form.name}
            onChange={(e) => onChange({ name: e.target.value })}
          />
          {errors.name && <p className="text-xs text-rose-600 mt-1">{errors.name}</p>}
        </div>

        <div className="sm:col-span-2">
          <label className="admin-label">Mô tả</label>
          <textarea
            className="admin-input mt-1"
            rows={2}
            placeholder="Race-to, luật break..."
            value={form.description}
            onChange={(e) => onChange({ description: e.target.value })}
          />
        </div>

        <div>
          <label className="admin-label">Race-to mặc định</label>
          <input
            type="number"
            min={1}
            className="admin-input mt-1"
            value={form.defaultRaceTo}
            onChange={(e) => onChange({ defaultRaceTo: e.target.value })}
          />
          {errors.defaultRaceTo && (
            <p className="text-xs text-rose-600 mt-1">{errors.defaultRaceTo}</p>
          )}
        </div>

        <div className="flex items-end">
          {isCreate ? (
            <label className="flex items-center gap-2 text-sm pb-2">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => onChange({ isActive: e.target.checked })}
              />
              Kích hoạt ngay
            </label>
          ) : (
            <p className="text-xs text-slate-500 rounded-lg bg-slate-50 border border-slate-100 px-3 py-2">
              Bật/tắt dùng công tắc trên bảng.
            </p>
          )}
        </div>

        <div className="sm:col-span-2">
          <label className="admin-label">Loại bàn tương thích</label>
          <div className="flex flex-wrap gap-4 mt-2 p-3 rounded-lg border border-slate-100 bg-slate-50/80">
            {COMPATIBLE_TABLE_TYPES.map((t) => (
              <label key={t.value} className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={(form.compatibleTableTypes || []).includes(t.value)}
                  onChange={() => toggleTableType(t.value)}
                />
                {t.label}
              </label>
            ))}
          </div>
          {errors.compatibleTableTypes && (
            <p className="text-xs text-rose-600 mt-1">{errors.compatibleTableTypes}</p>
          )}
        </div>
      </div>
    </form>
  );
};

export const validateGameTypeForm = (form, { isCreate = false } = {}) => {
  const errors = {};

  if (isCreate) {
    const code = form.code?.trim();
    if (!code) errors.code = "Mã loại bi là bắt buộc";
    else if (!GAME_TYPE_CODE_PATTERN.test(code)) {
      errors.code = "Định dạng không hợp lệ (vd. 9_BALL, 10_BALL)";
    }
  }

  if (!form.name?.trim()) errors.name = "Tên hiển thị là bắt buộc";

  const race = form.defaultRaceTo === "" ? null : Number(form.defaultRaceTo);
  if (form.defaultRaceTo !== "" && (Number.isNaN(race) || race < 1)) {
    errors.defaultRaceTo = "Race-to phải là số nguyên ≥ 1";
  }

  if (Object.keys(errors).length > 0) return { errors };

  const body = {
    name: form.name.trim(),
    ...(form.description?.trim() ? { description: form.description.trim() } : {}),
    ...(race != null && !Number.isNaN(race) ? { defaultRaceTo: race } : {}),
    ...(form.compatibleTableTypes?.length
      ? { compatibleTableTypes: form.compatibleTableTypes }
      : {}),
  };

  if (isCreate) {
    body.code = form.code.trim();
    body.isActive = form.isActive !== false;
  }

  return { body, errors: null };
};

export default GameTypeForm;
