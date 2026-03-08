import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectAuth, selectIsAdmin } from "@/features/auth/model/authSlice";
import { PATHS } from "@/app/router/routeConfig";

function AdminRoute() {
  const { token } = useSelector(selectAuth);
  const isAdmin = useSelector(selectIsAdmin);
  const location = useLocation();

  if (!token) {
    return <Navigate to={PATHS.AUTH} replace state={{ from: location.pathname }} />;
  }

  if (!isAdmin) {
    return <Navigate to={PATHS.FAVORITES} replace />;
  }

  return <Outlet />;
}

export default AdminRoute;
