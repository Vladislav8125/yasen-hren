"use client";

import { useEffect } from "react";

export function ScrollScenes() {
  useEffect(() => {
    const scenes = Array.from(document.querySelectorAll<HTMLElement>("[data-scroll-scene]"));
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      scenes.forEach((scene) => scene.classList.add("is-in-view"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in-view");
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "-8% 0px -12%", threshold: .12 },
    );
    scenes.forEach((scene) => observer.observe(scene));
    return () => observer.disconnect();
  }, []);

  return null;
}
