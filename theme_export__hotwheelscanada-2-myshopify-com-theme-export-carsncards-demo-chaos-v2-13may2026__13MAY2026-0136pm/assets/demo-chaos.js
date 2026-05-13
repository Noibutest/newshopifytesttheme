/*
 * demo-chaos.js
 * --------------------------------------------------------------
 * DEMO ONLY. Intentionally introduces JavaScript errors and
 * performance regressions so the Noibu dashboard has something
 * loud and colorful to show during product demos.
 *
 * Remove or disable this asset before pointing real traffic at
 * the theme. Search theme.liquid for "demo-chaos" to unwire it.
 * --------------------------------------------------------------
 */

(function () {
  'use strict';

  // ============================================================
  // 1. SYNCHRONOUS PAGE-LOAD SLOWDOWN (blocks the main thread)
  // ============================================================
  // Burns CPU before the page can paint. Tanks LCP and TTFB
  // perception. ~600-1200ms on a modern laptop.
  try {
    var slowStart = Date.now();
    var spin = 0;
    while (Date.now() - slowStart < 900) {
      spin += Math.sqrt(Math.random() * 9999) * Math.sin(spin);
    }
    window.__chaosSpinResult = spin;
  } catch (e) {
    // swallow — we want the page to keep limping along
  }

  // ============================================================
  // 2. IMMEDIATE REFERENCE ERROR (thrown on every page view)
  // ============================================================
  try {
    // noibuTracker is not defined anywhere — guaranteed ReferenceError
    noibuTracker.recordPageView({ page: window.location.pathname });
  } catch (e) {
    // Re-throw asynchronously so it bubbles to window.onerror
    setTimeout(function () {
      throw e;
    }, 50);
  }

  // ============================================================
  // 3. TYPE ERROR ON BOOT (null property access)
  // ============================================================
  setTimeout(function () {
    var config = null;
    // TypeError: Cannot read properties of null (reading 'init')
    config.init({ theme: 'dawn-demo' });
  }, 250);

  // ============================================================
  // 4. UNDEFINED METHOD CALL
  // ============================================================
  setTimeout(function () {
    var analytics = { name: 'demo-analytics' };
    // TypeError: analytics.flush is not a function
    analytics.flush();
  }, 600);

  // ============================================================
  // 5. UNHANDLED PROMISE REJECTION
  // ============================================================
  setTimeout(function () {
    new Promise(function (_, reject) {
      reject(new Error('Checkout token validation failed (demo)'));
    });
  }, 900);

  // ============================================================
  // 6. PERIODIC RECURRING ERROR (every 4s, different shape)
  // ============================================================
  var chaosTick = 0;
  setInterval(function () {
    chaosTick++;
    try {
      if (chaosTick % 4 === 0) {
        // ReferenceError
        cartSyncQueue.push({ id: chaosTick });
      } else if (chaosTick % 4 === 1) {
        // TypeError
        var u;
        u.length = 5;
      } else if (chaosTick % 4 === 2) {
        // RangeError
        var arr = new Array(-1);
      } else {
        // SyntaxError via JSON
        JSON.parse('{not valid json' + chaosTick);
      }
    } catch (err) {
      setTimeout(function () { throw err; }, 0);
    }
  }, 4000);

  // ============================================================
  // 7. RENDER-BLOCKING FAUX-FETCH (forces a long task)
  // ============================================================
  function chaosLongTask() {
    var t0 = performance.now ? performance.now() : Date.now();
    var sink = [];
    while ((performance.now ? performance.now() : Date.now()) - t0 < 350) {
      sink.push(Math.random().toString(36));
      if (sink.length > 50000) sink.length = 0;
    }
    window.__chaosLongTaskCount = (window.__chaosLongTaskCount || 0) + 1;
  }
  // Fire one long task on every scroll & click for max jank
  window.addEventListener('scroll', chaosLongTask, { passive: true });
  window.addEventListener('click', chaosLongTask, true);

  // ============================================================
  // 8. FORCED LAYOUT THRASH (re-reads layout in a hot loop)
  // ============================================================
  function thrashLayout() {
    if (!document.body) return;
    for (var i = 0; i < 250; i++) {
      document.body.style.zoom = 1 + (i % 2) * 0.0001;
      // intentional forced reflow
      void document.body.offsetHeight;
    }
  }
  setInterval(thrashLayout, 2500);

  // ============================================================
  // 9. BROKEN ADD-TO-CART (intercept clicks, throw, swallow form)
  // ============================================================
  document.addEventListener('click', function (evt) {
    var t = evt.target;
    if (!t || !t.closest) return;
    var btn = t.closest('[name="add"], button[type="submit"][name="add"], .product-form__submit, [data-add-to-cart]');
    if (!btn) return;

    // Loud console error + a real thrown error
    console.error('[demo-chaos] add-to-cart handler crashed:', new Error('cartBridge.commit is not a function'));

    setTimeout(function () {
      var cartBridge = undefined;
      // TypeError
      cartBridge.commit({ id: btn.getAttribute('data-product-id') });
    }, 0);

    // Approximately 1 in 3 clicks: actually swallow the submit too
    if (Math.random() < 0.33) {
      evt.preventDefault();
      evt.stopPropagation();
    }
  }, true);

  // ============================================================
  // 10. BROKEN GLOBAL OVERRIDES (subtle but very loud in Noibu)
  // ============================================================
  // Stomp on a common helper to cause downstream TypeErrors
  try {
    if (window.Shopify) {
      window.Shopify.formatMoney = null; // any caller will throw
    }
  } catch (e) {}

  // ============================================================
  // 11. NOISY CONSOLE OUTPUT (signals "something is wrong")
  // ============================================================
  console.warn('[demo-chaos] Theme running in DEMO CHAOS MODE — errors and slowness are intentional.');
})();
