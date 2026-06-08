import clsx from "clsx";
import { ACCOUNT_STATUS_LABELS } from "../../../constants/accountConfig";

const styles = {
  ACTIVE: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  LOCKED: "bg-rose-50 text-rose-700 ring-rose-200",
  INACTIVE: "bg-slate-100 text-slate-600 ring-slate-200",
  PENDING: "bg-amber-50 text-amber-700 ring-amber-200",
};

const AccountStatusBadge = ({ status }) => {
  const key = status || "INACTIVE";
  return (
    <span
      className={clsx(
        "inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ring-1",
        styles[key] || styles.INACTIVE
      )}
    >
      {ACCOUNT_STATUS_LABELS[key] || status || "—"}
    </span>
  );
};

export default AccountStatusBadge;
