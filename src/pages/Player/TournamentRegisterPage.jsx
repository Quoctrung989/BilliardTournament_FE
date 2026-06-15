import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import {
  getTournamentRegistrationForm,
  submitTournamentRegistration,
} from "../../api/playerRegistrationApi";
import RegistrationDynamicForm from "../../components/registration-form/RegistrationDynamicForm";
import { PARTICIPANT_TYPES } from "../../constants/tournamentConfig";
import { getApiErrorMessage } from "../../utils/apiError";

const TournamentRegisterPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const tournamentId = Number(id);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formPreview, setFormPreview] = useState(null);
  const [values, setValues] = useState({});
  const [registrationType, setRegistrationType] = useState("INDIVIDUAL");
  const [note, setNote] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getTournamentRegistrationForm(tournamentId);
      setFormPreview(data);
      if (data.participantType) {
        setRegistrationType(data.participantType);
      }
      const initial = {};
      (data.fields || []).forEach((f) => {
        if (f.defaultValue) initial[f.fieldKey] = f.defaultValue;
      });
      setValues(initial);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [tournamentId]);

  useEffect(() => {
    if (tournamentId) load();
  }, [tournamentId, load]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const fieldValues = (formPreview?.fields || []).map((f) => ({
        fieldKey: f.fieldKey,
        value: String(values[f.fieldKey] ?? ""),
      }));
      await submitTournamentRegistration(tournamentId, {
        registrationType,
        note: note.trim() || null,
        fieldValues,
      });
      toast.success("Đăng ký thành công");
      navigate("/player/registrations");
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center text-slate-500">
        Đang tải form đăng ký...
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <button
        type="button"
        className="text-sm text-indigo-600 mb-4"
        onClick={() => navigate("/event")}
      >
        ← Quay lại sự kiện
      </button>
      <div className="admin-card p-6">
        <h1 className="text-xl font-bold text-slate-900 mb-1">
          Đăng ký: {formPreview?.tournamentName}
        </h1>
        <p className="text-sm text-slate-500 mb-6">
          Template: {formPreview?.templateName}
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="admin-label">Loại đăng ký</label>
            <select
              className="admin-select w-full"
              value={registrationType}
              onChange={(e) => setRegistrationType(e.target.value)}
            >
              {PARTICIPANT_TYPES.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
          <RegistrationDynamicForm
            fields={formPreview?.fields || []}
            values={values}
            onChange={setValues}
          />
          <div>
            <label className="admin-label">Ghi chú</label>
            <textarea
              className="admin-input w-full min-h-[60px]"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
          <button
            type="submit"
            className="admin-btn admin-btn-primary w-full"
            disabled={submitting}
          >
            {submitting ? "Đang gửi..." : "Gửi đăng ký"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default TournamentRegisterPage;
