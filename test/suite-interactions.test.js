const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const script = fs.readFileSync(
  path.resolve(__dirname, "../scripts/suite.js"),
  "utf8"
);

class ClassList {
  constructor() {
    this.values = new Set();
  }

  add(value) {
    this.values.add(value);
  }

  remove(value) {
    this.values.delete(value);
  }

  toggle(value, enabled) {
    if (enabled) this.values.add(value);
    else this.values.delete(value);
  }

  contains(value) {
    return this.values.has(value);
  }
}

function createElement() {
  const listeners = new Map();

  return {
    classList: new ClassList(),
    addEventListener(type, listener) {
      listeners.set(type, listener);
    },
    dispatch(type) {
      listeners.get(type)?.();
    }
  };
}

function runSuite({ withObserver = true } = {}) {
  const root = { classList: new ClassList() };
  const reveal = createElement();
  const stagger = createElement();
  const pressable = createElement();
  const documentListeners = new Map();
  const observed = [];
  const unobserved = [];
  let observerCallback;

  const document = {
    documentElement: root,
    hidden: false,
    querySelectorAll(selector) {
      if (selector === ".reveal, .reveal-stagger") return [reveal, stagger];
      if (selector === "[data-pressable]") return [pressable];
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
    observed,
    pressable,
    reveal,
    root,
    stagger,
    unobserved,
    notify(entries) {
      observerCallback(entries);
    }
  };
}

test("prepares the page motion and reveals intersecting sections once", () => {
  const page = runSuite();

  assert.equal(page.root.classList.contains("motion-ready"), true);
  assert.equal(page.root.classList.contains("page-ready"), true);
  assert.deepEqual(page.observed, [page.reveal, page.stagger]);

  page.notify([
    { isIntersecting: false, target: page.stagger },
    { isIntersecting: true, target: page.reveal }
  ]);

  assert.equal(page.reveal.classList.contains("is-visible"), true);
  assert.equal(page.stagger.classList.contains("is-visible"), false);
  assert.deepEqual(page.unobserved, [page.reveal]);
});

test("reveals content immediately without IntersectionObserver", () => {
  const page = runSuite({ withObserver: false });

  assert.equal(page.reveal.classList.contains("is-visible"), true);
  assert.equal(page.stagger.classList.contains("is-visible"), true);
});

test("applies press feedback only for pointer interaction", () => {
  const page = runSuite();

  page.pressable.dispatch("pointerdown");
  assert.equal(page.pressable.classList.contains("is-pressing"), true);

  page.pressable.dispatch("pointerup");
  assert.equal(page.pressable.classList.contains("is-pressing"), false);

  page.pressable.dispatch("pointerdown");
  page.pressable.dispatch("pointerleave");
  assert.equal(page.pressable.classList.contains("is-pressing"), false);

  page.pressable.dispatch("pointerdown");
  page.pressable.dispatch("pointercancel");
  assert.equal(page.pressable.classList.contains("is-pressing"), false);
});

test("pauses and resumes looping motion with page visibility", () => {
  const page = runSuite();

  page.document.hidden = true;
  page.document.dispatch("visibilitychange");
  assert.equal(page.root.classList.contains("is-paused"), true);

  page.document.hidden = false;
  page.document.dispatch("visibilitychange");
  assert.equal(page.root.classList.contains("is-paused"), false);
});
