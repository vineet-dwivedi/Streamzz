import { NavLink, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { PATHS } from "@/app/router/routeConfig";
import { logout, selectAuth, selectUser } from "@/features/auth/model/authSlice";
import { authApi } from "@/features/auth/api/authApi";
import { ROLES } from "@/shared/constants/appConstants";

const baseNavItems = [
  { label: "Browse", path: PATHS.FAVORITES },
  { label: "History", path: PATHS.HISTORY },
];

function AppShell({ children }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { token } = useSelector(selectAuth);
  const user = useSelector(selectUser);
  const navItems = user?.role === ROLES.ADMIN ? [...baseNavItems, { label: "Studio", path: PATHS.ADMIN }] : baseNavItems;

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
      <div className="app-shell-glow app-shell-glow-left" />
      <div className="app-shell-glow app-shell-glow-right" />

      <div className="app-shell-window glass-heavy">
        <header className="app-header glass-panel">
          <div className="app-brand">
            <h1 className="app-title">STREAMZZ</h1>
            <p className="app-subtitle">Next Gen Streaming UI</p>
          </div>

          <nav className="app-nav glass-subtle">
            {navItems.map((item) => (
              <NavLink key={item.path} to={item.path} className={({ isActive }) => `app-nav-link ${isActive ? "is-active" : ""}`}>
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="app-actions">
            <span className="app-user-chip glass-subtle">{user?.name || "User"}</span>
            <button type="button" className="app-logout-btn" onClick={handleLogout}>
              Sign Out
            </button>
          </div>
        </header>

        <main className="app-main">{children}</main>
      </div>
    </div>
  );
}

export default AppShell;
