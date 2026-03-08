import AppRouter from "@/app/router/AppRouter";
import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { PATHS } from "@/app/router/routeConfig";
import AppShell from "@/shared/ui/layout/AppShell";
import { authApi } from "@/features/auth/api/authApi";
import { logout, selectAuth, setCredentials } from "@/features/auth/model/authSlice";

function App() {
  const dispatch = useDispatch();
  const { token, user } = useSelector(selectAuth);
  const location = useLocation();
  const isIntroRoute = location.pathname === PATHS.HOME;
  const isAuthRoute = location.pathname === PATHS.AUTH;

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

  if (isIntroRoute || isAuthRoute) {
    return <AppRouter />;
  }

  return (
    <AppShell>
      <AppRouter />
    </AppShell>
  );
}

export default App;
