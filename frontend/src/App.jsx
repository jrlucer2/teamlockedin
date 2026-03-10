import { useEffect, useState } from "react";
import Login from "./pages/login";
import Dashboard from "./pages/dashboard";

export default function App() {
  const [authStatus, setAuthStatus] = useState("loading");
  // loading | authenticated | unauthenticated

  function clearAuth() {
    localStorage.removeItem("token");
    localStorage.removeItem("userEmail");
  }

  useEffect(() => {
    async function checkAuth() {
      const token = localStorage.getItem("token");

      if (!token) {
        setAuthStatus("unauthenticated");
        return;
      }

      try {
        const res = await fetch("/api/auth/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.ok) {
          setAuthStatus("authenticated");
          return;
        }

        clearAuth();
        setAuthStatus("unauthenticated");
      } catch {
        clearAuth();
        setAuthStatus("unauthenticated");
      }
    }

    checkAuth();
  }, []);

  if (authStatus === "loading") {
    return null;
  }

  if (authStatus === "unauthenticated") {
    return (
      <Login
        onLoginSuccess={() => {
          setAuthStatus("authenticated");
        }}
      />
    );
  }

  return (
    <Dashboard
      onLogout={() => {
        clearAuth();
        setAuthStatus("unauthenticated");
      }}
    />
  );
}