import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import AdminButton from "../../../components/admin/ui/AdminButton";
import AdminCard from "../../../components/admin/ui/AdminCard";
import ConfirmModal from "../../../components/shared/ui/ConfirmModal";
import {
  TOURNAMENT_STATUS_LABELS,
  TOURNAMENT_STATUS_STYLES,
} from "../../../constants/tournamentConfig";
import { getApiErrorMessage } from "../../../utils/apiError";

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

const InfoItem = ({ label, children, span2 = false }) => (
  <div className={span2 ? "sm:col-span-2" : ""}>
    <dt className="text-xs uppercase tracking-wide text-slate-400 mb-0.5">{label}</dt>
    <dd className="text-sm font-medium text-slate-800">{children || "—"}</dd>
  </div>
);

const TournamentDetailPage = ({ api, basePath }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const tournamentId = Number(id);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState(null);
  const [statusChanging, setStatusChanging] = useState(false);
  const [confirmState, setConfirmState] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getTournament(tournamentId);
      setDetail(data);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [api, tournamentId]);

  useEffect(() => {
    if (tournamentId) load();
  }, [tournamentId, load]);

  const handleStatusChange = async (newStatus, confirmMsg) => {
    setConfirmState({ newStatus, confirmMsg });
  };

  const confirmStatusChange = async () => {
    if (!confirmState) return;
    setStatusChanging(true);
    try {
      await api.patchStatus(tournamentId, { status: confirmState.newStatus });
      toast.success("Đã cập nhật trạng thái giải");
      setConfirmState(null);
      load();
    } catch (err) {
      toast.error(getApiErrorMessage(err));
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
      <button
        type="button"
        className="text-sm text-indigo-600 hover:underline"
        onClick={() => navigate(basePath)}
      >
        ← Danh sách giải
      </button>

      {/* Header card */}
      <AdminCard>
        <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
          <div>
            <h2 className="text-xl font-bold text-slate-900">{detail.name}</h2>
            {detail.description && (
              <p className="text-sm text-slate-500 mt-1 max-w-2xl">{detail.description}</p>
            )}
          </div>
          <span className={`shrink-0 px-3 py-1 rounded-full text-sm font-semibold ${statusStyle}`}>
            {statusLabel}
          </span>
        </div>

        {/* Main info */}
        <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 text-sm mb-5">
          <InfoItem label="Loại bi">{detail.gameType}</InfoItem>
          <InfoItem label="Thể thức">{detail.formatName || detail.format}</InfoItem>
          <InfoItem label="Hình thức">{participantLabel(detail.participantType)}</InfoItem>
          <InfoItem label="Phí đăng ký">{fmtCurrency(detail.entryFee)}</InfoItem>
          {detail.prizePool && (
            <InfoItem label="Tổng giải thưởng">{fmtCurrency(detail.prizePool)}</InfoItem>
          )}
          {detail.prizeDescription && (
            <InfoItem label="Cơ cấu giải thưởng" span2>{detail.prizeDescription}</InfoItem>
          )}
        </dl>

        {/* Slot progress */}
        {detail.maxParticipants != null && (
          <div className="pt-4 border-t border-slate-100">
            {(() => {
              const approved = detail.approvedCount ?? 0;
              const max = detail.maxParticipants;
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

        {/* Dates */}
        <dl className="grid gap-4 sm:grid-cols-3 text-sm border-t border-slate-100 pt-4 mb-5">
          <InfoItem label="Hạn đăng ký">{fmtDate(detail.registrationDeadline)}</InfoItem>
          <InfoItem label="Bắt đầu thi đấu">{fmtDate(detail.startAt)}</InfoItem>
          <InfoItem label="Kết thúc">{fmtDate(detail.endAt)}</InfoItem>
        </dl>

        {/* Config & registration */}
        <dl className="grid gap-4 sm:grid-cols-2 text-sm border-t border-slate-100 pt-4">
          <InfoItem label="Cấu hình">
            {detail.configComplete ? (
              <span className="text-emerald-600 font-semibold">✓ Hoàn tất</span>
            ) : (
              <span className="text-amber-600">Chưa hoàn tất</span>
            )}
          </InfoItem>
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

        {/* Config summary */}
        {detail.configSummary && (
          <div className="mt-4 pt-4 border-t border-slate-100">
            <p className="text-xs uppercase text-slate-400 mb-2">Tóm tắt cấu hình</p>
            <div className="flex flex-wrap gap-4 text-sm text-slate-700">
              {detail.configSummary.seedingMethod && (
                <span>
                  Hạt giống:{" "}
                  <strong>
                    {detail.configSummary.seedingMethod === "RANDOM"
                      ? "Ngẫu nhiên"
                      : detail.configSummary.seedingMethod === "ELO"
                        ? "ELO"
                        : "Thủ công"}
                  </strong>
                </span>
              )}
              {detail.configSummary.bracketSize != null && (
                <span>Bracket: <strong>{detail.configSummary.bracketSize} slot</strong></span>
              )}
              {detail.configSummary.finalRaceTo != null && (
                <span>CK race-to: <strong>{detail.configSummary.finalRaceTo}</strong></span>
              )}
              {detail.configSummary.breakRule && (
                <span>
                  Break:{" "}
                  <strong>
                    {detail.configSummary.breakRule === "ALTERNATE_BREAK"
                      ? "Luân phiên"
                      : detail.configSummary.breakRule === "WINNER_BREAK"
                        ? "Người thắng"
                        : "Người thua"}
                  </strong>
                </span>
              )}
              {detail.configSummary.thirdPlaceMatch != null && (
                <span>Tranh hạng 3: <strong>{detail.configSummary.thirdPlaceMatch ? "Có" : "Không"}</strong></span>
              )}
            </div>
          </div>
        )}
      </AdminCard>

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
            variant="secondary"
            disabled={statusChanging}
            onClick={() =>
              handleStatusChange("DRAW_DONE", "Xác nhận đã bốc thăm?")
            }
          >
            Xác nhận bốc thăm
          </AdminButton>
        )}

        {detail.status === "DRAW_DONE" && (
          <AdminButton
            variant="primary"
            disabled={statusChanging}
            onClick={() =>
              handleStatusChange("IN_PROGRESS", "Bắt đầu giải đấu?")
            }
          >
            Bắt đầu giải đấu
          </AdminButton>
        )}

        {detail.isRegister && ["OPEN_FOR_REGISTRATION", "REGISTRATION_CLOSED", "DRAW_DONE", "IN_PROGRESS"].includes(detail.status) && (
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

      <ConfirmModal
        open={!!confirmState}
        onCancel={() => setConfirmState(null)}
        onConfirm={confirmStatusChange}
        title="Xác nhận thao tác"
        message={confirmState?.confirmMsg || ""}
        confirmText="Xác nhận"
        confirmVariant={confirmState?.newStatus === "CANCELLED" ? "danger" : "primary"}
        loading={statusChanging}
      />
    </div>
  );
};

export default TournamentDetailPage;
