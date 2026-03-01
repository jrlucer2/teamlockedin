import { useMemo, useState } from "react";

// Reuse the same general “app card + glass” vibe from dashboard.css.
// If dashboard.css is already imported globally (App.jsx), you can remove the import below.
import "../styles/dashboard.css";
import "../styles/applications.css";

const SEED_APPLICATIONS = [
  {
    id: 1,
    jobTitle: "Software Engineer Intern",
    company: "Google",
    salary: 35,
    salaryType: "hourly",
    positionType: "internship",
    postingDate: "2026-02-10",
    location: "Mountain View, CA",
    status: "interview",
  },
  {
    id: 2,
    jobTitle: "Marketing Coordinator",
    company: "Amazon",
    salary: 62000,
    salaryType: "yearly",
    positionType: "full_time",
    postingDate: "2026-02-02",
    location: "Seattle, WA",
    status: "applied",
  },
  {
    id: 3,
    jobTitle: "Data Analyst",
    company: "Amazon",
    salary: 85000,
    salaryType: "yearly",
    positionType: "full_time",
    postingDate: "2026-01-25",
    location: "Remote",
    status: "offer",
  },
  {
    id: 4,
    jobTitle: "UX Designer",
    company: "Boeing",
    salary: 45,
    salaryType: "hourly",
    positionType: "contractor",
    postingDate: "2026-02-14",
    location: "Everett, WA",
    status: "applied",
  },
  {
    id: 5,
    jobTitle: "Project Manager",
    company: "Microsoft",
    salary: 98000,
    salaryType: "yearly",
    positionType: "full_time",
    postingDate: "2026-01-18",
    location: "Redmond, WA",
    status: "rejected",
  },
];

function normalize(value) {
  return String(value ?? "").toLowerCase().trim();
}

function formatPosition(positionType) {
  const map = {
    full_time: "Full-time",
    part_time: "Part-time",
    contractor: "Contractor",
    internship: "Internship",
  };
  return map[positionType] || positionType;
}

function formatStatus(status) {
  const map = {
    applied: "Applied",
    interview: "Interview",
    rejected: "Rejected",
    offer: "Offer",
  };
  return map[status] || status;
}

function formatMoney(amount, salaryType) {
  if (amount === "" || amount === null || amount === undefined) return "—";
  const num = Number(amount);
  if (Number.isNaN(num)) return "—";
  if (salaryType === "hourly") return `$${num}/hr`;
  return `$${num.toLocaleString()}/yr`;
}

function StatusPill({ status }) {
  const normalized = normalize(status).replace(/\s+/g, "-");
  const className = `status-pill status-${normalized}`;
  return <span className={className}>{formatStatus(status)}</span>;
}

/**
 * Modal (simple + accessible enough for prototype)
 */
