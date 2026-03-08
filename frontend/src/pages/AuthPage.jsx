import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import LoginForm from "@/features/auth/ui/LoginForm";
import SignupForm from "@/features/auth/ui/SignupForm";
import AuthTunnelBackground from "@/features/auth/ui/AuthTunnelBackground";
import { PATHS } from "@/app/router/routeConfig";
import { clearError, selectIsLoggedIn, selectUser } from "@/features/auth/model/authSlice";
import "./AuthPage.scss";

function AuthPage() {
  const [mode, setMode] = useState("login");
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const isLoggedIn = useSelector(selectIsLoggedIn);
  const user = useSelector(selectUser);

  const redirectPath = location.state?.from && location.state.from !== PATHS.AUTH ? location.state.from : PATHS.FAVORITES;

  useEffect(() => {
    dispatch(clearError());
  }, [dispatch, mode]);

  useEffect(() => {
    if (!isLoggedIn) return;

    if (user?.role === "admin") {
      navigate(PATHS.ADMIN, { replace: true });
      return;
    }

    navigate(redirectPath, { replace: true });
  }, [isLoggedIn, navigate, redirectPath, user?.role]);

  const handleAuthSuccess = (loggedInUser) => {
    if (loggedInUser?.role === "admin") {
      navigate(PATHS.ADMIN, { replace: true });
      return;
    }

    navigate(redirectPath, { replace: true });
  };

  return (
    <section className="auth-screen">
      <div className="auth-glow auth-glow-left" />
      <div className="auth-glow auth-glow-right" />

      <div className="auth-layout">
        <div className="auth-intro">
          <AuthTunnelBackground />
          <div className="auth-intro-content">
            <p className="auth-kicker">Welcome Back to the Shadows</p>
            <h2 className="auth-title">Streamzz Portal</h2>
          </div>
        </div>

        <div className="auth-panel">
          <div className="auth-panel-head">
            <h3>{mode === "login" ? "Login" : "Create Account"}</h3>
            <p>{mode === "login" ? "Access your dashboard" : "Join Streamzz in seconds"}</p>
          </div>

          <div className={`auth-switch ${mode === "signup" ? "is-signup" : "is-login"}`}>
            <button
              type="button"
              className={mode === "login" ? "is-active" : ""}
              onClick={() => setMode("login")}
            >
              Login
            </button>
            <button
              type="button"
              className={mode === "signup" ? "is-active" : ""}
              onClick={() => setMode("signup")}
            >
              Register
            </button>
          </div>

          <div className={`auth-form-wrap ${mode === "signup" ? "is-signup" : "is-login"}`}>
            <div className="auth-form-slider">
              <div className="auth-form-panel auth-form-panel-login">
                <LoginForm onSuccess={handleAuthSuccess} />
              </div>
              <div className="auth-form-panel auth-form-panel-signup">
                <SignupForm onSuccess={handleAuthSuccess} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default AuthPage;
