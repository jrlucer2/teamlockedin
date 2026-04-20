import { useEffect, useState } from "react";
import Login from "./pages/login";
import Dashboard from "./pages/dashboard";
import lockedInLogo from "./assets/lockedindark.png";
import "./styles/splash.css";
import Applications from "./pages/applications";
import Reminders from "./pages/reminders";
import Contacts from "./pages/contacts";
import Documents from "./pages/documents";
import { getStoredToken, getStoredUserEmail, parseApiResponse, getNotifications, markAllNotificationsRead, clearNotifications } from "./lib/api";
import {
  createApplication,
  deleteApplication,
  fetchApplications,
  updateApplication,
} from "./lib/applicationsApi";

function SplashScreen() {
  return (
    <div className="splash-screen" aria-hidden="true">
      <div className="splash-content">
        <div className="splash-lock-wrap">
          {/*
            SVG geometry (viewBox 0 0 100 130, overflow visible):

            Shackle closed path: M 28 58 L 28 43 A 22 22 0 0 0 72 43 L 72 58
              - Arc: radius=22, center=(50,43), top=(50,21)
              - sweep=0 (CCW) curves the arc UPWARD ✓
              - Legs end at y=58, body starts at y=55 → 3px hidden inside body ✓

            Open state (translateY -24px):
              - Leg bottoms: 58-24 = 34, above body top (55) → fully withdrawn ✓
              - Arc top: 21-24 = -3 → overflow:visible handles the slight clip ✓

            Render order: shackle → body (masks leg tips) → holes → keyhole
          */}
          <svg
            viewBox="0 0 100 130"
            width="160"
            height="208"
            fill="none"
            style={{ overflow: "visible" }}
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="splashBodyGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor="rgba(22, 34, 58, 0.98)" />
                <stop offset="100%" stopColor="rgba(8,  13, 26, 0.98)" />
              </linearGradient>
            </defs>

            {/* 1. Shackle — animates translateY from -24 (open) to 0 (locked) */}
            <g className="splash-shackle">
              <path
                d="M 28 58 L 28 43 A 22 22 0 0 1 72 43 L 72 58"
                stroke="rgba(56,189,248,0.92)"
                strokeWidth="9"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </g>

            {/* 2. Lock body — covers the bottom of shackle legs when closed */}
            <rect
              x="5" y="55" width="90" height="72" rx="12"
              fill="url(#splashBodyGrad)"
              stroke="rgba(56,189,248,0.30)"
              strokeWidth="1.5"
            />

            {/* 3. Top highlight on body */}
            <rect
              x="5" y="55" width="90" height="2.5" rx="1.25"
              fill="rgba(255,255,255,0.06)"
            />

            {/* 4. Shackle entry holes — dark ovals where legs slot in */}
            <ellipse cx="28" cy="55" rx="5.5" ry="3.5" fill="rgba(0,0,0,0.55)" />
            <ellipse cx="72" cy="55" rx="5.5" ry="3.5" fill="rgba(0,0,0,0.55)" />

            {/* 5. Keyhole — circle on top, filled slot below (no stroke on slot to avoid gap) */}
            <circle
              cx="50" cy="82" r="7"
              fill="rgba(0,0,0,0.45)"
              stroke="rgba(56,189,248,0.42)"
              strokeWidth="1.5"
            />
            <rect
              x="47" y="82" width="6" height="12" rx="3"
              fill="rgba(0,0,0,0.45)"
            />
          </svg>
        </div>

        <img className="splash-logo" src={lockedInLogo} alt="LockedIn" />
      </div>
    </div>
  );
}

function ThemeToggle({ theme, onToggle }) {
  const isDark = theme === "dark";
  return (
    <button
      className="theme-toggle"
      type="button"
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      onClick={onToggle}
      title={isDark ? "Light mode" : "Dark mode"}
    >
      {isDark ? (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="5" />
          <line x1="12" y1="1" x2="12" y2="3" />
          <line x1="12" y1="21" x2="12" y2="23" />
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
          <line x1="1" y1="12" x2="3" y2="12" />
          <line x1="21" y1="12" x2="23" y2="12" />
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
        </svg>
      ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      )}
    </button>
  );
}

