const TournamentRaceToOverrides = ({ rules, onChange }) => {
  if (!rules?.length) {
    return (
      <p className="text-sm text-gray-500 py-6 text-center border border-dashed rounded-lg bg-white">
        Chưa có quy tắc race-to cho thể thức này
      </p>
    );
  }

  const updateRaceTo = (index, raceTo) => {
    const next = rules.map((r, i) => {
      if (i !== index) return r;
      const defaultRaceTo = r.defaultRaceTo ?? r.raceTo;
      return {
        ...r,
        raceTo,
        isOverridden: raceTo !== defaultRaceTo,
        source: raceTo !== defaultRaceTo ? "TOURNAMENT" : "ADMIN_DEFAULT",
      };
    });
    onChange(next);
  };

  return (
    <div className="admin-card overflow-hidden">
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th className="px-3 py-2 text-left">Vòng</th>
              <th className="px-3 py-2 text-left">Pha</th>
              <th className="px-3 py-2 text-left">Số ván thắng</th>
              <th className="px-3 py-2 text-left">Mặc định</th>
            </tr>
          </thead>
          <tbody>
            {rules.map((rule, index) => (
              <tr key={rule.roundKey} className="border-t">
                <td className="px-3 py-2 text-sm">{rule.label || rule.roundKey}</td>
                <td className="px-3 py-2 text-sm text-slate-500">{rule.bracketPhase}</td>
                <td className="px-3 py-2">
                  <input
                    type="number"
                    min={1}
                    className="admin-input w-24"
                    value={rule.raceTo ?? rule.defaultRaceTo ?? 1}
                    onChange={(e) => updateRaceTo(index, Number(e.target.value))}
                  />
                </td>
                <td className="px-3 py-2 text-sm text-slate-500">
                  {rule.defaultRaceTo ?? rule.raceTo}
                  {rule.isOverridden && (
                    <span className="ml-2 text-xs text-amber-600 font-medium">đã chỉnh</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="px-3 py-2 text-xs text-slate-500 border-t">
        Chỉ lưu override khi race-to khác mặc định Admin
      </p>
    </div>
  );
};

export default TournamentRaceToOverrides;