function Modal({ title, children, onClose }) {
  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onMouseDown={(e) => {
        // close if clicking the dark backdrop, not the card
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-card">
        <div className="modal-head">
          <h3 className="modal-title">{title}</h3>
          <button className="icon-btn" type="button" aria-label="Close" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}

function ApplicationForm({ initial, onCancel, onSave }) {
  const [jobTitle, setJobTitle] = useState(initial.jobTitle ?? "");
  const [company, setCompany] = useState(initial.company ?? "");
  const [salary, setSalary] = useState(initial.salary ?? "");
  const [salaryType, setSalaryType] = useState(initial.salaryType ?? "yearly");
  const [positionType, setPositionType] = useState(initial.positionType ?? "full_time");
  const [postingDate, setPostingDate] = useState(initial.postingDate ?? "");
  const [location, setLocation] = useState(initial.location ?? "");
  const [status, setStatus] = useState(initial.status ?? "applied");
  const [error, setError] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!jobTitle.trim()) return setError("Job title is required.");
    if (!company.trim()) return setError("Company is required.");
    if (!location.trim()) return setError("Location is required.");
    if (!postingDate) return setError("Posting date is required.");

    const salaryValue = salary === "" ? "" : Number(salary);
    if (salary !== "" && Number.isNaN(salaryValue)) return setError("Salary must be a number.");

    onSave({
      ...initial,
      jobTitle: jobTitle.trim(),
      company: company.trim(),
      salary: salaryValue,
      salaryType,
      positionType,
      postingDate,
      location: location.trim(),
      status,
    });
  }

  return (
    <form className="app-form" onSubmit={handleSubmit}>
      {error ? <div className="form-error">{error}</div> : null}

      <div className="form-grid">
        <label className="form-field">
          <span className="form-label">Job Title</span>
          <input value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} placeholder="e.g., Data Analyst" />
        </label>

        <label className="form-field">
          <span className="form-label">Company</span>
          <input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="e.g., Amazon" />
        </label>

        <label className="form-field">
          <span className="form-label">Location</span>
          <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g., Tempe, AZ / Remote" />
        </label>

        <label className="form-field">
          <span className="form-label">Posting Date</span>
          <input type="date" value={postingDate} onChange={(e) => setPostingDate(e.target.value)} />
        </label>

        <label className="form-field">
          <span className="form-label">Position Type</span>
          <select value={positionType} onChange={(e) => setPositionType(e.target.value)}>
            <option value="full_time">Full-time</option>
            <option value="part_time">Part-time</option>
            <option value="contractor">Contractor</option>
            <option value="internship">Internship</option>
          </select>
        </label>

        <label className="form-field">
          <span className="form-label">Status</span>
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="applied">Applied</option>
            <option value="interview">Interview</option>
            <option value="rejected">Rejected</option>
            <option value="offer">Offer</option>
          </select>
        </label>

        <label className="form-field form-field--salary">
          <span className="form-label">Salary</span>
          <div className="salary-row">
            <input
              value={salary}
              onChange={(e) => setSalary(e.target.value)}
              placeholder="e.g., 85000"
              inputMode="numeric"
            />
            <select value={salaryType} onChange={(e) => setSalaryType(e.target.value)} aria-label="Salary type">
              <option value="yearly">/yr</option>
              <option value="hourly">/hr</option>
            </select>
          </div>
        </label>
      </div>

      <div className="modal-actions">
        <button className="ghost-btn" type="button" onClick={onCancel}>
          Cancel
        </button>
        <button className="primary-btn" type="submit">
          Save
        </button>
      </div>
    </form>
  );
}

