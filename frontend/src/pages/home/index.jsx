import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { PATHS } from "@/app/router/routeConfig";
import { selectIsLoggedIn } from "@/features/auth/model/authSlice";
import CinematicIntro from "@/features/intro/ui/CinematicIntro";

const INTRO_RETURN_KEY = "streamzz:intro-return-path";

function HomePage() {
  const isLoggedIn = useSelector(selectIsLoggedIn);
  const navigate = useNavigate();

  const handleEnter = () => {
    const storedPath = window.sessionStorage.getItem(INTRO_RETURN_KEY);
    window.sessionStorage.removeItem(INTRO_RETURN_KEY);

    if (isLoggedIn) {
      navigate(storedPath || PATHS.FAVORITES, { replace: true });
      return;
    }

    if (storedPath && storedPath !== PATHS.HOME && storedPath !== PATHS.AUTH) {
      navigate(PATHS.AUTH, { replace: true, state: { from: storedPath } });
      return;
    }

    navigate(PATHS.AUTH, { replace: true });
  };

  return (
    <CinematicIntro
      onEnter={handleEnter}
      onAuth={() => navigate(PATHS.AUTH, { replace: true })}
    />
  );
}

export default HomePage;
