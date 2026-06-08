import clsx from "clsx";
import { ACCOUNT_ROLE_LABELS } from "../../../constants/accountConfig";

const styles = {
  ADMIN: "bg-violet-50 text-violet-700 ring-violet-200",
  OWNER: "bg-indigo-50 text-indigo-700 ring-indigo-200",
  MANAGER: "bg-sky-50 text-sky-700 ring-sky-200",
  STAFF: "bg-cyan-50 text-cyan-700 ring-cyan-200",
  PLAYER: "bg-slate-100 text-slate-700 ring-slate-200",
};

const RoleBadge = ({ role }) => {
  const key = role || "PLAYER";
  return (
    <span
      className={clsx(
        "inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ring-1",
        styles[key] || styles.PLAYER
      )}
    >
      {ACCOUNT_ROLE_LABELS[key] || role || "—"}
    </span>
  );
};

export default RoleBadge;
