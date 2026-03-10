import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import gsap from "gsap";
import LightRays from "@/shared/ui/light-rays/LightRays";
import "./LightIntro.scss";

const floatTransition = {
  duration: 10,
  repeat: Infinity,
  ease: "easeInOut",
};

function LightIntro({ onEnter, onAuth }) {
  const rootRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const timeline = gsap.timeline({ defaults: { ease: "expo.out" } });
      timeline
        .fromTo(".light-intro__eyebrow", { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.6 })
        .fromTo(
          ".light-intro__title-line",
          { opacity: 0, yPercent: 120, rotateX: 18 },
          { opacity: 1, yPercent: 0, rotateX: 0, duration: 1, stagger: 0.08 },
          "-=0.2"
        )
        .fromTo(".light-intro__copy", { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.7 }, "-=0.5")
        .fromTo(
          ".light-intro__actions > *",
          { opacity: 0, y: 14 },
          { opacity: 1, y: 0, duration: 0.55, stagger: 0.1 },
          "-=0.4"
        );
    }, rootRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={rootRef} className="light-intro">
      <div className="light-intro__rays" aria-hidden="true">
        <LightRays
          raysOrigin="top-center"
          raysColor="#f1efe8"
          raysSpeed={0.9}
          lightSpread={1.4}
          rayLength={1.5}
          pulsating
          fadeDistance={0.7}
          saturation={1.05}
          followMouse
          mouseInfluence={0.2}
          noiseAmount={0.08}
          distortion={0.28}
        />
      </div>
      <div className="light-intro__veil" aria-hidden="true" />
      <div className="light-intro__grain" aria-hidden="true" />

      <motion.div
        className="light-intro__halo"
        aria-hidden="true"
        animate={{ scale: [1, 1.05, 1], opacity: [0.35, 0.7, 0.35] }}
        transition={floatTransition}
      />
      <motion.div
        className="light-intro__halo light-intro__halo--alt"
        aria-hidden="true"
        animate={{ scale: [1, 1.08, 1], opacity: [0.2, 0.5, 0.2] }}
        transition={{ ...floatTransition, duration: 12 }}
      />

      <div className="light-intro__layout">
        <div className="light-intro__panel">
          <p className="light-intro__eyebrow">Welcome to Streamzz</p>
          <h1 className="light-intro__title" aria-label="Welcome to Streamzz">
            <span className="light-intro__title-line">Streamzz</span>
            <span className="light-intro__title-line">Night</span>
            <span className="light-intro__title-line">Cinema</span>
          </h1>
          <p className="light-intro__copy">
            Discover a curated film universe with live trending titles, cinematic previews, and a personal archive built for
            repeat viewing.
          </p>
          <div className="light-intro__actions">
            <button type="button" className="light-intro__primary" onClick={onEnter}>
              Enter Platform
            </button>
            <button type="button" className="light-intro__secondary" onClick={onAuth}>
              Open Auth
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

export default LightIntro;
