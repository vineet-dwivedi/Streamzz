import { Suspense, lazy } from "react";
import { useRoutes } from "react-router-dom";
import PageLoader from "@/shared/ui/feedback/PageLoader";
import ProtectedRoute from "@/app/router/guards/ProtectedRoute";
import AdminRoute from "@/app/router/guards/AdminRoute";
import { PATHS } from "@/app/router/routeConfig";

const HomePage = lazy(() => import("@/pages/HomePage"));
const AuthPage = lazy(() => import("@/pages/AuthPage"));
const FavoritesPage = lazy(() => import("@/pages/FavoritesPage"));
const HistoryPage = lazy(() => import("@/pages/HistoryPage"));
const AdminDashboardPage = lazy(() => import("@/pages/AdminDashboardPage"));
const NotFoundPage = lazy(() => import("@/pages/NotFoundPage"));

function AppRouter() {
  const routes = useRoutes([
    { path: PATHS.HOME, element: <HomePage /> },
    { path: PATHS.AUTH, element: <AuthPage /> },
    {
      element: <ProtectedRoute />,
      children: [
        { path: PATHS.FAVORITES, element: <FavoritesPage /> },
        { path: PATHS.HISTORY, element: <HistoryPage /> },
      ],
    },
    {
      element: <AdminRoute />,
      children: [{ path: PATHS.ADMIN, element: <AdminDashboardPage /> }],
    },
    { path: "*", element: <NotFoundPage /> },
  ]);

  return <Suspense fallback={<PageLoader />}>{routes}</Suspense>;
}

export default AppRouter;