export default function Applications({ onLogout, onNavigate }) {
  const [applications, setApplications] = useState(SEED_APPLICATIONS);

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [positionFilter, setPositionFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState(null); // app object or null

  const metrics = useMemo(() => {
    const total = applications.length;
    const applied = applications.filter((a) => a.status === "applied").length;
    const interview = applications.filter((a) => a.status === "interview").length;
    const offer = applications.filter((a) => a.status === "offer").length;
    return { total, applied, interview, offer };
  }, [applications]);

  const filtered = useMemo(() => {
    const q = normalize(query);

    let list = applications.filter((a) => {
      const matchesQuery =
        !q ||
        normalize(a.jobTitle).includes(q) ||
        normalize(a.company).includes(q) ||
        normalize(a.location).includes(q);

      const matchesStatus = statusFilter === "all" ? true : a.status === statusFilter;
      const matchesPosition = positionFilter === "all" ? true : a.positionType === positionFilter;

      return matchesQuery && matchesStatus && matchesPosition;
    });

    if (sortBy === "oldest") list = [...list].reverse();
    if (sortBy === "company") list = [...list].sort((x, y) => x.company.localeCompare(y.company));
    if (sortBy === "status") list = [...list].sort((x, y) => x.status.localeCompare(y.status));

    // “Newest” should be based on postingDate for now.
    if (sortBy === "newest") {
      list = [...list].sort((x, y) => String(y.postingDate).localeCompare(String(x.postingDate)));
    }

    return list;
  }, [applications, query, statusFilter, positionFilter, sortBy]);

  function openCreate() {
    setEditing({
      id: null,
      jobTitle: "",
      company: "",
      salary: "",
      salaryType: "yearly",
      positionType: "full_time",
      postingDate: "",
      location: "",
      status: "applied",
    });
    setIsModalOpen(true);
  }

  function openEdit(app) {
    setEditing(app);
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setEditing(null);
  }

  function saveApplication(payload) {
    if (payload.id == null) {
      const nextId = Math.max(0, ...applications.map((a) => a.id)) + 1;
      const created = { ...payload, id: nextId };
      setApplications((prev) => [created, ...prev]);
    } else {
      setApplications((prev) => prev.map((a) => (a.id === payload.id ? payload : a)));
    }
    closeModal();
  }

  function deleteApplication(id) {
    const ok = window.confirm("Delete this application? This cannot be undone.");
    if (!ok) return;
    setApplications((prev) => prev.filter((a) => a.id !== id));
  }

  return (
    <>
      <header className="top-nav">
        <div className="top-nav-inner">
          <div className="brand">
            <span className="brand-dot" aria-hidden="true" />
            <span className="brand-name">LockedIn Tracker</span>
          </div>

          <nav className="nav-links" aria-label="Primary">
            <button className="nav-link" type="button" onClick={() => onNavigate?.("dashboard")}>
              Dashboard
            </button>
            <button className="nav-link is-active" type="button" onClick={() => onNavigate?.("applications")}>
              Applications
            </button>
            <button className="nav-link" type="button" disabled>
              Reminders
            </button>
            <button className="nav-link" type="button" disabled>
              Contacts
            </button>
            <button className="nav-link" type="button" disabled>
              Documents
            </button>
          </nav>

          <div className="nav-actions" aria-label="Utilities">
            <button className="danger-btn danger-btn--logout" type="button" onClick={onLogout}>
              Log Out
            </button>
          </div>
        </div>
      </header>

      <main className="dashboard" aria-label="Applications">
        <section className="metrics" aria-label="Application metrics">
          <div className="metric-card">
            <div className="metric-label">Total Applications</div>
            <div className="metric-value">{metrics.total}</div>
          </div>

          <div className="metric-card">
            <div className="metric-label">Applied</div>
            <div className="metric-value">{metrics.applied}</div>
          </div>

          <div className="metric-card">
            <div className="metric-label">Interview</div>
            <div className="metric-value">{metrics.interview}</div>
          </div>

          <div className="metric-card">
            <div className="metric-label">Offers</div>
            <div className="metric-value">{metrics.offer}</div>
          </div>
        </section>

        <section className="controls" aria-label="Applications controls">
          <div className="controls-row">
            <div className="control control--search">
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search title, company, location..."
                aria-label="Search applications"
              />
            </div>

            <div className="control">
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label="Status filter">
                <option value="all">Status: All</option>
                <option value="applied">Applied</option>
                <option value="interview">Interview</option>
                <option value="rejected">Rejected</option>
                <option value="offer">Offer</option>
              </select>
            </div>

            <div className="control">
              <select
                value={positionFilter}
                onChange={(e) => setPositionFilter(e.target.value)}
                aria-label="Position filter"
              >
                <option value="all">Position: All</option>
                <option value="full_time">Full-time</option>
                <option value="part_time">Part-time</option>
                <option value="contractor">Contractor</option>
                <option value="internship">Internship</option>
              </select>
            </div>

            <button className="primary-btn" type="button" onClick={openCreate}>
              + New Application
            </button>
          </div>

          <div className="controls-row controls-row--secondary">
            <div className="control">
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} aria-label="Sort">
                <option value="newest">Sort: Newest</option>
                <option value="oldest">Oldest</option>
                <option value="company">Company</option>
                <option value="status">Status</option>
              </select>
            </div>

            <div className="section-meta">
              <span className="meta-pill">Showing: {filtered.length}</span>
            </div>
          </div>
        </section>

        <section className="applications-panel" aria-label="Applications list">
          <div className="applications-table-wrap">
            <table className="applications-table">
              <thead>
                <tr>
                  <th>Role</th>
                  <th>Company</th>
                  <th>Location</th>
                  <th>Posting</th>
                  <th>Position</th>
                  <th>Salary</th>
                  <th>Status</th>
                  <th className="th-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length ? (
                  filtered.map((a) => (
                    <tr key={a.id}>
                      <td className="td-strong">{a.jobTitle}</td>
                      <td>{a.company}</td>
                      <td>{a.location}</td>
                      <td>{a.postingDate || "—"}</td>
                      <td>{formatPosition(a.positionType)}</td>
                      <td>{formatMoney(a.salary, a.salaryType)}</td>
                      <td>
                        <StatusPill status={a.status} />
                      </td>
                      <td className="td-actions">
                        <button className="ghost-btn" type="button" onClick={() => openEdit(a)}>
                          Edit
                        </button>
                        <button className="danger-btn" type="button" onClick={() => deleteApplication(a.id)}>
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="td-empty">
                      No applications match your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {isModalOpen && editing ? (
        <Modal title={editing.id ? "Edit Application" : "New Application"} onClose={closeModal}>
          <ApplicationForm initial={editing} onCancel={closeModal} onSave={saveApplication} />
        </Modal>
      ) : null}
    </>
  );
}