import { Check } from "lucide-react";

const STEPS = [
  { id: 1, label: "Thông tin giải" },
  { id: 2, label: "Cấu hình thi đấu" },
  { id: 3, label: "Xem lại & mở đăng ký" },
];

const TournamentWizardStepper = ({ currentStep }) => (
  <div className="admin-card p-4 mb-6">
    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
      {STEPS.map((step, index) => {
        const done = step.id < currentStep;
        const active = step.id === currentStep;
        return (
          <div key={step.id} className="flex items-center flex-1 min-w-0 gap-3">
            {index > 0 && (
              <div
                className={`hidden sm:block flex-1 h-0.5 rounded ${
                  done ? "bg-indigo-500" : "bg-slate-200"
                }`}
              />
            )}
            <div className="flex items-center gap-2 min-w-0">
              <div
                className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  active
                    ? "bg-indigo-600 text-white ring-4 ring-indigo-100"
                    : done
                    ? "bg-emerald-500 text-white"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                {done ? <Check size={16} /> : step.id}
              </div>
              <span
                className={`text-sm font-medium truncate ${
                  active ? "text-indigo-700" : done ? "text-slate-700" : "text-slate-400"
                }`}
              >
                {step.label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  </div>
);

export default TournamentWizardStepper;
