const STEPS = [
  { step: 1, label: "Thông tin" },
  { step: 2, label: "Field" },
  { step: 3, label: "Preview" },
];

const RegistrationFormTemplateStepper = ({ currentStep }) => (
  <nav className="flex flex-wrap gap-2 mb-6" aria-label="Wizard steps">
    {STEPS.map(({ step, label }) => {
      const active = step === currentStep;
      const done = step < currentStep;
      return (
        <div
          key={step}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border ${
            active
              ? "bg-indigo-600 text-white border-indigo-600"
              : done
                ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                : "bg-white text-slate-500 border-slate-200"
          }`}
        >
          <span
            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
              active ? "bg-white text-indigo-600" : done ? "bg-indigo-600 text-white" : "bg-slate-200"
            }`}
          >
            {step}
          </span>
          {label}
        </div>
      );
    })}
  </nav>
);

export default RegistrationFormTemplateStepper;
