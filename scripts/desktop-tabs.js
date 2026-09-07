// Small, purpose-led motion only: explain state changes without slowing the page down.
document.documentElement.classList.add("motion-ready");
requestAnimationFrame(() => document.documentElement.classList.add("page-ready"));

const tabs = [...document.querySelectorAll("[role='tab']")];
const panels = [...document.querySelectorAll("[role='tabpanel']")];

function activateTab(nextTab, animate = false) {
  tabs.forEach((tab) => {
    const active = tab === nextTab;
    tab.setAttribute("aria-selected", String(active));
    tab.tabIndex = active ? 0 : -1;
  });

  panels.forEach((panel) => {
    const active = panel.id === nextTab.getAttribute("aria-controls");
    panel.hidden = !active;
    if (active && animate) panel.dataset.animate = "true";
    else delete panel.dataset.animate;
  });
}

tabs.forEach((tab, index) => {
  tab.addEventListener("click", () => activateTab(tab, true));
  tab.addEventListener("keydown", (event) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;

    event.preventDefault();
    const direction = event.key === "ArrowRight" ? 1 : -1;
    const nextTab = tabs[(index + direction + tabs.length) % tabs.length];
    // Keyboard actions are intentionally instant: frequent input should never wait for motion.
    activateTab(nextTab, false);
    nextTab.focus();
  });
});

const revealTargets = [...document.querySelectorAll(".reveal, .reveal-stagger")];
if ("IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      observer.unobserve(entry.target);
    });
  }, { rootMargin: "0px 0px -80px", threshold: 0.08 });

  revealTargets.forEach((target) => revealObserver.observe(target));
} else {
  revealTargets.forEach((target) => target.classList.add("is-visible"));
}

document.addEventListener("visibilitychange", () => {
  document.documentElement.classList.toggle("is-paused", document.hidden);
});
