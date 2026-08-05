import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import {
  AlertTriangle, ArrowLeft, Bot, ChevronDown, ChevronUp, History, UserCog,
  MapPin, CalendarClock, Users, Settings2, Info,
} from "lucide-react";
import AdminButton from "../../../components/admin/ui/AdminButton";
import AdminCard from "../../../components/admin/ui/AdminCard";
import ConfirmModal from "../../../components/shared/ui/ConfirmModal";
import {
  TOURNAMENT_STATUS_LABELS,
  TOURNAMENT_STATUS_STYLES,
} from "../../../constants/tournamentConfig";
import { getApiErrorCode, getApiErrorMessage } from "../../../utils/apiError";

/** Backend trả mã này khi pe_survivors_per_stage không còn khớp số người tham gia thực tế
 * lúc đóng đăng ký (xem PROGRESSIVE_CONFIG_INVALID / TOURNAMENT_010 ở ErrorCode.java) — hiện lỗi
 * trong popup và cho owner nút tắt để sang thẳng bước sửa config. */
const PROGRESSIVE_CONFIG_INVALID_CODE = "TOURNAMENT_010";

const fmtDate = (iso) => {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
};

const fmtCurrency = (v) => {
  if (v == null || v === "" || Number(v) === 0) return "Miễn phí";
  return `${Number(v).toLocaleString("vi-VN")} đ`;
};

const participantLabel = (type) =>
  type === "SINGLE" ? "Đơn" : type === "DOUBLE" ? "Đôi" : type === "TEAM" ? "Đội" : type || "—";

/* Nhãn hiển thị cho các giá trị enum config phổ biến. */
const ENUM_LABELS = {
  RANDOM: "Ngẫu nhiên", MANUAL: "Thủ công", ELO: "ELO",
  ALTERNATE_BREAK: "Luân phiên", WINNER_BREAK: "Người thắng", LOSER_BREAK: "Người thua",
  GAME: "Ván (game)", FRAME: "Frame",
  SEEDED: "Theo hạt giống",
  POINTS: "Điểm", RACK_DIFF: "Hiệu số rack", RACKS_WON: "Rack thắng", HEAD_TO_HEAD: "Đối đầu", SCORE_DIFF: "Hiệu số",
};
const seedingLabel = (m) =>
  m === "RANDOM" ? "Ngẫu nhiên" : m === "ELO" ? "ELO" : m === "MANUAL" ? "Thủ công" : m || "—";

/** 9_BALL → "9-Ball" cho gọn, dễ đọc. */
const gameTypeLabel = (v) => {
  if (!v) return "—";
  const map = { "9_BALL": "9-Ball", "8_BALL": "8-Ball", "10_BALL": "10-Ball" };
  return map[v] || v.replace(/_/g, " ");
};

/** Định dạng giá trị 1 field config theo dataType. */
const fmtConfigValue = (field) => {
  const v = field.value != null && field.value !== "" ? field.value : field.defaultValue;
  if (v == null || v === "") return "—";
  if (field.dataType === "BOOLEAN") return String(v) === "true" ? "Có" : "Không";
  return String(v).split(",").map((x) => ENUM_LABELS[x.trim()] || x.trim()).join(", ");
};

const InfoItem = ({ label, children, span2 = false }) => (
  <div className={span2 ? "sm:col-span-2" : ""}>
    <dt className="text-xs uppercase tracking-wide text-slate-400 mb-0.5">{label}</dt>
    <dd className="text-sm font-medium text-slate-800">{children || "—"}</dd>
  </div>
);

/* Dòng ngang gọn: nhãn trái · giá trị phải — tiết kiệm chiều cao, không cần scroll.
   span2 (nội dung dài như cơ cấu giải thưởng): xếp nhãn trên, giá trị dưới cho dễ đọc. */
