import { useEffect, useRef, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { PATHS } from "@/app/router/routeConfig";
import { logout, selectAuth, selectUser } from "@/features/auth/model/authSlice";
import { authApi } from "@/features/auth/api/authApi";
import { ROLES } from "@/shared/constants/appConstants";
import "./AppShell.scss";

const baseNavItems = [
  { label: "Browse", path: PATHS.FAVORITES, icon: "browse" },
  { label: "History", path: PATHS.HISTORY, icon: "history" },
];

const SearchIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="11" cy="11" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
    <path d="M16 16L21 21" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

const BellIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path
      d="M8.5 18H15.5C16.6 18 17.5 17.1 17.5 16V11.5C17.5 8.5 15.7 6.2 13 5.4V4.8C13 4.1 12.6 3.5 12 3.5C11.4 3.5 11 4.1 11 4.8V5.4C8.3 6.2 6.5 8.5 6.5 11.5V16C6.5 17.1 7.4 18 8.5 18Z"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
    <path d="M10 19.5C10.4 20.4 11.1 21 12 21C12.9 21 13.6 20.4 14 19.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const getTabIcon = (icon) => {
  if (icon === "history") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 6V12L16 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M4.5 12A7.5 7.5 0 1 0 7 6.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    );
  }

  if (icon === "studio") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="4" y="5" width="16" height="14" rx="2.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
        <path d="M8 10H16M8 14H13" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 6.5H20M4 12H20M4 17.5H15" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
};

function AppShell({ children }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const headerRef = useRef(null);
  const { token } = useSelector(selectAuth);
  const user = useSelector(selectUser);
  const navItems = user?.role === ROLES.ADMIN ? [...baseNavItems, { label: "Studio", path: PATHS.ADMIN, icon: "studio" }] : baseNavItems;
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const updateScrollProgress = () => {
      const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
      const maxScroll = Math.max(scrollHeight - clientHeight, 1);
      setScrollProgress(Math.min(scrollTop / maxScroll, 1));
    };

    updateScrollProgress();
    window.addEventListener("scroll", updateScrollProgress, { passive: true });

    return () => {
      window.removeEventListener("scroll", updateScrollProgress);
    };
  }, []);

  useEffect(() => {
    const header = headerRef.current;
    if (!header) {
      return undefined;
    }

    const updateHeaderTone = () => {
      const hasScrolled = window.scrollY > 100;
      header.dataset.scrolled = hasScrolled ? "true" : "false";
    };

    updateHeaderTone();
    window.addEventListener("scroll", updateHeaderTone, { passive: true });

    return () => {
      window.removeEventListener("scroll", updateHeaderTone);
    };
  }, []);

  const handleLogout = async () => {
    try {
      if (token) {
        await authApi.logout();
      }
    } catch (error) {
      console.error("Logout API failed:", error);
    } finally {
      dispatch(logout());
      navigate(PATHS.AUTH, { replace: true });
    }
  };

  return (
    <div className="app-shell-root">
      <div className="app-scroll-progress" aria-hidden="true">
        <span className="app-scroll-progress-bar" style={{ transform: `scaleX(${scrollProgress})` }} />
      </div>
      <div className="app-noise-layer" aria-hidden="true" />

      <div className="app-shell-glow app-shell-glow-left" />
      <div className="app-shell-glow app-shell-glow-right" />

      <div className="app-shell-window glass-heavy">
        <header ref={headerRef} className="app-header">
          <button type="button" className="app-brand" onClick={() => navigate(PATHS.FAVORITES)}>
            <h1 className="app-title">
              <span>OBSIDIAN.</span>
            </h1>
            <p className="app-subtitle">Editorial Motion Picture Index</p>
          </button>

          <nav className="app-nav" aria-label="Primary Navigation">
            {navItems.map((item) => (
              <NavLink key={item.path} to={item.path} className={({ isActive }) => `app-nav-link ${isActive ? "is-active" : ""}`}>
                <span className="app-nav-link-label">{item.label}</span>
                <span className="app-nav-underline" />
              </NavLink>
            ))}
          </nav>

          <div className="app-actions">
            <button type="button" className="app-icon-btn" aria-label="Go to Browse Search" onClick={() => navigate(PATHS.FAVORITES)}>
              <SearchIcon />
            </button>
            <button type="button" className="app-icon-btn" aria-label="Go to History" onClick={() => navigate(PATHS.HISTORY)}>
              <BellIcon />
            </button>
            <span className="app-user-chip glass-subtle">{user?.name || "User"}</span>
            <button type="button" className="app-logout-btn" onClick={handleLogout}>
              Sign Out
            </button>
          </div>
        </header>

        <main className="app-main">{children}</main>
      </div>

      <nav className="app-mobile-tab" aria-label="Mobile Navigation" style={{ "--mobile-tab-count": navItems.length }}>
        {navItems.map((item) => (
          <NavLink key={`mobile-${item.path}`} to={item.path} className={({ isActive }) => `app-mobile-link ${isActive ? "is-active" : ""}`}>
            <span className="app-mobile-link-icon">{getTabIcon(item.icon)}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

export default AppShell;
