import { useEffect, useMemo, useRef, useState } from "react";
import {
  authenticatedFetch,
  getReminders,
  createReminder,
  updateReminder,
  deleteReminder,
} from "../lib/api";

const SEED_APPLICATIONS = [
  {
    id: 1,
    title: "Software Engineer Intern",
    company: "Google",
    location: "Mountain View, CA",
    status: "Interviewing",
    next: "Interview • Feb 28, 2:00 PM",
    docs: 2,
    contacts: 1,
  },
  {
    id: 2,
    title: "Marketing Coordinator",
    company: "Amazon",
    location: "Seattle, WA",
    status: "Applied",
    next: "Follow-up • Feb 26",
    docs: 1,
    contacts: 1,
  },
  {
    id: 3,
    title: "Data Analyst",
    company: "Amazon",
    location: "Remote",
    status: "Offer",
    next: "Review offer",
    docs: 2,
    contacts: 2,
  },
  {
    id: 4,
    title: "UX Designer",
    company: "Boeing",
    location: "Everett, WA",
    status: "Saved",
    next: "Apply",
    docs: 1,
    contacts: 0,
  },
  {
    id: 5,
    title: "Project Manager",
    company: "Microsoft",
    location: "Redmond, WA",
    status: "Rejected",
    next: "Archive",
    docs: 1,
    contacts: 0,
  },
  {
    id: 6,
    title: "Business Analyst",
    company: "Chase",
    location: "Tempe, AZ",
    status: "Applied",
    next: "Follow-up",
    docs: 2,
    contacts: 1,
  },
];

function normalize(value) {
  return String(value ?? "").toLowerCase().trim();
}

function formatReminderDate(dateValue) {
  if (!dateValue) return "";
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function formatReminderTime(timeValue) {
  if (!timeValue) return "";
  const value = String(timeValue).slice(0, 5);
  const [hours, minutes] = value.split(":");
  if (!hours || !minutes) return value;

  const hourNum = Number(hours);
  const suffix = hourNum >= 12 ? "PM" : "AM";
  const normalizedHour = hourNum % 12 || 12;
  return `${normalizedHour}:${minutes} ${suffix}`;
}

function StatusPill({ status }) {
  const normalized = normalize(status).replace(/\s+/g, "-");
  const className = `status-pill status-${normalized}`;
  return <span className={className}>{status}</span>;
}

function ApplicationCard({ app, onOpenDetails, onDelete }) {
  return (
    <article
      className="app-card"
      tabIndex={0}
      role="button"
      aria-label={`Open ${app.title} at ${app.company}`}
      onClick={() => onOpenDetails(app)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onOpenDetails(app);
      }}
    >
      <div className="app-card-header">
        <h3 className="app-title">{app.title}</h3>
        <StatusPill status={app.status} />
      </div>

      <div className="app-meta">
        {app.company} • {app.location}
      </div>

      <div className="app-line">Next: {app.next}</div>
      <div className="app-line">
        Docs: {app.docs} • Contacts: {app.contacts}
      </div>

      <div className="app-actions" onClick={(e) => e.stopPropagation()}>
        <button className="ghost-btn" type="button" onClick={() => onOpenDetails(app)}>
          View
        </button>
        <button className="ghost-btn" type="button" disabled>
          Edit
        </button>
        <button className="danger-btn" type="button" onClick={() => onDelete(app.id)}>
          Delete
        </button>
      </div>
    </article>
  );
}