const Row = ({ label, children, span2 = false }) => {
  if (span2) {
    return (
      <div className="sm:col-span-2 py-1.5 border-b border-slate-50 last:border-0">
        <div className="text-xs text-slate-500 mb-0.5">{label}</div>
        <div className="text-sm font-medium text-slate-800">{children ?? "—"}</div>
      </div>
    );
  }
  return (
    <div className="flex items-center justify-between gap-3 py-1.5 border-b border-slate-50 last:border-0">
      <span className="text-xs text-slate-500 shrink-0">{label}</span>
      <span className="text-sm font-medium text-slate-800 text-right truncate">{children ?? "—"}</span>
    </div>
  );
};

/* Khối section có tiêu đề + icon. */
const Section = ({ icon: Icon, title, action, children, className = "" }) => (
  <section className={`rounded-2xl border border-slate-200 bg-white ${className}`}>
    <div className="flex items-center justify-between gap-2 px-5 py-3 border-b border-slate-100">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-800">
        {Icon && <Icon size={15} className="text-slate-400" />}
        {title}
      </h3>
      {action}
    </div>
    <div className="p-5">{children}</div>
  </section>
);

const TournamentDetailPage = ({ api, basePath }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const tournamentId = Number(id);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState(null);
  const [configForm, setConfigForm] = useState(null);
  const [statusChanging, setStatusChanging] = useState(false);
  const [confirmState, setConfirmState] = useState(null);
  const [confirmError, setConfirmError] = useState(null);
  const [confirmErrorCode, setConfirmErrorCode] = useState(null);
  const [auditOpen, setAuditOpen] = useState(false);
  const [raceToOpen, setRaceToOpen] = useState(true);
  const [auditLogs, setAuditLogs] = useState(null);
  const [auditLoading, setAuditLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [data, cfg] = await Promise.all([
        api.getTournament(tournamentId),
        api.getConfigForm(tournamentId).catch(() => null),
      ]);
      setDetail(data);
      setConfigForm(cfg);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [api, tournamentId]);

  useEffect(() => {
    if (tournamentId) load();
  }, [tournamentId, load]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (
      basePath === "/manager/tournaments" &&
      params.get("tab") === "live" &&
      tournamentId
    ) {
      navigate(`${basePath}/${tournamentId}/live`, { replace: true });
    }
  }, [basePath, location.search, navigate, tournamentId]);

  const handleStatusChange = async (newStatus, confirmMsg) => {
    setConfirmError(null);
    setConfirmErrorCode(null);
    setConfirmState({ newStatus, confirmMsg });
  };

  const loadAuditLogs = useCallback(async () => {
    setAuditLoading(true);
    try {
      const data = await api.getAuditLogs(tournamentId);
      setAuditLogs(data);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setAuditLoading(false);
    }
  }, [api, tournamentId]);

  const toggleAudit = () => {
    const next = !auditOpen;
    setAuditOpen(next);
    if (next && auditLogs === null) loadAuditLogs();
  };

  const confirmStatusChange = async () => {
    if (!confirmState) return;
    setStatusChanging(true);
    setConfirmError(null);
    setConfirmErrorCode(null);
    try {
      await api.patchStatus(tournamentId, { status: confirmState.newStatus });
      toast.success("Đã cập nhật trạng thái giải");
      setConfirmState(null);
      load();
    } catch (err) {
      setConfirmError(getApiErrorMessage(err));
      setConfirmErrorCode(getApiErrorCode(err));
    } finally {
      setStatusChanging(false);
    }
  };

  if (loading) {
    return <p className="text-slate-500 py-12 text-center">Đang tải...</p>;
  }

  if (!detail) {
    return <p className="text-slate-500 py-12 text-center">Không tìm thấy giải</p>;
  }

  const statusStyle = TOURNAMENT_STATUS_STYLES[detail.status] || "bg-slate-100 text-slate-700";
  const statusLabel = TOURNAMENT_STATUS_LABELS[detail.status] || detail.status;
  const isDraft = detail.status === "DRAFT";
  const isOpenReg = detail.status === "OPEN_FOR_REGISTRATION";
  const isRegClosed = detail.status === "REGISTRATION_CLOSED";

  return (
    <div className="space-y-5">
      {/* Back */}
      <AdminButton variant="secondary" onClick={() => navigate(basePath)}>
        <ArrowLeft size={14} /> Danh sách giải
      </AdminButton>

      {/* Header card */}
      <AdminCard>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-xl font-bold text-slate-900">{detail.name}</h2>
          </div>
          <span className={`shrink-0 px-3 py-1 rounded-full text-sm font-semibold ${statusStyle}`}>
            {statusLabel}
          </span>
        </div>

        {/* Slot progress */}
        {detail.maxParticipants != null && (
          <div className="mt-5 pt-4 border-t border-slate-100">
            {(() => {
              const approved = detail.approvedCount ?? 0;
              const max = detail.maxParticipants;
              // Đăng ký chỉ mở ở DRAFT / OPEN_FOR_REGISTRATION; từ REGISTRATION_CLOSED trở đi là đã chốt danh sách
              const rosterLocked = !["DRAFT", "OPEN_FOR_REGISTRATION"].includes(detail.status);

              if (rosterLocked) {
                // Đã đóng đăng ký → giải chạy với đúng số người thực tế, thanh đầy
                return (
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-500">Người tham gia chính thức</span>
                      <span className="font-semibold text-indigo-600">Đã chốt {approved} người</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-indigo-400" style={{ width: "100%" }} />
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      Giải thi đấu với <strong className="text-slate-600">{approved}</strong> người (đã đóng đăng ký).
                    </p>
                  </div>
                );
              }

              // Đang mở đăng ký → hiển thị tiến độ so với tối đa
              const remaining = detail.remainingSlots ?? Math.max(0, max - approved);
              const pct = max > 0 ? Math.min(100, (approved / max) * 100) : 0;
              const full = remaining === 0;
              return (
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-500">Người tham gia chính thức</span>
                    <span className={`font-semibold ${full ? "text-red-600" : remaining <= 3 ? "text-amber-600" : "text-emerald-600"}`}>
                      {full ? "Đã đủ người" : `Còn ${remaining} slot`}
                    </span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${full ? "bg-red-500" : remaining <= 3 ? "bg-amber-400" : "bg-emerald-400"}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{approved} / {max} người</p>
                </div>
              );
            })()}
          </div>
        )}
      </AdminCard>

      {/* Sections: 2 cột */}
      <div className="grid gap-5 lg:grid-cols-3">
        {/* Cột trái (rộng) */}
        <div className="lg:col-span-2 space-y-5">
          <Section icon={Info} title="Thông tin chung">
            <div className="grid sm:grid-cols-2 gap-x-8">
              <Row label="Loại bi">{gameTypeLabel(detail.gameType)}</Row>
              <Row label="Thể thức">{detail.formatName || detail.format}</Row>
              <Row label="Hình thức">{participantLabel(detail.participantType)}</Row>
              <Row label="Số bàn thi đấu">{detail.tableCount ?? "—"}</Row>
              <Row label="Phí đăng ký">{fmtCurrency(detail.entryFee)}</Row>
              {detail.prizePool != null && (
                <Row label="Tổng giải thưởng">{fmtCurrency(detail.prizePool)}</Row>
              )}
              {detail.prizeDescription && (
                <Row label="Cơ cấu giải thưởng" span2>{detail.prizeDescription}</Row>
              )}
            </div>
          </Section>

          <Section
            icon={Settings2}
            title="Cấu hình chi tiết"
            action={detail.configComplete
              ? <span className="text-xs font-semibold text-emerald-600">✓ Hoàn tất</span>
              : <span className="text-xs font-semibold text-amber-600">Chưa hoàn tất</span>}
          >
            {!configForm ? (
              <p className="text-sm text-slate-400">Chưa có cấu hình chi tiết cho giải này.</p>
            ) : (
              <div className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-x-8">
                  <Row label="Phương thức xếp hạt giống">{seedingLabel(configForm.seedingMethod)}</Row>
                  {configForm.seedCount != null && configForm.seedCount !== "" && (
                    <Row label="Số hạt giống">{configForm.seedCount}</Row>
                  )}
                  {(configForm.fields || []).map((f) => (
                    <Row key={f.fieldKey} label={f.label || f.fieldKey}>{fmtConfigValue(f)}</Row>
                  ))}
                </div>

                {configForm.raceToRules?.length > 0 && (
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => setRaceToOpen((o) => !o)}
                      className="flex items-center justify-between w-full text-left px-3 py-2 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
                    >
                      <span className="text-sm font-medium text-slate-700">
                        Race-to theo vòng đấu
                        <span className="ml-1 text-xs text-slate-400">({configForm.raceToRules.length} vòng)</span>
                      </span>
                      {raceToOpen ? (
                        <ChevronUp size={16} className="text-slate-400" />
                      ) : (
                        <ChevronDown size={16} className="text-slate-400" />
                      )}
                    </button>
                    {raceToOpen && (
                      <div className="mt-2 rounded-xl border border-slate-100 divide-y divide-slate-50">
                        {configForm.raceToRules.map((r) => (
                          <div key={r.roundKey} className="flex items-center justify-between px-3 py-2 text-sm">
                            <span className="text-slate-600">{r.label || r.roundKey}</span>
                            <span className="flex items-center gap-2">
                              <span className="font-semibold text-slate-800">Race to {r.raceTo}</span>
                              {r.isOverridden && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-600 font-medium">tùy chỉnh</span>
                              )}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </Section>
        </div>

        {/* Cột phải */}
        <div className="space-y-5">
          <Section icon={CalendarClock} title="Thời gian">
            <dl className="space-y-3">
              <InfoItem label="Hạn đăng ký">{fmtDate(detail.registrationDeadline)}</InfoItem>
              <InfoItem label="Bắt đầu thi đấu">{fmtDate(detail.startAt)}</InfoItem>
              <InfoItem label="Kết thúc">{fmtDate(detail.endAt)}</InfoItem>
            </dl>
          </Section>

          <Section icon={MapPin} title="Địa điểm tổ chức">
            {detail.venue ? (
              <div className="space-y-3">
                <dl className="space-y-3">
                  <InfoItem label="Chi nhánh">{detail.venue.name}</InfoItem>
                  <InfoItem label="Số điện thoại">{detail.venue.phone}</InfoItem>
                  <InfoItem label="Địa chỉ">{detail.venue.address}</InfoItem>
                </dl>
                {detail.venue.images?.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {detail.venue.images.map((img) => (
                      <img
                        key={img.id}
                        src={img.url}
                        alt=""
                        className="h-16 w-16 rounded-lg object-cover border border-slate-200"
                      />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-slate-400">Chưa có địa điểm.</p>
            )}
          </Section>

          <Section icon={Users} title="Đăng ký">
            <dl className="space-y-3">
              <InfoItem label="Đăng ký online">
                {detail.isRegister ? (
                  <span className="text-indigo-700">
                    Có
                    {(detail.registrationFormTemplateName || detail.registrationFormTemplateCode) && (
                      <span className="ml-1 text-slate-500 font-normal">
                        — {detail.registrationFormTemplateName || detail.registrationFormTemplateCode}
                      </span>
                    )}
                  </span>
                ) : (
                  "Không"
                )}
              </InfoItem>
            </dl>
          </Section>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2">
        {isDraft && (
          <>
            <AdminButton
              variant="primary"
              onClick={() => navigate(`${basePath}/${id}/edit?step=2`)}
            >
              {detail.configComplete ? "Chỉnh config" : "Tiếp tục cấu hình"}
            </AdminButton>
            <AdminButton
              variant="secondary"
              onClick={() => navigate(`${basePath}/${id}/edit`)}
            >
              Sửa thông tin
            </AdminButton>
          </>
        )}

        {isOpenReg && (
          <AdminButton
            variant="secondary"
            disabled={statusChanging}
            onClick={() =>
              handleStatusChange(
                "REGISTRATION_CLOSED",
                "Đóng đăng ký giải này?"
              )
            }
          >
            Đóng đăng ký
          </AdminButton>
        )}

        {isRegClosed && (
          <AdminButton
            variant="primary"
            onClick={() => navigate(`${basePath}/${id}/draw`)}
          >
            🎲 Bốc thăm & Sinh bracket
          </AdminButton>
        )}

        {detail.status === "DRAW_PREVIEW" && (
          <AdminButton
            variant="primary"
            onClick={() => navigate(`${basePath}/${id}/draw`)}
          >
            🎲 Xem & Xác nhận bracket (Preview)
          </AdminButton>
        )}

        {detail.status === "DRAW_DONE" && (
          <>
            <AdminButton
              variant="primary"
              onClick={() => navigate(`${basePath}/${id}/draw`)}
            >
              Xem / Quản lý bracket
            </AdminButton>
            <AdminButton
              variant="secondary"
              disabled={statusChanging}
              onClick={() => handleStatusChange("IN_PROGRESS", "Bắt đầu giải đấu?")}
            >
              Bắt đầu giải đấu
            </AdminButton>
          </>
        )}

        {detail.status === "FINAL_BRACKET_READY" && (
          <>
            <AdminButton
              variant="secondary"
              onClick={() => navigate(`${basePath}/${id}/draw`)}
            >
              Quản lý bracket chung kết
            </AdminButton>
            <AdminButton
              variant="primary"
              disabled={statusChanging}
              onClick={() => handleStatusChange(
                "COMPLETED",
                "Kết thúc giải đấu? Tất cả trận đấu phải hoàn thành (hoặc walkover/BYE) trước khi kết thúc. Không thể hoàn tác."
              )}
            >
              🏆 Kết thúc giải đấu
            </AdminButton>
          </>
        )}

        {detail.status === "IN_PROGRESS" && (
          <>
            <AdminButton
              variant="secondary"
              onClick={() => navigate(`${basePath}/${id}/draw`)}
            >
              Quản lý trận đấu
            </AdminButton>
            <AdminButton
              variant="primary"
              disabled={statusChanging}
              onClick={() => handleStatusChange(
                "COMPLETED",
                "Kết thúc giải đấu? Tất cả trận đấu phải hoàn thành (hoặc walkover/BYE) trước khi kết thúc. Không thể hoàn tác."
              )}
            >
              🏆 Kết thúc giải đấu
            </AdminButton>
          </>
        )}

        {detail.status === "COMPLETED" && (
          <AdminButton
            variant="secondary"
            onClick={() => navigate(`${basePath}/${id}/draw`)}
          >
            🏆 Xem bracket & Kết quả
          </AdminButton>
        )}

        {basePath === "/manager/tournaments" && (
          <AdminButton
            variant="secondary"
            onClick={() => navigate(`${basePath}/${id}/live`)}
          >
            Trực tiếp
          </AdminButton>
        )}

        {detail.isRegister && ["OPEN_FOR_REGISTRATION", "REGISTRATION_CLOSED", "DRAW_PREVIEW", "DRAW_DONE", "FINAL_BRACKET_READY", "IN_PROGRESS", "COMPLETED"].includes(detail.status) && (
          <AdminButton
            variant="secondary"
            onClick={() => navigate(`${basePath}/${id}/registrations`)}
          >
            Quản lý đăng ký
          </AdminButton>
        )}
        {detail.status !== "DRAFT" && (
          <AdminButton
            variant="secondary"
            onClick={() => navigate(`${basePath}/${id}/participants`)}
          >
            Người tham gia
          </AdminButton>
        )}
        {detail.status !== "DRAFT" && (
          <AdminButton
            variant="secondary"
            onClick={() => navigate(`${basePath}/${id}/notifications`)}
          >
            Thông báo
          </AdminButton>
        )}

        {(isDraft || isOpenReg || isRegClosed) && (
          <AdminButton
            variant="danger"
            disabled={statusChanging}
            onClick={() =>
              handleStatusChange("CANCELLED", "Hủy giải đấu này? Không thể hoàn tác.")
            }
          >
            Hủy giải
          </AdminButton>
        )}
      </div>

      {/* Audit trail */}
      <AdminCard>
        <button
          type="button"
          onClick={toggleAudit}
          className="flex items-center justify-between w-full text-left"
        >
          <span className="flex items-center gap-2 text-sm font-semibold text-slate-800">
            <History size={16} /> Lịch sử trạng thái
          </span>
          {auditOpen ? (
            <ChevronUp size={16} className="text-slate-400" />
          ) : (
            <ChevronDown size={16} className="text-slate-400" />
          )}
        </button>

        {auditOpen && (
          <div className="mt-4 pt-4 border-t border-slate-100">
            {auditLoading ? (
              <p className="text-sm text-slate-400">Đang tải...</p>
            ) : !auditLogs || auditLogs.length === 0 ? (
              <p className="text-sm text-slate-400">Chưa có lịch sử thay đổi.</p>
            ) : (
              <ul className="space-y-4">
                {auditLogs.map((log) => {
                  const isAuto = log.changeType === "AUTO";
                  const isWarning = log.changeType === "WARNING";
                  const Icon = isWarning ? AlertTriangle : isAuto ? Bot : UserCog;
                  const iconStyle = isWarning
                    ? "bg-amber-50 text-amber-600"
                    : isAuto
                      ? "bg-cyan-50 text-cyan-600"
                      : "bg-indigo-50 text-indigo-600";
                  return (
                    <li key={log.id} className="flex gap-3">
                      <div className={`mt-0.5 shrink-0 w-7 h-7 rounded-full flex items-center justify-center ${iconStyle}`}>
                        <Icon size={14} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-800">
                          {isWarning ? (
                            <span className="font-medium text-amber-700">Cảnh báo</span>
                          ) : (
                            <>
                              <span className="font-medium">{log.fromStatusLabel}</span>
                              <span className="text-slate-400 mx-1">→</span>
                              <span className="font-medium">{log.toStatusLabel}</span>
                            </>
                          )}
                        </p>
                        {log.note && <p className="text-xs text-slate-500 mt-0.5">{log.note}</p>}
                        <p className="text-xs text-slate-400 mt-0.5">
                          {log.changedByName} · {fmtDate(log.createdAt)}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}
      </AdminCard>

      <ConfirmModal
        open={!!confirmState}
        onCancel={() => {
          setConfirmState(null);
          setConfirmError(null);
          setConfirmErrorCode(null);
        }}
        onConfirm={confirmStatusChange}
        title="Xác nhận thao tác"
        message={confirmState?.confirmMsg || ""}
        errorMessage={confirmError}
        extraAction={
          confirmErrorCode === PROGRESSIVE_CONFIG_INVALID_CODE
            ? {
                label: "Chỉnh sửa cấu hình",
                onClick: () => {
                  setConfirmState(null);
                  setConfirmError(null);
                  setConfirmErrorCode(null);
                  // intent=close-registration: wizard hiện nút "Lưu và đóng đăng ký"
                  // thay vì quay về luồng mở đăng ký như lúc setup ban đầu.
                  navigate(`${basePath}/${id}/edit?step=2&intent=close-registration`);
                },
              }
            : null
        }
        confirmText="Xác nhận"
        confirmVariant={confirmState?.newStatus === "CANCELLED" ? "danger" : "primary"}
        loading={statusChanging}
      />
    </div>
  );
};

export default TournamentDetailPage;
