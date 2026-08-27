const STEPS_OPEN = [
  { id: 1, label: "Thông tin giải" },
  { id: 2, label: "Cấu hình thi đấu" },
  { id: 3, label: "Xem lại & mở đăng ký" },
];

const STEPS_CLOSE = [
  { id: 1, label: "Thông tin giải" },
  { id: 2, label: "Chỉnh cấu hình" },
  { id: 3, label: "Xem lại & đóng đăng ký" },
];

const TournamentWizardStepper = ({ currentStep, closeRegistrationMode = false }) => {
  const STEPS = closeRegistrationMode ? STEPS_CLOSE : STEPS_OPEN;
  return (
    <div className="admin-card p-4 mb-6">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        {STEPS.map((step) => {
          const done = step.id < currentStep;
          const active = step.id === currentStep;
          return (
            <div key={step.id} className="flex items-center gap-2">
              <span
                className={`flex-shrink-0 w-2.5 h-2.5 rounded-full ${
                  active
                    ? "bg-indigo-600 ring-4 ring-indigo-100"
                    : done
                    ? "bg-emerald-500"
                    : "bg-slate-300 dark:bg-white/15"
                }`}
              />
              <span
                className={`text-sm font-medium truncate ${
                  active ? "text-indigo-700" : done ? "text-slate-700 dark:text-white/75" : "text-slate-400 dark:text-white/40"
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TournamentWizardStepper;
