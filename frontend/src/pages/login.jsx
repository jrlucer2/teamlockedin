import { useState } from "react";

const EMPLOYMENT_OPTIONS = [
  { value: "", label: "Select status…" },
  { value: "student", label: "Student" },
  { value: "employed", label: "Employed" },
  { value: "unemployed", label: "Unemployed / Seeking" },
  { value: "freelance", label: "Freelance / Contract" },
  { value: "other", label: "Other" },
];

const INITIAL_PROFILE = {
  firstName: "",
  lastName: "",
  organization: "",
  employmentStatus: "",
  targetRole: "",
};

export default function Login({ onLoginSuccess }) {
  const [mode, setMode] = useState("signin");
  // signin fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  // create account step (1 = credentials, 2 = profile)
  const [createStep, setCreateStep] = useState(1);
  const [profile, setProfile] = useState(INITIAL_PROFILE);

  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  function updateProfile(key, value) {
    setProfile((prev) => ({ ...prev, [key]: value }));
  }

  function switchMode(next) {
    setMode(next);
    setCreateStep(1);
    setError("");
    setInfo("");
    setPassword("");
    setConfirmPassword("");
    setProfile(INITIAL_PROFILE);
  }

  async function parseResponse(response) {
    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      return response.json().catch(() => ({}));
    }
    const raw = await response.text().catch(() => "");
    return raw ? { message: raw.slice(0, 180) } : {};
  }

  async function signInWithCredentials(emailInput, passwordInput) {
    const response = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: emailInput.trim(), password: passwordInput }),
    });

    const data = await parseResponse(response);

    if (!response.ok || !data.token) {
      const fallback =
        response.status >= 500
          ? "Backend API unavailable. Make sure the server is running on port 3000."
          : `Login failed (HTTP ${response.status}).`;
      throw new Error(data.message || fallback);
    }

    localStorage.setItem("token", data.token);
    localStorage.setItem("userEmail", emailInput.trim());
    onLoginSuccess?.();
  }

  // Step 1 submit: validate credentials and advance to step 2
  function handleStep1(e) {
    e.preventDefault();
    setError("");

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setError("Please enter your email and password.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setCreateStep(2);
  }

  // Step 2 submit: send full registration payload
  async function handleStep2(e) {
    e.preventDefault();
    setError("");

    if (!profile.firstName.trim() || !profile.lastName.trim()) {
      setError("First and last name are required.");
      return;
    }

    try {
      const createRes = await fetch("/api/create-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          password,
          firstName: profile.firstName.trim(),
          lastName: profile.lastName.trim(),
          organization: profile.organization.trim() || null,
          employmentStatus: profile.employmentStatus || null,
          targetRole: profile.targetRole.trim() || null,
        }),
      });

      const createData = await parseResponse(createRes);
      if (!createRes.ok) {
        setError(createData.message || `Account creation failed (HTTP ${createRes.status}).`);
        return;
      }

      setInfo("Account created. Signing you in…");
      await signInWithCredentials(email, password);
    } catch (err) {
      setError(
        err?.message ||
          "Unable to reach backend API. Start backend server (`npm run dev`) on port 3000."
      );
    }
  }

  // Sign-in submit
  async function handleSignIn(e) {
    e.preventDefault();
    setError("");
    setInfo("");

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setError("Please enter an email and password.");
      return;
    }

    try {
      await signInWithCredentials(trimmedEmail, password);
    } catch (err) {
      setError(
        err?.message ||
          "Unable to reach backend API. Start backend server (`npm run dev`) on port 3000."
      );
    }
  }

  if (mode === "signin") {
    return (
      <div className="auth-shell">
        <div className="auth-card">
          <h1 className="auth-title">Sign in</h1>
          <p className="auth-subtitle">Enter your credentials to access your dashboard.</p>

          <form className="auth-form" onSubmit={handleSignIn}>
            <label className="auth-label">
              Email
              <input
                className="auth-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                placeholder="you@example.com"
              />
            </label>

            <label className="auth-label">
              Password
              <input
                className="auth-input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                placeholder="••••••••"
              />
            </label>

            {error ? <div className="auth-error">{error}</div> : null}

            <button className="primary-btn auth-btn" type="submit">
              Sign in
            </button>
          </form>

          <div className="auth-footnote">
            Need an account?{" "}
            <button type="button" className="ghost-btn" onClick={() => switchMode("create")}>
              Create one
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Create account mode
  return (
    <div className="auth-shell">
      <div className="auth-card auth-card--wide">
        <div className="auth-stepper">
          <div className={`auth-step ${createStep >= 1 ? "auth-step--active" : ""}`}>
            <span className="auth-step-num">1</span>
            <span className="auth-step-label">Account</span>
          </div>
          <div className="auth-step-connector" />
          <div className={`auth-step ${createStep >= 2 ? "auth-step--active" : ""}`}>
            <span className="auth-step-num">2</span>
            <span className="auth-step-label">Profile</span>
          </div>
        </div>

        {createStep === 1 ? (
          <>
            <h1 className="auth-title">Create account</h1>
            <p className="auth-subtitle">Set up your login credentials.</p>

            <form className="auth-form" onSubmit={handleStep1}>
              <label className="auth-label">
                Email
                <input
                  className="auth-input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  placeholder="you@example.com"
                />
              </label>

              <label className="auth-label">
                Password
                <input
                  className="auth-input"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  placeholder="••••••••"
                />
              </label>

              <label className="auth-label">
                Confirm password
                <input
                  className="auth-input"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  placeholder="••••••••"
                />
              </label>

              <p className="auth-hint">
                Minimum 8 characters with an uppercase letter, lowercase letter, and number.
              </p>

              {error ? <div className="auth-error">{error}</div> : null}

              <button className="primary-btn auth-btn" type="submit">
                Continue
              </button>
            </form>
          </>
        ) : (
          <>
            <h1 className="auth-title">Your profile</h1>
            <p className="auth-subtitle">Tell us a bit about yourself.</p>

            <form className="auth-form" onSubmit={handleStep2}>
              <div className="auth-form-grid">
                <label className="auth-label">
                  First name <span className="auth-required">*</span>
                  <input
                    className="auth-input"
                    type="text"
                    value={profile.firstName}
                    onChange={(e) => updateProfile("firstName", e.target.value)}
                    autoComplete="given-name"
                    placeholder="Jordan"
                  />
                </label>

                <label className="auth-label">
                  Last name <span className="auth-required">*</span>
                  <input
                    className="auth-input"
                    type="text"
                    value={profile.lastName}
                    onChange={(e) => updateProfile("lastName", e.target.value)}
                    autoComplete="family-name"
                    placeholder="Lee"
                  />
                </label>
              </div>

              <label className="auth-label">
                Organization or university
                <input
                  className="auth-input"
                  type="text"
                  value={profile.organization}
                  onChange={(e) => updateProfile("organization", e.target.value)}
                  autoComplete="organization"
                  placeholder="e.g., Arizona State University"
                />
              </label>

              <label className="auth-label">
                Employment status
                <select
                  className="auth-input"
                  value={profile.employmentStatus}
                  onChange={(e) => updateProfile("employmentStatus", e.target.value)}
                >
                  {EMPLOYMENT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value} disabled={opt.value === ""}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="auth-label">
                Target role / industry
                <input
                  className="auth-input"
                  type="text"
                  value={profile.targetRole}
                  onChange={(e) => updateProfile("targetRole", e.target.value)}
                  placeholder="e.g., Software Engineer, Product Management"
                />
              </label>

              {error ? <div className="auth-error">{error}</div> : null}
              {info ? <div className="auth-info">{info}</div> : null}

              <div className="auth-step2-actions">
                <button
                  type="button"
                  className="ghost-btn"
                  onClick={() => { setCreateStep(1); setError(""); }}
                >
                  Back
                </button>
                <button className="primary-btn auth-btn auth-btn--flex" type="submit">
                  Create Account
                </button>
              </div>
            </form>
          </>
        )}

        <div className="auth-footnote">
          Already have an account?{" "}
          <button type="button" className="ghost-btn" onClick={() => switchMode("signin")}>
            Sign in instead
          </button>
        </div>
      </div>
    </div>
  );
}
