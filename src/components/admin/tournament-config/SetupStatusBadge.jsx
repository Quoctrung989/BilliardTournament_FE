import {
  SETUP_STATUS_LABELS,
  SETUP_STATUS_STYLES,
} from "../../../constants/tournamentConfig";

const modernStyles = {
  INFO_DONE: "bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-white/75 ring-slate-200 dark:ring-white/15",
  CONFIG_FIELDS_DONE: "bg-blue-50 text-blue-700 ring-blue-200",
  RACE_TO_DONE: "bg-amber-50 text-amber-800 ring-amber-200",
  READY_TO_ACTIVATE: "bg-violet-50 text-violet-700 ring-violet-200",
  ACTIVE: "bg-emerald-50 text-emerald-700 ring-emerald-200",
};

const SetupStatusBadge = ({ status }) => {
  if (!status) return null;
  const style =
    modernStyles[status] || SETUP_STATUS_STYLES[status] || "bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-white/70";
  const label = SETUP_STATUS_LABELS[status] || status;

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ring-1 ring-inset ${style}`}
    >
      {label}
    </span>
  );
};

export default SetupStatusBadge;
