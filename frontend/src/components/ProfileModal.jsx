import { useEffect, useState } from "react";
import { getProfile, deleteAccount } from "../lib/api";

function DetailRow({ label, value }) {
  return (
    <div className="dashboard-detail-row">
      <span className="dashboard-detail-label">{label}</span>
      <span className="dashboard-detail-value">{value || "Not provided"}</span>
    </div>
  );
}

const EMPLOYMENT_LABELS = {
  student: "Student",
  employed: "Employed",
  unemployed: "Unemployed / Seeking",
  freelance: "Freelance / Contract",
  other: "Other",
};

export default function ProfileModal({ onClose, onLogout }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    getProfile()
      .then((data) => setProfile(data))
      .catch((err) => setError(err.message || "Failed to load profile."))
      .finally(() => setLoading(false));
  }, []);

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

  return (
    <div
      className="dashboard-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label="Profile"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !deleting) onClose();
      }}
    >
      <div className="dashboard-modal-card" style={{ maxWidth: 480 }}>
        <div className="dashboard-modal-head">
          <div>
            <h3 className="dashboard-modal-title">My Profile</h3>
            <p className="dashboard-modal-subtitle">Your account details</p>
          </div>
          <button className="icon-btn" type="button" aria-label="Close" onClick={onClose} disabled={deleting}>
            ✕
          </button>
        </div>

        <div className="dashboard-modal-body">
          {error ? <div className="form-error">{error}</div> : null}

          {loading ? (
            <p style={{ textAlign: "center", padding: "24px 0", opacity: 0.6 }}>Loading profile...</p>
          ) : profile ? (
            <>
              <div className="dashboard-detail-grid">
                <DetailRow label="First Name" value={profile.firstName} />
                <DetailRow label="Last Name" value={profile.lastName} />
                <DetailRow label="Email" value={profile.email} />
                <DetailRow label="Organization" value={profile.organization} />
                <DetailRow label="Employment Status" value={EMPLOYMENT_LABELS[profile.employmentStatus] || profile.employmentStatus} />
                <DetailRow label="Target Role" value={profile.targetRole} />
              </div>

              <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", marginTop: 24, paddingTop: 20 }}>
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
                    <p style={{ margin: 0, fontSize: 13, color: "#e53e3e", textAlign: "center" }}>
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
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
