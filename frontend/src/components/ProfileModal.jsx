import { useEffect, useState } from "react";
import { getProfile, updateProfile, updatePassword, deleteAccount } from "../lib/api";

const EMPLOYMENT_OPTIONS = [
  { value: "", label: "Select status..." },
  { value: "student", label: "Student" },
  { value: "employed", label: "Employed" },
  { value: "unemployed", label: "Unemployed / Seeking" },
  { value: "freelance", label: "Freelance / Contract" },
  { value: "other", label: "Other" },
];

const PASSWORD_RULES = [
  { test: (p) => p.length >= 8,           label: "At least 8 characters" },
  { test: (p) => /[A-Z]/.test(p),         label: "One uppercase letter" },
  { test: (p) => /[a-z]/.test(p),  label: "One lowercase letter" },
  { test: (p) => /[0-9]/.test(p),         label: "One number" },
];

function validatePassword(password) {
  return PASSWORD_RULES.every((r) => r.test(password));
}

export default function ProfileModal({ onClose, onLogout }) {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    organization: "",
    employmentStatus: "",
    targetRole: "",
  });
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Password change state
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [pwForm, setPwForm] = useState({ current: "", next: "", confirm: "" });
  const [pwError, setPwError] = useState("");
  const [pwSaved, setPwSaved] = useState(false);
  const [changingPw, setChangingPw] = useState(false);

  useEffect(() => {
    getProfile()
      .then((data) => {
        setEmail(data.email);
        setForm({
          firstName: data.firstName || "",
          lastName: data.lastName || "",
          organization: data.organization || "",
          employmentStatus: data.employmentStatus || "",
          targetRole: data.targetRole || "",
        });
      })
      .catch((err) => setError(err.message || "Failed to load profile."))
      .finally(() => setLoading(false));
  }, []);

  function handleChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      const updated = await updateProfile(form);
      setForm({
        firstName: updated.firstName || "",
        lastName: updated.lastName || "",
        organization: updated.organization || "",
        employmentStatus: updated.employmentStatus || "",
        targetRole: updated.targetRole || "",
      });
      setSaved(true);
    } catch (err) {
      setError(err.message || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  }

  function handlePwChange(field, value) {
    setPwForm((prev) => ({ ...prev, [field]: value }));
    setPwError("");
    setPwSaved(false);
  }

  function cancelPasswordForm() {
    setShowPasswordForm(false);
    setPwForm({ current: "", next: "", confirm: "" });
    setPwError("");
    setPwSaved(false);
  }

  async function handleChangePassword() {
    setPwError("");

    if (!pwForm.current) {
      setPwError("Please enter your current password.");
      return;
    }
    if (!validatePassword(pwForm.next)) {
      setPwError("New password doesn't meet the requirements below.");
      return;
    }
    if (pwForm.next !== pwForm.confirm) {
      setPwError("New passwords don't match.");
      return;
    }

    setChangingPw(true);
    try {
      await updatePassword({ currentPassword: pwForm.current, newPassword: pwForm.next });
      setPwSaved(true);
      setPwForm({ current: "", next: "", confirm: "" });
      setTimeout(() => {
        setShowPasswordForm(false);
        setPwSaved(false);
      }, 2000);
    } catch (err) {
      setPwError(err.message || "Failed to change password.");
    } finally {
      setChangingPw(false);
    }
  }

  async function handleDeleteAccount() {
    setDeleting(true);
    setError("");
    try {
      await deleteAccount();
      localStorage.removeItem("token");
      localStorage.removeItem("userEmail");
      onLogout();
    } catch (err) {
      setError(err.message || "Failed to delete account.");
      setDeleting(false);
    }
  }

  const busy = saving || deleting || changingPw;

  const pwRuleStatus = PASSWORD_RULES.map((r) => ({
    label: r.label,
    passing: r.test(pwForm.next),
  }));

  return (
    <div
      className="dashboard-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label="Profile"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !busy) onClose();
      }}
    >
      <div className="dashboard-modal-card" style={{ maxWidth: 480 }}>
        <div className="dashboard-modal-head">
          <div>
            <h3 className="dashboard-modal-title">My Profile</h3>
            <p className="dashboard-modal-subtitle">{email}</p>
          </div>
          <button className="icon-btn" type="button" aria-label="Close" onClick={onClose} disabled={busy}>
            ✕
          </button>
        </div>

        <div className="dashboard-modal-body">
          {error ? <div className="form-error">{error}</div> : null}

          {loading ? (
            <p style={{ textAlign: "center", padding: "24px 0", opacity: 0.6 }}>Loading profile...</p>
          ) : (
            <form onSubmit={handleSave}>
              {!showPasswordForm && <>
              <div className="dashboard-detail-grid">
                <label className="reminder-field">
                  <span>First Name</span>
                  <input
                    value={form.firstName}
                    onChange={(e) => handleChange("firstName", e.target.value)}
                    required
                  />
                </label>
                <label className="reminder-field">
                  <span>Last Name</span>
                  <input
                    value={form.lastName}
                    onChange={(e) => handleChange("lastName", e.target.value)}
                    required
                  />
                </label>
                <label className="reminder-field">
                  <span>Organization</span>
                  <input
                    value={form.organization}
                    onChange={(e) => handleChange("organization", e.target.value)}
                    placeholder="Company or school"
                  />
                </label>
                <label className="reminder-field">
                  <span>Employment Status</span>
                  <select
                    value={form.employmentStatus}
                    onChange={(e) => handleChange("employmentStatus", e.target.value)}
                  >
                    {EMPLOYMENT_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </label>
                <label className="reminder-field" style={{ gridColumn: "1 / -1" }}>
                  <span>Target Role</span>
                  <input
                    value={form.targetRole}
                    onChange={(e) => handleChange("targetRole", e.target.value)}
                    placeholder="e.g., Software Engineer"
                  />
                </label>
              </div>

              <div className="dashboard-modal-actions" style={{ marginTop: 16 }}>
                {saved ? (
                  <span style={{ fontSize: 13, color: "var(--accent)" }}>Profile updated.</span>
                ) : <span />}
                <div className="dashboard-modal-actions-right">
                  <button className="ghost-btn" type="button" onClick={onClose} disabled={busy}>
                    Close
                  </button>
                  <button className="primary-btn" type="submit" disabled={saving}>
                    {saving ? "Saving..." : "Save"}
                  </button>
                </div>
              </div>
            </>}  

                            {/* ── Change Password ── */}
              <div style={{ borderTop: "1px solid var(--border)", marginTop: 20, paddingTop: 20 }}>
                {!showPasswordForm ? (
                  <button
                    className="ghost-btn"
                    type="button"
                    onClick={() => setShowPasswordForm(true)}
                    disabled={busy}
                    style={{ width: "100%" }}
                  >
                    Change Password
                  </button>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>Change Password</p>

                    {pwError && <div className="form-error">{pwError}</div>}
                    {pwSaved && (
                      <div style={{ fontSize: 13, color: "var(--accent)" }}>
                        Password updated successfully.
                      </div>
                    )}

                    <label className="reminder-field">
                      <span>Current Password</span>
                      <input
                        type="password"
                        value={pwForm.current}
                        onChange={(e) => handlePwChange("current", e.target.value)}
                        autoComplete="current-password"
                        disabled={changingPw}
                      />
                    </label>
                    <label className="reminder-field">
                      <span>New Password</span>
                      <input
                        type="password"
                        value={pwForm.next}
                        onChange={(e) => handlePwChange("next", e.target.value)}
                        autoComplete="new-password"
                        disabled={changingPw}
                      />
                    </label>

                    {pwForm.next.length > 0 && (
                      <ul style={{ margin: 0, padding: "0 0 0 18px", display: "flex", flexDirection: "column", gap: 3 }}>
                        {pwRuleStatus.map((r) => (
                          <li
                            key={r.label}
                            style={{
                              fontSize: 12,
                              color: r.passing ? "var(--accent)" : "var(--text-muted, #999)",
                              transition: "color 0.15s",
                            }}
                          >
                            {r.passing ? "✓" : "○"} {r.label}
                          </li>
                        ))}
                      </ul>
                    )}

                    <label className="reminder-field">
                      <span>Confirm New Password</span>
                      <input
                        type="password"
                        value={pwForm.confirm}
                        onChange={(e) => handlePwChange("confirm", e.target.value)}
                        autoComplete="new-password"
                        disabled={changingPw}
                      />
                    </label>

                    <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                      <button
                        className="ghost-btn"
                        type="button"
                        onClick={cancelPasswordForm}
                        disabled={changingPw}
                      >
                        Cancel
                      </button>
                      <button
                        className="primary-btn"
                        type="button"
                        onClick={handleChangePassword}
                        disabled={changingPw}
                      >
                        {changingPw ? "Updating..." : "Update Password"}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {!showPasswordForm && <div style={{ borderTop: "1px solid var(--border)", marginTop: 20, paddingTop: 20 }}>
                {!confirmDelete ? (
                  <button
                    className="danger-btn"
                    type="button"
                    onClick={() => setConfirmDelete(true)}
                    style={{ width: "100%" }}
                  >
                    Delete Account
                  </button>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10, alignItems: "center" }}>
                    <p style={{ margin: 0, fontSize: 13, color: "var(--danger)", textAlign: "center" }}>
                      This will permanently delete your account and all associated data. This action cannot be undone.
                    </p>
                    <div style={{ display: "flex", gap: 10 }}>
                      <button className="ghost-btn" type="button" onClick={() => setConfirmDelete(false)} disabled={deleting}>
                        Cancel
                      </button>
                      <button className="danger-btn" type="button" onClick={handleDeleteAccount} disabled={deleting}>
                        {deleting ? "Deleting..." : "Confirm Delete"}
                      </button>
                    </div>
                  </div>
                )}
              </div>}
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
