import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";
import { adminEmailApi } from "../../../api/emailApi";
import AdminButton from "../../../components/admin/ui/AdminButton";
import AdminCard from "../../../components/admin/ui/AdminCard";
import { getApiErrorMessage } from "../../../utils/apiError";

const SYSTEM_VARIABLES = [
  { key: "system.appName", description: "Tên hệ thống", sample: "BTMS" },
  { key: "system.supportEmail", description: "Email hỗ trợ", sample: "support@btms.vn" },
  { key: "system.currentYear", description: "Năm hiện tại", sample: String(new Date().getFullYear()) },
];

/** Thay {{system.xxx}} bằng giá trị mẫu để xem trước — chỉ dùng phía client, không gọi API render. */
const previewSubstitute = (html) =>
  SYSTEM_VARIABLES.reduce(
    (acc, v) => acc.replaceAll(`{{${v.key}}}`, v.sample),
    html || ""
  );

const EmailLayoutSettingsPage = () => {
  const [form, setForm] = useState({ headerHtml: "", footerHtml: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [focusedField, setFocusedField] = useState("headerHtml");
  const headerRef = useRef(null);
  const footerRef = useRef(null);
  const [testEmail, setTestEmail] = useState("");
  const [sendingTest, setSendingTest] = useState(false);

  useEffect(() => {
    adminEmailApi
      .getLayoutSettings()
      .then((data) => setForm({ headerHtml: data.headerHtml || "", footerHtml: data.footerHtml || "" }))
      .catch((err) => toast.error(getApiErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  const patchForm = (updates) => setForm((f) => ({ ...f, ...updates }));

  const insertVariable = (key) => {
    const placeholder = `{{${key}}}`;
    const field = focusedField === "footerHtml" ? footerRef : headerRef;
    const el = field.current;
    const currentValue = form[focusedField] || "";
    if (el && typeof el.selectionStart === "number") {
      const start = el.selectionStart;
      const end = el.selectionEnd;
      const next = currentValue.slice(0, start) + placeholder + currentValue.slice(end);
      patchForm({ [focusedField]: next });
      requestAnimationFrame(() => {
        el.focus();
        el.selectionStart = el.selectionEnd = start + placeholder.length;
      });
    } else {
      patchForm({ [focusedField]: currentValue + placeholder });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.headerHtml.trim() || !form.footerHtml.trim()) {
      toast.error("Header và footer không được để trống");
      return;
    }
    setSaving(true);
    try {
      const data = await adminEmailApi.updateLayoutSettings(form);
      setForm({ headerHtml: data.headerHtml || "", footerHtml: data.footerHtml || "" });
      toast.success("Đã cập nhật khung email");
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleSendTest = async () => {
    if (!testEmail.trim()) {
      toast.error("Vui lòng nhập email nhận thử");
      return;
    }
    setSendingTest(true);
    try {
      await adminEmailApi.sendLayoutTest({
        email: testEmail.trim(),
        headerHtml: form.headerHtml,
        footerHtml: form.footerHtml,
      });
      toast.success(`Đã gửi email thử tới ${testEmail.trim()}`);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setSendingTest(false);
    }
  };

  const previewHeader = useMemo(() => previewSubstitute(form.headerHtml), [form.headerHtml]);
  const previewFooter = useMemo(() => previewSubstitute(form.footerHtml), [form.footerHtml]);

  if (loading) {
    return (
      <AdminCard>
        <p className="text-slate-400 text-sm">Đang tải...</p>
      </AdminCard>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <AdminCard title="Khung header / footer chung">
        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="text-xs text-slate-500">
            Phần header và footer này được chèn vào mọi email gửi ra (phía trên và dưới nội dung
            từng mẫu email). Bố cục bảng/màu nền responsive được giữ cố định để đảm bảo hiển thị
            đúng trên các ứng dụng email — bạn chỉ chỉnh nội dung bên trong.
          </p>
          <div>
            <label className="admin-label">Header (đầu email) *</label>
            <textarea
              ref={headerRef}
              className="admin-input mt-1 font-mono text-xs"
              rows={6}
              value={form.headerHtml}
              onFocus={() => setFocusedField("headerHtml")}
              onChange={(e) => patchForm({ headerHtml: e.target.value })}
            />
          </div>
          <div>
            <label className="admin-label">Footer (chân email) *</label>
            <textarea
              ref={footerRef}
              className="admin-input mt-1 font-mono text-xs"
              rows={4}
              value={form.footerHtml}
              onFocus={() => setFocusedField("footerHtml")}
              onChange={(e) => patchForm({ footerHtml: e.target.value })}
            />
          </div>
          <div>
            <label className="admin-label">
              Chèn biến vào {focusedField === "footerHtml" ? "footer" : "header"} (click để chèn tại vị trí con trỏ)
            </label>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {SYSTEM_VARIABLES.map((v) => (
                <button
                  key={v.key}
                  type="button"
                  title={v.description}
                  onClick={() => insertVariable(v.key)}
                  className="px-2 py-1 rounded-md bg-indigo-50 text-indigo-700 text-xs font-mono hover:bg-indigo-100"
                >
                  {`{{${v.key}}}`}
                </button>
              ))}
            </div>
          </div>
          <div className="flex justify-end">
            <AdminButton type="submit" disabled={saving}>
              {saving ? "Đang lưu..." : "Lưu"}
            </AdminButton>
          </div>
        </form>
      </AdminCard>

      <AdminCard title="Xem trước">
        <div className="rounded-xl overflow-hidden border border-slate-200" style={{ fontFamily: "Arial, Helvetica, sans-serif" }}>
          <div
            style={{ background: "linear-gradient(135deg,#010851,#241c7a)", padding: "28px 32px", color: "#ffffff" }}
            dangerouslySetInnerHTML={{ __html: previewHeader }}
          />
          <div style={{ padding: "32px", color: "#1f2430", fontSize: 15, lineHeight: 1.65 }}>
            <p style={{ margin: "0 0 12px" }}>Nội dung email mẫu sẽ hiển thị ở đây...</p>
          </div>
          <div
            style={{
              background: "#f7f7fb",
              padding: "18px 32px",
              textAlign: "center",
              fontSize: 12,
              color: "#8a8fa3",
              borderTop: "1px solid #ececf3",
            }}
            dangerouslySetInnerHTML={{ __html: previewFooter }}
          />
        </div>
        <p className="text-xs text-slate-400 mt-2">
          Bản xem trước dùng giá trị mẫu cho các biến {"{{system.*}}"} — nội dung thật sẽ lấy từ cấu
          hình hệ thống lúc gửi.
        </p>

        <div className="mt-4 pt-4 border-t border-slate-100">
          <label className="admin-label">Gửi thử tới hộp thư thật</label>
          <p className="text-xs text-slate-500 mt-1 mb-2">
            Gửi email mẫu dùng đúng nội dung header/footer đang soạn ở trên (chưa cần bấm Lưu) để
            kiểm tra hiển thị thực tế trên Gmail/Outlook...
          </p>
          <div className="flex gap-2">
            <input
              type="email"
              className="admin-input flex-1"
              placeholder="email-nhan-thu@example.com"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
            />
            <AdminButton type="button" variant="secondary" disabled={sendingTest} onClick={handleSendTest}>
              {sendingTest ? "Đang gửi..." : "Gửi thử"}
            </AdminButton>
          </div>
        </div>
      </AdminCard>
    </div>
  );
};

export default EmailLayoutSettingsPage;
