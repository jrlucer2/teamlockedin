import { useEffect, useState } from "react";
import { getProfile, updateProfile, deleteAccount } from "../lib/api";

const EMPLOYMENT_OPTIONS = [
  { value: "", label: "Select status..." },
  { value: "student", label: "Student" },
  { value: "employed", label: "Employed" },
  { value: "unemployed", label: "Unemployed / Seeking" },
  { value: "freelance", label: "Freelance / Contract" },
  { value: "other", label: "Other" },
];

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

  const busy = saving || deleting;

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

              <div style={{ borderTop: "1px solid var(--border)", marginTop: 20, paddingTop: 20 }}>
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
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
