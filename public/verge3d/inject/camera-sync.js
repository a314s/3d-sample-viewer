/**
 * Verge3D Camera Sync Injection
 * - Works with ANY Verge3D export that includes v3d.js.
 * - Add this script tag to the Verge3D app HTML (same-origin) after v3d.js:
 *   <script src="/verge3d/inject/camera-sync.js"></script>
 *
 * It:
 *  - Reads URL params (?role=primary|detail&punch=2)
 *  - After app.run(), starts broadcasting camera state to parent via postMessage
 *  - Listens for setCamState messages from parent and applies them
 *
 * Cross-origin note:
 *  - This must run inside the Verge3D iframe. For CDN-hosted apps, include the same tag
 *    in the CDN HTML too.
 */
(function () {
  function onReady(fn) {
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
      setTimeout(fn, 0);
    } else {
      document.addEventListener('DOMContentLoaded', fn);
    }
  }

  function getParams() {
    try {
      if (window.v3d && window.v3d.AppUtils && typeof window.v3d.AppUtils.getPageParams === 'function') {
        return window.v3d.AppUtils.getPageParams();
      }
    } catch {}
    // Fallback parser
    const params = {};
    try {
      const search = new URLSearchParams(window.location.search);
      for (const [k, v] of search.entries()) params[k] = v;
    } catch {}
    return params;
  }

  function nearly(a, b, eps) {
    return Math.abs(a - b) <= (eps ?? 1e-4);
  }
  function arrNearly(a, b, eps) {
    if (!a || !b || a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) if (!nearly(a[i], b[i], eps)) return false;
    return true;
  }

  function initSync(app) {
    if (!app || app.__cameraSyncInitialized) return;
    app.__cameraSyncInitialized = true;

    const v3d = window.v3d;
    const cam = app.camera || (app.getCamera ? app.getCamera() : null);
    const controls = app.controls;
    const hasTarget = !!(controls && controls.target);

    if (!cam) {
      console.warn('[Verge3D Sync] No camera found, skipping sync.');
      return;
    }

    const params = getParams();
    const punchFactor = (function () {
      const p = parseFloat(params.punch);
      return Number.isFinite(p) && p > 0 ? p : 1.0;
    })();

    let lastState = null;
    const uid = Math.random().toString(36).slice(2);

    function getState() {
      const pos = cam.position ? [cam.position.x, cam.position.y, cam.position.z] : [0, 0, 0];
      const quat = cam.quaternion ? [cam.quaternion.x, cam.quaternion.y, cam.quaternion.z, cam.quaternion.w] : [0, 0, 0, 1];
      const target = hasTarget ? [controls.target.x, controls.target.y, controls.target.z] : [0, 0, 0];
      const fov = cam.isPerspectiveCamera ? cam.fov : 50;
      return { pos, quat, target, fov };
    }

    function stateEqual(a, b) {
      if (!a || !b) return false;
      return arrNearly(a.pos, b.pos) && arrNearly(a.quat, b.quat) && arrNearly(a.target, b.target) && nearly(a.fov, b.fov);
    }

    function broadcast() {
      try {
        const state = getState();
        if (!lastState || !stateEqual(state, lastState)) {
          lastState = state;
          if (window.parent && window.parent !== window) {
            window.parent.postMessage({ type: 'cameraUpdate', state, sourceId: uid }, '*');
          }
        }
      } catch (e) {
        // ignore transient errors
      } finally {
        requestAnimationFrame(broadcast);
      }
    }

    function applyState(msg) {
      const data = msg && msg.data;
      if (!data || data.type !== 'setCamState' || !data.state) return;

      try {
        const s = data.state;
        const pf = typeof data.punchFactor === 'number' ? data.punchFactor : punchFactor;

        const t = new v3d.Vector3(s.target[0], s.target[1], s.target[2]);
        const p = new v3d.Vector3(s.pos[0], s.pos[1], s.pos[2]);

        const dir = p.clone().sub(t);
        if (pf !== 1.0 && dir.lengthSq() > 0) {
          dir.multiplyScalar(1 / Math.max(1e-6, pf));
        }
        const newPos = t.clone().add(dir);

        if (cam.position) cam.position.copy(newPos);
        if (cam.quaternion) cam.quaternion.set(s.quat[0], s.quat[1], s.quat[2], s.quat[3]);

        if (cam.isPerspectiveCamera && typeof s.fov === 'number') {
          cam.fov = s.fov;
          cam.updateProjectionMatrix();
        }

        if (hasTarget) {
          controls.target.copy(t);
          if (typeof controls.update === 'function') controls.update();
        }

        lastState = getState();
      } catch (e) {
        console.warn('[Verge3D Sync] Failed to apply state:', e);
      }
    }

    window.addEventListener('message', applyState);
    requestAnimationFrame(broadcast);
    console.info('[Verge3D Sync] Initialized');
  }

  function patchRun() {
    try {
      const v3d = window.v3d;
      if (!v3d || !v3d.App || !v3d.App.prototype) return;

      const proto = v3d.App.prototype;
      if (proto.__runPatchedForSync) return;
      proto.__runPatchedForSync = true;

      const originalRun = proto.run;
      proto.run = function () {
        try {
          return originalRun.apply(this, arguments);
        } finally {
          try {
            initSync(this);
          } catch (e) {
            console.warn('[Verge3D Sync] init error:', e);
          }
        }
      };
    } catch (e) {
      console.warn('[Verge3D Sync] Patch error:', e);
    }
  }

  onReady(function tryPatch() {
    // If v3d already present, patch immediately, otherwise retry.
    if (window.v3d && window.v3d.App) {
      patchRun();
    } else {
      let tries = 0;
      const timer = setInterval(function () {
        if (window.v3d && window.v3d.App) {
          clearInterval(timer);
          patchRun();
        } else if (++tries > 200) { // ~10s
          clearInterval(timer);
          console.warn('[Verge3D Sync] v3d not found; not initialized.');
        }
      }, 50);
    }
  });
})();