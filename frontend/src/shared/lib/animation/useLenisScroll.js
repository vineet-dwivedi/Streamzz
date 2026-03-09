import { useEffect } from "react";
import Lenis from "lenis";
import { getGsap } from "@/shared/lib/animation/gsap";

function useLenisScroll(enabled = true) {
  useEffect(() => {
    if (!enabled || typeof window === "undefined") {
      return undefined;
    }

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return undefined;
    }

    const lenis = new Lenis({
      duration: 1.1,
      lerp: 0.085,
      smoothWheel: true,
      syncTouch: false,
      wheelMultiplier: 0.9,
      touchMultiplier: 1.05,
    });

    const { gsap, ScrollTrigger } = getGsap();
    const updateScrollTrigger = () => ScrollTrigger.update();
    const tick = (time) => {
      lenis.raf(time * 1000);
    };

    lenis.on("scroll", updateScrollTrigger);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(tick);
      lenis.destroy();
    };
  }, [enabled]);
}

export { useLenisScroll };
