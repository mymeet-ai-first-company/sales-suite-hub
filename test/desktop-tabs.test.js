const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const script = fs.readFileSync(
  path.resolve(__dirname, "../scripts/desktop-tabs.js"),
  "utf8"
);

class ClassList {
  constructor() {
    this.values = new Set();
  }

  add(value) {
    this.values.add(value);
  }

  toggle(value, enabled) {
    if (enabled) this.values.add(value);
    else this.values.delete(value);
  }

  contains(value) {
    return this.values.has(value);
  }
}

function createElement({ id, controls, selected = false } = {}) {
  const attributes = new Map();
  const listeners = new Map();
  if (controls) attributes.set("aria-controls", controls);
  if (selected) attributes.set("aria-selected", "true");

  return {
    id,
    attributes,
    classList: new ClassList(),
    dataset: {},
    hidden: false,
    tabIndex: selected ? 0 : -1,
    focused: false,
    addEventListener(type, listener) {
      listeners.set(type, listener);
    },
    dispatch(type, event = {}) {
      listeners.get(type)?.(event);
    },
    focus() {
      this.focused = true;
    },
    getAttribute(name) {
      return attributes.get(name) ?? null;
    },
    setAttribute(name, value) {
      attributes.set(name, value);
    }
  };
}

function runDesktopTabs({ withObserver = true } = {}) {
  const macTab = createElement({
    id: "tab-macos",
    controls: "panel-macos",
    selected: true
  });
  const windowsTab = createElement({
    id: "tab-windows",
    controls: "panel-windows"
  });
  const macPanel = createElement({ id: "panel-macos" });
  const windowsPanel = createElement({ id: "panel-windows" });
  windowsPanel.hidden = true;
  const reveal = createElement();
  const stagger = createElement();
  const documentListeners = new Map();
  const documentElement = { classList: new ClassList() };
  const observed = [];
  const unobserved = [];
  let observerCallback;

  const document = {
    documentElement,
    hidden: false,
    querySelectorAll(selector) {
      if (selector === "[role='tab']") return [macTab, windowsTab];
      if (selector === "[role='tabpanel']") return [macPanel, windowsPanel];
      if (selector === ".reveal, .reveal-stagger") return [reveal, stagger];
      return [];
    },
    addEventListener(type, listener) {
      documentListeners.set(type, listener);
    },
    dispatch(type) {
      documentListeners.get(type)?.();
    }
  };

  const context = {
    document,
    requestAnimationFrame(callback) {
      callback();
    },
    window: {}
  };

  if (withObserver) {
    context.IntersectionObserver = class {
      constructor(callback) {
        observerCallback = callback;
      }

      observe(target) {
        observed.push(target);
      }

      unobserve(target) {
        unobserved.push(target);
      }
    };
    context.window.IntersectionObserver = context.IntersectionObserver;
  }

  vm.runInNewContext(script, context);

  return {
    document,
    macTab,
    windowsTab,
    macPanel,
    multilineRevealTargets: [reveal, stagger],
    windowsPanel,
    observed,
    unobserved,
    notifyIntersection(entries) {
      observerCallback(entries, {
        unobserve(target) {
          unobserved.push(target);
        }
      });
    }
  };
}

test("mouse activation selects the requested panel and enables transition motion", () => {
  const page = runDesktopTabs();

  page.windowsTab.dispatch("click");

  assert.equal(page.macTab.getAttribute("aria-selected"), "false");
  assert.equal(page.windowsTab.getAttribute("aria-selected"), "true");
  assert.equal(page.macPanel.hidden, true);
  assert.equal(page.windowsPanel.hidden, false);
  assert.equal(page.windowsPanel.dataset.animate, "true");
});

test("arrow keys wrap between tabs without adding motion", () => {
  const page = runDesktopTabs();
  let prevented = false;

  page.macTab.dispatch("keydown", {
    key: "ArrowLeft",
    preventDefault() {
      prevented = true;
    }
  });

  assert.equal(prevented, true);
  assert.equal(page.windowsTab.getAttribute("aria-selected"), "true");
  assert.equal(page.windowsPanel.dataset.animate, undefined);
  assert.equal(page.windowsTab.focused, true);
});

test("non-arrow keys leave the selected tab unchanged", () => {
  const page = runDesktopTabs();

  page.macTab.dispatch("keydown", { key: "Enter" });

  assert.equal(page.macTab.getAttribute("aria-selected"), "true");
  assert.equal(page.windowsTab.getAttribute("aria-selected"), null);
});

test("reveals intersecting sections once and ignores off-screen entries", () => {
  const page = runDesktopTabs();
  const [visible, hidden] = page.multilineRevealTargets;

  assert.deepEqual(page.observed, [visible, hidden]);
  page.notifyIntersection([
    { isIntersecting: true, target: visible },
    { isIntersecting: false, target: hidden }
  ]);

  assert.equal(visible.classList.contains("is-visible"), true);
  assert.equal(hidden.classList.contains("is-visible"), false);
  assert.deepEqual(page.unobserved, [visible]);
});

test("reveals content immediately when IntersectionObserver is unavailable", () => {
  const page = runDesktopTabs({ withObserver: false });

  for (const target of page.multilineRevealTargets) {
    assert.equal(target.classList.contains("is-visible"), true);
  }
});

test("pauses and resumes looping motion with page visibility", () => {
  const page = runDesktopTabs();

  page.document.hidden = true;
  page.document.dispatch("visibilitychange");
  assert.equal(page.document.documentElement.classList.contains("is-paused"), true);

  page.document.hidden = false;
  page.document.dispatch("visibilitychange");
  assert.equal(page.document.documentElement.classList.contains("is-paused"), false);
});