export default function Dashboard({ onLogout }) {
  const [applications, setApplications] = useState(SEED_APPLICATIONS);
  const [reminders, setReminders] = useState([]);

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [viewMode, setViewMode] = useState("cards");
  const [userListCount, setUserListCount] = useState(null);

  const [isReminderDropdownOpen, setIsReminderDropdownOpen] = useState(false);
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
  const [reminderError, setReminderError] = useState("");
  const [reminderLoading, setReminderLoading] = useState(false);
  const [editingReminderId, setEditingReminderId] = useState(null);

  const [reminderForm, setReminderForm] = useState({
    title: "",
    category: "",
    priority: "",
    status: "Pending",
    dueDate: "",
    dueTime: "",
    company: "",
    role: "",
    notes: "",
  });

  const reminderDropdownRef = useRef(null);
  const bellButtonRef = useRef(null);

  useEffect(() => {
    async function loadProtectedData() {
      try {
        const res = await authenticatedFetch("/api/users");
        const data = await res.json();
        setUserListCount(Array.isArray(data.emails) ? data.emails.length : 0);
      } catch (error) {
        console.error("Protected fetch failed:", error);
      }
    }

    loadProtectedData();
  }, []);

  useEffect(() => {
    async function loadReminders() {
      try {
        const data = await getReminders();
        setReminders(Array.isArray(data.reminders) ? data.reminders : []);
      } catch (error) {
        console.error("Failed to load reminders:", error);
      }
    }

    loadReminders();
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (!isReminderDropdownOpen) return;

      const clickedInsideDropdown = reminderDropdownRef.current?.contains(event.target);
      const clickedBell = bellButtonRef.current?.contains(event.target);

      if (!clickedInsideDropdown && !clickedBell) {
        setIsReminderDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isReminderDropdownOpen]);

  const metrics = useMemo(() => {
    return {
      totalApplications: applications.length,
      activeContacts: applications.reduce((sum, a) => sum + (a.contacts || 0), 0),
      setReminders: reminders.length,
    };
  }, [applications, reminders]);

  const filteredApplications = useMemo(() => {
    const q = normalize(query);

    let list = applications.filter((a) => {
      const matchesQuery =
        !q ||
        normalize(a.title).includes(q) ||
        normalize(a.company).includes(q) ||
        normalize(a.location).includes(q);

      const matchesStatus = statusFilter === "all" ? true : normalize(a.status) === statusFilter;

      return matchesQuery && matchesStatus;
    });

    if (sortBy === "oldest") list = [...list].reverse();
    if (sortBy === "company") list = [...list].sort((x, y) => x.company.localeCompare(y.company));
    if (sortBy === "status") list = [...list].sort((x, y) => x.status.localeCompare(y.status));

    return list;
  }, [applications, query, statusFilter, sortBy]);

  function resetReminderForm() {
    setReminderForm({
      title: "",
      category: "",
      priority: "",
      status: "Pending",
      dueDate: "",
      dueTime: "",
      company: "",
      role: "",
      notes: "",
    });
    setEditingReminderId(null);
    setReminderError("");
  }

  function openCreateReminderModal() {
    resetReminderForm();
    setIsReminderModalOpen(true);
  }

  function closeReminderModal() {
    resetReminderForm();
    setIsReminderModalOpen(false);
  }

  function handleReminderInputChange(e) {
    const { name, value } = e.target;
    setReminderForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function handleReminderSubmit(e) {
    e.preventDefault();
    setReminderLoading(true);
    setReminderError("");

    try {
      if (editingReminderId) {
        const data = await updateReminder(editingReminderId, reminderForm);
        setReminders((prev) =>
          prev.map((r) => (r.Reminder_ID === editingReminderId ? data.reminder : r))
        );
      } else {
        const data = await createReminder(reminderForm);
        setReminders((prev) => [data.reminder, ...prev]);
      }

      closeReminderModal();
    } catch (error) {
      setReminderError(error.message);
    } finally {
      setReminderLoading(false);
    }
  }

  function handleEditReminder(reminder) {
    setEditingReminderId(reminder.Reminder_ID);
    setReminderForm({
      title: reminder.Reminder_Title || "",
      category: reminder.Reminder_Category || "",
      priority: reminder.Reminder_Priority || "",
      status: reminder.Reminder_Status || "Pending",
      dueDate: reminder.Reminder_Due_Date ? String(reminder.Reminder_Due_Date).slice(0, 10) : "",
      dueTime: reminder.Reminder_Due_Time ? String(reminder.Reminder_Due_Time).slice(0, 5) : "",
      company: reminder.Reminder_Company || "",
      role: reminder.Reminder_Role || "",
      notes: reminder.Reminder_Notes || "",
    });
    setReminderError("");
    setIsReminderDropdownOpen(false);
    setIsReminderModalOpen(true);
  }

  async function handleDeleteReminder(reminderId) {
    try {
      await deleteReminder(reminderId);
      setReminders((prev) => prev.filter((r) => r.Reminder_ID !== reminderId));
    } catch (error) {
      window.alert(error.message);
    }
  }

  function handleAddApplication() {
    const nextId = Math.max(0, ...applications.map((a) => a.id)) + 1;
    const newApp = {
      id: nextId,
      title: "New Application",
      company: "Company",
      location: "Location",
      status: "Saved",
      next: "Set next step",
      docs: 0,
      contacts: 0,
    };
    setApplications((prev) => [newApp, ...prev]);
  }

  function handleOpenDetails(app) {
    window.alert(`Detailed Job View (prototype)\n\n${app.title}\n${app.company} • ${app.location}`);
  }

  function handleDelete(appId) {
    setApplications((prev) => prev.filter((a) => a.id !== appId));
  }

  function handleRefresh() {
    setApplications(SEED_APPLICATIONS);
    setQuery("");
    setStatusFilter("all");
    setSortBy("newest");
    setViewMode("cards");
  }

  const iconBtnInline = { lineHeight: 0 };
  const iconSvgInline = { display: "block" };

  return (
    <>
      <header className="top-nav">
        <div className="top-nav-inner">
          <div className="brand">
            <span className="brand-dot" aria-hidden="true" />
            <span className="brand-name">LockedIn Tracker</span>
          </div>

          <nav className="nav-links" aria-label="Primary">
            <a className="nav-link is-active" href="#">
              Dashboard
            </a>
            <a className="nav-link" href="#">
              Applications
            </a>
            <span className="nav-link">Reminders</span>
            <a className="nav-link" href="#">
              Contacts
            </a>
            <a className="nav-link" href="#">
              Documents
            </a>
          </nav>

          <div className="nav-actions" aria-label="Utilities">
            <button
              ref={bellButtonRef}
              className={`icon-btn ${isReminderDropdownOpen ? "is-open" : ""}`}
              style={iconBtnInline}
              type="button"
              aria-label="Notifications"
              onClick={() => setIsReminderDropdownOpen((prev) => !prev)}
            >
              <svg
                style={iconSvgInline}
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
                focusable="false"
              >
                <path d="M18 8a6 6 0 10-12 0c0 7-3 7-3 7h18s-3 0-3-7" />
                <path d="M13.73 21a2 2 0 01-3.46 0" />
              </svg>
            </button>

            {isReminderDropdownOpen && (
              <div
                ref={reminderDropdownRef}
                className="reminder-dropdown"
                role="dialog"
                aria-label="Reminders dropdown"
              >
                <div className="reminder-dropdown-header">
                  <div>
                    <h3 className="reminder-dropdown-title">Reminders</h3>
                    <p className="reminder-dropdown-subtitle">Upcoming reminders</p>
                  </div>

                  <button
                    className="icon-btn reminder-plus-btn"
                    type="button"
                    aria-label="Add reminder"
                    onClick={openCreateReminderModal}
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                      focusable="false"
                    >
                      <path d="M12 5v14" />
                      <path d="M5 12h14" />
                    </svg>
                  </button>
                </div>

                <div className="reminder-dropdown-list">
                  {!reminders.length ? (
                    <div className="reminder-empty-state">No reminders yet.</div>
                  ) : (
                    reminders.map((reminder) => (
                      <div className="reminder-dropdown-item" key={reminder.Reminder_ID}>
                        <div className="reminder-dropdown-item-main">
                          <div className="reminder-dropdown-item-title">{reminder.Reminder_Title}</div>
                          <div className="reminder-dropdown-item-meta">
                            {formatReminderDate(reminder.Reminder_Due_Date)} •{" "}
                            {formatReminderTime(reminder.Reminder_Due_Time)}
                            {reminder.Reminder_Company ? ` • ${reminder.Reminder_Company}` : ""}
                          </div>
                          {reminder.Reminder_Notes ? (
                            <div className="reminder-dropdown-item-notes">{reminder.Reminder_Notes}</div>
                          ) : null}
                        </div>

                        <div className="reminder-dropdown-item-actions">
                          <button
                            className="ghost-btn"
                            type="button"
                            onClick={() => handleEditReminder(reminder)}
                          >
                            Edit
                          </button>
                          <button
                            className="danger-btn"
                            type="button"
                            onClick={() => handleDeleteReminder(reminder.Reminder_ID)}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            <button className="icon-btn" style={iconBtnInline} type="button" aria-label="Settings">
              <svg
                style={iconSvgInline}
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
                focusable="false"
              >
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06A1.65 1.65 0 0015 19.4a1.65 1.65 0 00-1 .6 1.65 1.65 0 00-.33 1.82V22a2 2 0 11-4 0v-.18a1.65 1.65 0 00-.33-1.82 1.65 1.65 0 00-1-.6 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06A1.65 1.65 0 004.6 15a1.65 1.65 0 00-.6-1 1.65 1.65 0 00-1.82-.33H2a2 2 0 110-4h.18a1.65 1.65 0 001.82-.33 1.65 1.65 0 00.6-1 1.65 1.65 0 00-.33-1.82l-.06-.06A2 2 0 116.04 3.6l.06.06A1.65 1.65 0 008 4.6c.39 0 .77-.14 1.06-.4.29-.26.5-.62.57-1.01V3a2 2 0 114 0v.18c.07.39.28.75.57 1.01.29.26.67.4 1.06.4.39 0 .77-.14 1.06-.4l.06-.06A2 2 0 1120.4 6.04l-.06.06c-.26.29-.4.67-.4 1.06 0 .39.14.77.4 1.06.26.29.62.5 1.01.57H22a2 2 0 110 4h-.18c-.39.07-.75.28-1.01.57-.26.29-.4.67-.4 1.06z" />
              </svg>
            </button>

            <button className="icon-btn" style={iconBtnInline} type="button" aria-label="Profile">
              <svg
                style={iconSvgInline}
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
                focusable="false"
              >
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </button>

            <button className="danger-btn danger-btn--logout" type="button" onClick={onLogout}>
              Log Out
            </button>
          </div>
        </div>
      </header>

      <main className="dashboard" aria-label="Dashboard">
        <section className="metrics" aria-label="Key metrics">
          <div className="metric-card">
            <div className="metric-label">Total Applications</div>
            <div className="metric-value">{metrics.totalApplications}</div>
          </div>

          <div className="metric-card">
            <div className="metric-label">Active Contacts</div>
            <div className="metric-value">{metrics.activeContacts}</div>
          </div>

          <div className="metric-card metric-card--hide-on-dashboard">
            <div className="metric-label">Set Reminders</div>
            <div className="metric-value">{metrics.setReminders}</div>
          </div>

          <div className="metric-card">
            <div className="metric-label">Registered Users</div>
            <div className="metric-value">{userListCount ?? "..."}</div>
          </div>
        </section>

        <section className="controls" aria-label="Dashboard controls">
          <div className="controls-row">
            <div className="control control--search">
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search company, title, location..."
                aria-label="Search"
              />
            </div>

            <div className="control">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                aria-label="Status filter"
              >
                <option value="all">Status: All</option>
                <option value="saved">Saved</option>
                <option value="applied">Applied</option>
                <option value="interviewing">Interviewing</option>
                <option value="offer">Offer</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            <button className="primary-btn" type="button" onClick={handleAddApplication}>
              + Add Application
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

            <div className="control">
              <select value={viewMode} onChange={(e) => setViewMode(e.target.value)} aria-label="View">
                <option value="cards">View: Cards</option>
                <option value="table" disabled>
                  Table (later)
                </option>
              </select>
            </div>

            <div className="quick-actions" aria-label="Quick actions">
              <button className="ghost-btn" type="button" disabled>
                Bulk Edit
              </button>
              <button className="ghost-btn" type="button" disabled>
                Export
              </button>
            </div>

            <div className="session-actions" aria-label="Session actions">
              <button className="ghost-btn" type="button" onClick={handleRefresh}>
                Refresh
              </button>
            </div>
          </div>
        </section>

        <section className="content" aria-label="Dashboard content">
          <section aria-label="Job applications">
            <div className="section-head">
              <div>
                <h2 className="section-title">Job Applications</h2>
                <p className="section-subtitle">Click a card to open the detailed job view.</p>
              </div>
              <div className="section-meta">
                <span className="meta-pill">Showing: {filteredApplications.length}</span>
              </div>
            </div>

            {viewMode !== "cards" ? (
              <div className="empty-state">
                <div className="empty-title">Table view is coming later.</div>
                <div className="empty-subtitle">For now, switch back to Cards.</div>
              </div>
            ) : filteredApplications.length ? (
              <div className="cards">
                {filteredApplications.map((app) => (
                  <ApplicationCard
                    key={app.id}
                    app={app}
                    onOpenDetails={handleOpenDetails}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-title">No applications match your filters.</div>
                <div className="empty-subtitle">Try clearing search or switching Status back to All.</div>
              </div>
            )}
          </section>
        </section>
      </main>

      {isReminderModalOpen && (
        <div className="reminder-modal-backdrop" onClick={closeReminderModal}>
          <div
            className="reminder-modal"
            role="dialog"
            aria-modal="true"
            aria-label={editingReminderId ? "Edit reminder" : "Create reminder"}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="reminder-modal-header">
              <div>
                <h2 className="reminder-modal-title">
                  {editingReminderId ? "Edit Reminder" : "Create Reminder"}
                </h2>
                <p className="reminder-modal-subtitle">
                  {editingReminderId
                    ? "Update your reminder details"
                    : "Add a new reminder for your job search"}
                </p>
              </div>

              <button className="icon-btn" type="button" aria-label="Close reminder modal" onClick={closeReminderModal}>
                ✕
              </button>
            </div>

            <form className="reminder-modal-form" onSubmit={handleReminderSubmit}>
              <div className="reminder-modal-grid">
                <label className="reminder-field">
                  <span>Title</span>
                  <input
                    name="title"
                    value={reminderForm.title}
                    onChange={handleReminderInputChange}
                    type="text"
                    placeholder="Interview follow-up"
                    required
                  />
                </label>

                <label className="reminder-field">
                  <span>Company</span>
                  <input
                    name="company"
                    value={reminderForm.company}
                    onChange={handleReminderInputChange}
                    type="text"
                    placeholder="Google"
                  />
                </label>

                <label className="reminder-field">
                  <span>Role</span>
                  <input
                    name="role"
                    value={reminderForm.role}
                    onChange={handleReminderInputChange}
                    type="text"
                    placeholder="Software Engineer Intern"
                  />
                </label>

                <label className="reminder-field">
                  <span>Category</span>
                  <select name="category" value={reminderForm.category} onChange={handleReminderInputChange}>
                    <option value="">Select category</option>
                    <option value="Interview">Interview</option>
                    <option value="Follow-up">Follow-up</option>
                    <option value="Reference">Reference</option>
                    <option value="Deadline">Deadline</option>
                    <option value="Networking">Networking</option>
                  </select>
                </label>

                <label className="reminder-field">
                  <span>Priority</span>
                  <select name="priority" value={reminderForm.priority} onChange={handleReminderInputChange}>
                    <option value="">Select priority</option>
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </label>

                <label className="reminder-field">
                  <span>Status</span>
                  <select name="status" value={reminderForm.status} onChange={handleReminderInputChange}>
                    <option value="Pending">Pending</option>
                    <option value="Done">Done</option>
                  </select>
                </label>

                <label className="reminder-field">
                  <span>Due date</span>
                  <input
                    name="dueDate"
                    value={reminderForm.dueDate}
                    onChange={handleReminderInputChange}
                    type="date"
                    required
                  />
                </label>

                <label className="reminder-field">
                  <span>Due time</span>
                  <input
                    name="dueTime"
                    value={reminderForm.dueTime}
                    onChange={handleReminderInputChange}
                    type="time"
                    required
                  />
                </label>
              </div>

              <label className="reminder-field">
                <span>Notes</span>
                <textarea
                  name="notes"
                  value={reminderForm.notes}
                  onChange={handleReminderInputChange}
                  rows="4"
                  placeholder="Add details for this reminder..."
                />
              </label>

              {reminderError ? <div className="auth-error">{reminderError}</div> : null}

              <div className="reminder-modal-actions">
                <button className="ghost-btn" type="button" onClick={closeReminderModal}>
                  Cancel
                </button>
                <button className="primary-btn" type="submit" disabled={reminderLoading}>
                  {reminderLoading ? "Saving..." : editingReminderId ? "Update Reminder" : "Create Reminder"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}