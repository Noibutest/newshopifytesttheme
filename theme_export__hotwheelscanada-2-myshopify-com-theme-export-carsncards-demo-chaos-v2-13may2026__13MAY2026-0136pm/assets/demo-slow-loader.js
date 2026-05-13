/*
 * demo-slow-loader.js
 * --------------------------------------------------------------
 * DEMO ONLY. Render-blocking on purpose. Loaded SYNCHRONOUSLY
 * from <head> before any other theme JS so it delays first paint,
 * tanks LCP, and gives Noibu's Core Web Vitals tiles something
 * dramatic to display.
 *
 * Remove or unwire from theme.liquid before any real traffic.
 * --------------------------------------------------------------
 */

(function () {
  // Block the main thread for a fixed window. Tuned so the page
  // still eventually paints — about 1.6s on a typical laptop.
  var BLOCK_MS = 1600;
  var start = Date.now();
  var acc = 0;
  while (Date.now() - start < BLOCK_MS) {
    // Cheap arithmetic that the JIT can't elide.
    acc += Math.sqrt((Date.now() % 9973) + 1);
    acc = acc % 1e9;
  }
  window.__demoSlowLoaderAcc = acc;

  // Throw a boot-time ReferenceError so Noibu has an early-error
  // event tied to the slow load.
  try {
    // analyticsBootstrap is not defined
    analyticsBootstrap.init({ phase: 'pre-paint' });
  } catch (e) {
    // Defer to next tick so it surfaces on window.onerror
    setTimeout(function () { throw e; }, 0);
  }
})();
