import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import AdminButton from "../../../components/admin/ui/AdminButton";
import AdminCard from "../../../components/admin/ui/AdminCard";
import { TOURNAMENT_STATUS_LABELS } from "../../../constants/tournamentConfig";
import { getApiErrorMessage } from "../../../utils/apiError";

const TournamentDetailPage = ({ api, basePath }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const tournamentId = Number(id);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState(null);

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

  if (loading) {
    return <p className="text-slate-500 py-12 text-center">Đang tải...</p>;
  }

  if (!detail) {
    return <p className="text-slate-500 py-12 text-center">Không tìm thấy giải</p>;
  }

  const statusLabel =
    TOURNAMENT_STATUS_LABELS[detail.status] || detail.status;
  const isDraft = detail.status === "DRAFT";

  return (
    <div className="space-y-6">
      <AdminCard>
        <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">{detail.name}</h2>
            <p className="text-sm text-slate-500 mt-1">{detail.description}</p>
          </div>
          <span className="inline-flex px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800">
            {statusLabel}
          </span>
        </div>
        <dl className="grid gap-3 sm:grid-cols-2 text-sm">
          <div>
            <dt className="text-slate-500">Loại bi</dt>
            <dd className="font-medium">{detail.gameType}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Thể thức</dt>
            <dd className="font-medium">
              {detail.formatName || detail.format}
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">Số người tối đa</dt>
            <dd className="font-medium">{detail.maxParticipants}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Phí đăng ký</dt>
            <dd className="font-medium">
              {detail.entryFee != null
                ? `${Number(detail.entryFee).toLocaleString("vi-VN")} đ`
                : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">Config</dt>
            <dd className="font-medium">
              {detail.configComplete ? "Đã hoàn tất" : "Chưa hoàn tất"}
            </dd>
          </div>
        </dl>
        {detail.configSummary && (
          <div className="mt-4 pt-4 border-t text-sm text-slate-600">
            <p>
              Hạt giống: <strong>{detail.configSummary.seedingMethod}</strong>
              {detail.configSummary.bracketSize != null && (
                <>
                  {" "}
                  · Bracket: <strong>{detail.configSummary.bracketSize}</strong>
                </>
              )}
              {detail.configSummary.finalRaceTo != null && (
                <>
                  {" "}
                  · CK race-to: <strong>{detail.configSummary.finalRaceTo}</strong>
                </>
              )}
            </p>
          </div>
        )}
      </AdminCard>

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
        <AdminButton variant="secondary" onClick={() => navigate(basePath)}>
          Danh sách
        </AdminButton>
      </div>
    </div>
  );
};

export default TournamentDetailPage;