export default function App() {
  const [authStatus, setAuthStatus] = useState("loading");
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "dark");
  const [showSplash, setShowSplash] = useState(false);

  // Show splash on first page load (unauthenticated landing) — once per browser session
  useEffect(() => {
    if (authStatus === "unauthenticated" && !sessionStorage.getItem("splashShown")) {
      sessionStorage.setItem("splashShown", "1");
      setShowSplash(true);
      const t = setTimeout(() => setShowSplash(false), 4000);
      return () => clearTimeout(t);
    }
  }, [authStatus]);

  // Called after successful login to trigger the splash transition
  function triggerLoginSplash() {
    setShowSplash(true);
    setTimeout(() => setShowSplash(false), 4000);
  }

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  function handleToggleTheme() {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  }
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [pageState, setPageState] = useState({ applicationsEditingId: null });
  const [userEmail, setUserEmail] = useState(getStoredUserEmail());
  const [applications, setApplications] = useState([]);
  const [applicationsStatus, setApplicationsStatus] = useState("idle");
  const [applicationsError, setApplicationsError] = useState("");
  const [hasLoadedApplications, setHasLoadedApplications] = useState(false);
  const [notifications, setNotifications] = useState([]);

  function clearAuth() {
    localStorage.removeItem("token");
    localStorage.removeItem("userEmail");
  }

  useEffect(() => {
    async function checkAuth() {
      const token = localStorage.getItem("token");

      if (!token) {
        setAuthStatus("unauthenticated");
        setUserEmail("");
        return;
      }

      try {
        const response = await fetch("/api/auth/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await parseApiResponse(response);

        if (response.ok && data.email) {
          setUserEmail(data.email);
          localStorage.setItem("userEmail", data.email);
          setAuthStatus("authenticated");
          return;
        }

        clearAuth();
        setAuthStatus("unauthenticated");
      } catch {
        clearAuth();
        setAuthStatus("unauthenticated");
      }

      setAuthStatus("unauthenticated");
      setUserEmail("");
    }

    checkAuth();
  }, []);

  useEffect(() => {
    if (authStatus !== "authenticated") {
      return;
    }

    let cancelled = false;

    async function loadApplications() {
      setApplicationsStatus("loading");
      setApplicationsError("");
      setHasLoadedApplications(false);

      try {
        const nextApplications = await fetchApplications();
        if (!cancelled) {
          setApplications(nextApplications);
          setApplicationsStatus("ready");
          setHasLoadedApplications(true);
        }
      } catch (error) {
        if (!cancelled) {
          setApplications([]);
          setApplicationsStatus("error");
          setApplicationsError(error?.message || "Unable to load applications.");
          setHasLoadedApplications(true);
        }
      }
    }

    loadApplications();

    return () => {
      cancelled = true;
    };
  }, [authStatus]);

  useEffect(() => {
    if (authStatus !== "authenticated") return;

    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }

    let isFirstPoll = true;
    let prevUnread = 0;

    async function poll() {
      try {
        const data = await getNotifications();
        const notifs = data.notifications || [];
        setNotifications(notifs);
        const unread = notifs.filter((n) => !n.is_read).length;
        if (!isFirstPoll && unread > prevUnread && "Notification" in window && Notification.permission === "granted") {
          const newest = notifs.find((n) => !n.is_read);
          if (newest) new Notification(newest.title, { body: newest.message });
        }
        isFirstPoll = false;
        prevUnread = unread;
      } catch {
        // ignore poll errors silently
      }
    }

    poll();
    const interval = setInterval(poll, 30000);
    return () => clearInterval(interval);
  }, [authStatus]);

  async function handleMarkAllRead() {
    await markAllNotificationsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: 1 })));
  }

  async function handleClearNotifications() {
    await clearNotifications();
    setNotifications([]);
  }

  if (authStatus === "loading") {
    return null;
  }

  if (authStatus === "unauthenticated") {
    return (
      <>
        {showSplash && <SplashScreen />}
        <Login
          onLoginSuccess={() => {
            triggerLoginSplash();
            setCurrentPage("dashboard");
            setUserEmail(getStoredUserEmail());
            setAuthStatus("authenticated");
          }}
        />
        <ThemeToggle theme={theme} onToggle={handleToggleTheme} />
      </>
    );
  }

  async function handleCreateApplication(payload) {
    const createdApplication = await createApplication(payload);
    setApplications((prev) => [{ ...createdApplication, doc_count: 0 }, ...prev]);
    return createdApplication;
  }

  async function handleUpdateApplication(applicationId, payload) {
    const updatedApplication = await updateApplication(applicationId, payload);
    setApplications((prev) =>
      prev.map((application) => {
        if (application.application_id !== applicationId) return application;
        return { ...updatedApplication, doc_count: application.doc_count };
      }),
    );
    return updatedApplication;
  }

  async function handleDeleteApplication(applicationId) {
    await deleteApplication(applicationId);
    setApplications((prev) =>
      prev.filter((application) => application.application_id !== applicationId),
    );
  }

  function handleDecrementDocCount(applicationId) {
    setApplications((prev) =>
      prev.map((app) =>
        app.application_id === applicationId
          ? { ...app, doc_count: Math.max(0, (app.doc_count || 0) - 1) }
          : app,
      ),
    );
  }

  function handleIncrementContactCount(applicationId) {
    setApplications((prev) =>
      prev.map((app) =>
        app.application_id === applicationId
          ? { ...app, contact_count: (app.contact_count || 0) + 1 }
          : app,
      ),
    );
  }

  function handleDecrementContactCount(applicationId) {
    setApplications((prev) =>
      prev.map((app) =>
        app.application_id === applicationId
          ? { ...app, contact_count: Math.max(0, (app.contact_count || 0) - 1) }
          : app,
      ),
    );
  }

  function handleNavigate(page, options = {}) {
    setCurrentPage(page);
    setPageState({
      applicationsEditingId: page === "applications" ? options.editingId ?? null : null,
    });
  }

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("userEmail");
    setApplications([]);
    setApplicationsStatus("idle");
    setApplicationsError("");
    setHasLoadedApplications(false);
    setNotifications([]);
    setUserEmail("");
    setCurrentPage("dashboard");
    setPageState({ applicationsEditingId: null });
    setAuthStatus("unauthenticated");
  }

  const toggle = <ThemeToggle theme={theme} onToggle={handleToggleTheme} />;
  const splash = showSplash ? <SplashScreen /> : null;

  if (currentPage === "applications") {
    return (
      <>
        {splash}
        <Applications
          applications={applications}
          applicationsError={applicationsError}
          hasLoadedApplications={hasLoadedApplications}
          applicationsStatus={applicationsStatus}
          onCreateApplication={handleCreateApplication}
          onDeleteApplication={handleDeleteApplication}
          onLogout={handleLogout}
          onNavigate={handleNavigate}
          onUpdateApplication={handleUpdateApplication}
          userEmail={userEmail}
          initialEditingId={pageState.applicationsEditingId}
        />
        {toggle}
      </>
    );
  }

  if (currentPage === "reminders") {
    return <>{splash}<Reminders onLogout={handleLogout} onNavigate={handleNavigate} />{toggle}</>;
  }

  if (currentPage === "contacts") {
    return <>{splash}<Contacts onLogout={handleLogout} onNavigate={handleNavigate} />{toggle}</>;
  }

  if (currentPage === "documents") {
    return <>{splash}<Documents onLogout={handleLogout} onNavigate={handleNavigate} />{toggle}</>;
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <>
      {splash}
      <Dashboard
        applications={applications}
        applicationsError={applicationsError}
        hasLoadedApplications={hasLoadedApplications}
        applicationsStatus={applicationsStatus}
        onDeleteApplication={handleDeleteApplication}
        onDecrementDocCount={handleDecrementDocCount}
        onIncrementContactCount={handleIncrementContactCount}
        onDecrementContactCount={handleDecrementContactCount}
        onLogout={handleLogout}
        onNavigate={handleNavigate}
        onUpdateApplication={handleUpdateApplication}
        notifications={notifications}
        unreadCount={unreadCount}
        onMarkAllRead={handleMarkAllRead}
        onClearNotifications={handleClearNotifications}
      />
      {toggle}
    </>
  );
}