import { BRACKET_PHASES } from "../../../constants/tournamentConfig";

const emptyRule = () => ({
  roundKey: "",
  label: "",
  bracketPhase: "KNOCKOUT",
  raceTo: 1,
});

const RaceToRulesTable = ({ rules, onChange }) => {
  const updateRule = (index, patch) => {
    onChange(rules.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  };

  const addRule = () => onChange([...(rules || []), emptyRule()]);
  const removeRule = (index) => onChange(rules.filter((_, i) => i !== index));

  if (!rules?.length) {
    return (
      <div className="text-center py-8 border border-dashed rounded-lg bg-white dark:bg-[#161a22]">
        <p className="text-sm text-gray-500 mb-4">
          Chưa có rule race-to — thêm dòng hoặc dùng Bootstrap
        </p>
        <button
          type="button"
          onClick={addRule}
          className="admin-btn admin-btn-primary"
        >
          Thêm dòng
        </button>
      </div>
    );
  }

  return (
    <div className="admin-card overflow-hidden">
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th className="px-3 py-2 text-left">roundKey</th>
              <th className="px-3 py-2 text-left">label</th>
              <th className="px-3 py-2 text-left">bracketPhase</th>
              <th className="px-3 py-2 text-left">raceTo</th>
              <th className="px-3 py-2 w-20" />
            </tr>
          </thead>
          <tbody>
            {rules.map((rule, index) => (
              <tr key={rule.id ?? index} className="border-t">
                <td className="px-3 py-2">
                  <input
                    className="border rounded px-2 py-1 w-full"
                    value={rule.roundKey || ""}
                    onChange={(e) => updateRule(index, { roundKey: e.target.value })}
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    className="border rounded px-2 py-1 w-full"
                    value={rule.label || ""}
                    onChange={(e) => updateRule(index, { label: e.target.value })}
                  />
                </td>
                <td className="px-3 py-2">
                  <select
                    className="border rounded px-2 py-1 w-full"
                    value={rule.bracketPhase || "KNOCKOUT"}
                    onChange={(e) => updateRule(index, { bracketPhase: e.target.value })}
                  >
                    {BRACKET_PHASES.map((p) => (
                      <option key={p.value} value={p.value}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-3 py-2">
                  <input
                    type="number"
                    min={1}
                    className="border rounded px-2 py-1 w-24"
                    value={rule.raceTo ?? 1}
                    onChange={(e) =>
                      updateRule(index, { raceTo: Number(e.target.value) })
                    }
                  />
                </td>
                <td className="px-3 py-2">
                  <button
                    type="button"
                    className="text-red-500 text-xs"
                    onClick={() => removeRule(index)}
                  >
                    Xóa
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="p-3 border-t">
        <button
          type="button"
          onClick={addRule}
          className="text-sm text-indigo-600 font-semibold hover:underline"
        >
          + Thêm dòng
        </button>
      </div>
    </div>
  );
};

export default RaceToRulesTable;
