// Keep the install instructions usable with mouse and keyboard without a UI framework.
const tabs = [...document.querySelectorAll("[role='tab']")];
const panels = [...document.querySelectorAll("[role='tabpanel']")];

function activateTab(nextTab) {
  tabs.forEach((tab) => {
    const active = tab === nextTab;
    tab.setAttribute("aria-selected", String(active));
    tab.tabIndex = active ? 0 : -1;
  });

  panels.forEach((panel) => {
    panel.hidden = panel.id !== nextTab.getAttribute("aria-controls");
  });
}

tabs.forEach((tab, index) => {
  tab.addEventListener("click", () => activateTab(tab));
  tab.addEventListener("keydown", (event) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;

    event.preventDefault();
    const direction = event.key === "ArrowRight" ? 1 : -1;
    const nextTab = tabs[(index + direction + tabs.length) % tabs.length];
    activateTab(nextTab);
    nextTab.focus();
  });
});
