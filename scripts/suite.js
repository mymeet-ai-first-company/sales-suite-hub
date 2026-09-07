(() => {
  const root = document.documentElement;
  const revealTargets = document.querySelectorAll(".reveal, .reveal-stagger");
  const pressables = document.querySelectorAll("[data-pressable]");

  root.classList.add("motion-ready");
  requestAnimationFrame(() => root.classList.add("page-ready"));

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -8%", threshold: 0.08 }
    );

    revealTargets.forEach((target) => observer.observe(target));
  } else {
    revealTargets.forEach((target) => target.classList.add("is-visible"));
  }

  pressables.forEach((element) => {
    const release = () => element.classList.remove("is-pressing");

    element.addEventListener("pointerdown", () => {
      element.classList.add("is-pressing");
    });
    element.addEventListener("pointerup", release);
    element.addEventListener("pointercancel", release);
    element.addEventListener("pointerleave", release);
  });

  document.addEventListener("visibilitychange", () => {
    root.classList.toggle("is-paused", document.hidden);
  });
})();
