import { useEffect } from "react";
import { getGsap } from "@/shared/lib/animation/gsap";

export const useEditorialMotion = (rootRef, deps = [], options = {}) => {
  const { hero = false, parallax = false } = options;

  useEffect(() => {
    const root = rootRef.current;
    if (!root) {
      return undefined;
    }

    const { gsap, ScrollTrigger } = getGsap();

    const ctx = gsap.context(() => {
      if (hero) {
        const heroTimeline = gsap.timeline({ defaults: { ease: "power4.out" } });
        const heroChars = gsap.utils.toArray(".hero-title .char", root);

        heroTimeline
          .from(".hero-backdrop img", {
            scale: 1.15,
            filter: "blur(20px)",
            duration: 2.8,
            ease: "power2.out",
          })
          .from(
            ".hero-eyebrow-line",
            {
              scaleX: 0,
              transformOrigin: "left center",
              duration: 0.8,
            },
            0.35
          )
          .from(
            ".hero-eyebrow-text",
            {
              opacity: 0,
              x: 12,
              duration: 0.55,
            },
            0.5
          );

        if (heroChars.length > 0) {
          heroTimeline.from(
            heroChars,
            {
              yPercent: -120,
              opacity: 0,
              rotateX: 90,
              transformOrigin: "top center",
              stagger: 0.03,
              duration: 0.9,
              ease: "back.out(1.4)",
            },
            0.65
          );
        }

        heroTimeline
          .from(
            ".hero-tagline",
            {
              opacity: 0,
              y: 20,
              duration: 0.65,
            },
            1.15
          )
          .from(
            ".hero-meta-item",
            {
              opacity: 0,
              y: 14,
              stagger: 0.08,
              duration: 0.45,
            },
            1.25
          )
          .from(
            ".hero-cta-row > *",
            {
              opacity: 0,
              y: 18,
              stagger: 0.08,
              duration: 0.5,
            },
            1.35
          )
          .from(
            ".scroll-hint",
            {
              opacity: 0,
              y: -10,
              duration: 0.45,
            },
            1.8
          );
      }

      const sections = gsap.utils.toArray(".stream-section", root);
      sections.forEach((section) => {
        const label = section.querySelector(".section-label");
        const title = section.querySelector(".section-title");
        const action = section.querySelector(".section-action");

        const timeline = gsap.timeline({
          scrollTrigger: {
            trigger: section,
            start: "top 82%",
            once: true,
          },
        });

        if (label) {
          timeline.from(label, { opacity: 0, x: -20, duration: 0.55, ease: "expo.out" });
        }

        if (title) {
          timeline.from(title, { opacity: 0, y: 24, duration: 0.7, ease: "expo.out" }, "-=0.28");
        }

        if (action) {
          timeline.from(action, { opacity: 0, x: 12, duration: 0.5, ease: "expo.out" }, "<");
        }
      });

      const revealTargets = gsap.utils.toArray(
        ".movie-card, .stream-stat, .studio-movie-card, .studio-user-card, .top-ten-row, .history-entry, .spotlight-poster, .spotlight-content > *",
        root
      );

      if (revealTargets.length > 0) {
        ScrollTrigger.batch(revealTargets, {
          start: "top 88%",
          once: true,
          onEnter: (batch) =>
            gsap.fromTo(
              batch,
              { opacity: 0, y: 60, scale: 0.95, filter: "blur(10px)" },
              {
                opacity: 1,
                y: 0,
                scale: 1,
                filter: "blur(0px)",
                duration: 1.2,
                ease: "power3.out",
                stagger: 0.1,
                clearProps: "transform,opacity,filter",
              }
            ),
        });
      }

      if (parallax) {
        const hero = root.querySelector(".hero-cinematic");
        const image = root.querySelector(".hero-backdrop img");

        if (hero && image) {
          gsap.to(image, {
            yPercent: 20,
            ease: "none",
            scrollTrigger: {
              trigger: hero,
              start: "top top",
              end: "bottom top",
              scrub: 1.4,
            },
          });
        }
      }
    }, root);

    return () => {
      ctx.revert();
    };
  }, [rootRef, hero, parallax, ...deps]);
};

