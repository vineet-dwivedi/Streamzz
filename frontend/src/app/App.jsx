import { useEffect } from "react";
import { Navigate, Outlet, Route, Routes, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { PATHS } from "@/app/router/routeConfig";
import AppShell from "@/shared/ui/layout/AppShell";
import { authApi } from "@/features/auth/api/authApi";
import {
  logout,
  selectAuth,
  selectIsAdmin,
  selectIsLoggedIn,
  setCredentials,
} from "@/features/auth/model/authSlice";
import { useLenisScroll } from "@/shared/lib/animation/useLenisScroll";
import HomePage from "@/pages/home";
import AuthPage from "@/pages/auth";
import FavoritesPage from "@/pages/favorites";
import HistoryPage from "@/pages/history";
import AdminDashboardPage from "@/pages/admin";
import NotFoundPage from "@/pages/not-found";

const INTRO_RETURN_KEY = "streamzz:intro-return-path";
const INTRO_RELOAD_KEY = "streamzz:intro-reload-redirected";

function ShellLayout() {
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}

function RequireAuth() {
  const location = useLocation();
  const isLoggedIn = useSelector(selectIsLoggedIn);

  if (!isLoggedIn) {
    return <Navigate to={PATHS.AUTH} replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}

function RequireAdmin() {
  const isAdmin = useSelector(selectIsAdmin);

  if (!isAdmin) {
    return <Navigate to={PATHS.FAVORITES} replace />;
  }

  return <Outlet />;
}

function App() {
  const dispatch = useDispatch();
  const { token, user } = useSelector(selectAuth);
  const location = useLocation();
  const shellRoutes = [PATHS.FAVORITES, PATHS.HISTORY, PATHS.ADMIN];
  const shouldUseSmoothScroll = shellRoutes.includes(location.pathname);

  useLenisScroll(shouldUseSmoothScroll);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const [navigationEntry] = window.performance.getEntriesByType("navigation");
    const isReload = navigationEntry?.type === "reload";

    if (isReload && location.pathname !== PATHS.HOME) {
      const alreadyRedirected = window.sessionStorage.getItem(INTRO_RELOAD_KEY);

      if (!alreadyRedirected) {
        window.sessionStorage.setItem(INTRO_RETURN_KEY, location.pathname);
        window.sessionStorage.setItem(INTRO_RELOAD_KEY, "true");
        window.location.replace(PATHS.HOME);
        return;
      }
    }

    if (location.pathname === PATHS.HOME) {
      window.sessionStorage.removeItem(INTRO_RELOAD_KEY);
    }
  }, [location.pathname]);

  useEffect(() => {
    if (!token || user) {
      return;
    }

    let isActive = true;

    const loadCurrentUser = async () => {
      try {
        const response = await authApi.me();
        const currentUser = response.data?.user;

        if (!isActive) return;

        if (!currentUser) {
          dispatch(logout());
          return;
        }

        dispatch(setCredentials({ token, user: currentUser }));
      } catch (error) {
        if (isActive) {
          dispatch(logout());
        }
      }
    };

    loadCurrentUser();

    return () => {
      isActive = false;
    };
  }, [dispatch, token, user]);

  return (
    <Routes>
      <Route path={PATHS.HOME} element={<HomePage />} />
      <Route path={PATHS.AUTH} element={<AuthPage />} />

      <Route element={<RequireAuth />}>
        <Route element={<ShellLayout />}>
          <Route path={PATHS.FAVORITES} element={<FavoritesPage />} />
          <Route path={PATHS.HISTORY} element={<HistoryPage />} />
        </Route>

        <Route element={<RequireAdmin />}>
          <Route element={<ShellLayout />}>
            <Route path={PATHS.ADMIN} element={<AdminDashboardPage />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default App;
