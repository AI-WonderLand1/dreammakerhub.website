/**
 * CorrectAI Monitor v1.0
 * Drop this ONE script tag into your site and it runs silently in the background.
 * Open correctai-dashboard.html to see all errors live.
 *
 * Usage:
 *   <script src="correctai-monitor.js"></script>
 *
 * For React/TypeScript projects, import at the top of your index.js / main.tsx:
 *   import './correctai-monitor.js';
 */

(function () {
  'use strict';

  const CHANNEL = 'correctai_events';
  const SESSION = Date.now().toString(36);

  // ── Broadcast an error event to the dashboard ─────────────────────────────
  function emit(type, data) {
    const event = {
      id: Math.random().toString(36).slice(2),
      session: SESSION,
      type,          // js_error | unhandled_promise | network | broken_link | missing_asset | html_issue | css_issue | react_error | ts_error
      severity: data.severity || 'error',   // error | warning | info
      timestamp: new Date().toISOString(),
      url: window.location.href,
      ...data,
    };

    // Store in localStorage so dashboard can poll it
    try {
      const existing = JSON.parse(localStorage.getItem(CHANNEL) || '[]');
      existing.unshift(event);
      localStorage.setItem(CHANNEL, JSON.stringify(existing.slice(0, 500)));
    } catch (e) { /* storage full or blocked */ }

    // Also broadcast via BroadcastChannel if dashboard is open in another tab
    try {
      const bc = new BroadcastChannel(CHANNEL);
      bc.postMessage(event);
      bc.close();
    } catch (e) { /* not supported */ }
  }

  // ── 1. JavaScript runtime errors ──────────────────────────────────────────
  window.addEventListener('error', function (e) {
    if (e.message && e.message.includes('correctai')) return; // ignore our own errors
    emit('js_error', {
      severity: 'error',
      message: e.message,
      source: e.filename || window.location.href,
      line: e.lineno,
      col: e.colno,
      stack: e.error ? e.error.stack : null,
      label: 'JavaScript Error',
    });
  }, true);

  // ── 2. Unhandled promise rejections ───────────────────────────────────────
  window.addEventListener('unhandledrejection', function (e) {
    const reason = e.reason;
    emit('unhandled_promise', {
      severity: 'error',
      message: reason instanceof Error ? reason.message : String(reason),
      stack: reason instanceof Error ? reason.stack : null,
      label: 'Unhandled Promise Rejection',
      source: window.location.href,
    });
  });

  // ── 3. Network errors (fetch + XHR) ───────────────────────────────────────
  // Intercept fetch
  const _fetch = window.fetch;
  window.fetch = function (...args) {
    const url = args[0] instanceof Request ? args[0].url : String(args[0]);
    return _fetch.apply(this, args).then(res => {
      if (!res.ok) {
        emit('network', {
          severity: res.status >= 500 ? 'error' : 'warning',
          message: `HTTP ${res.status} ${res.statusText}`,
          source: url,
          status: res.status,
          label: 'Network Request Failed',
        });
      }
      return res;
    }).catch(err => {
      emit('network', {
        severity: 'error',
        message: err.message,
        source: url,
        label: 'Fetch Failed',
      });
      throw err;
    });
  };

  // Intercept XHR
  const _open = XMLHttpRequest.prototype.open;
  const _send = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.open = function (method, url) {
    this._correctai_url = url;
    this._correctai_method = method;
    return _open.apply(this, arguments);
  };
  XMLHttpRequest.prototype.send = function () {
    this.addEventListener('load', function () {
      if (this.status >= 400) {
        emit('network', {
          severity: this.status >= 500 ? 'error' : 'warning',
          message: `XHR ${this.status} on ${this._correctai_method} ${this._correctai_url}`,
          source: this._correctai_url,
          status: this.status,
          label: 'XHR Request Failed',
        });
      }
    });
    this.addEventListener('error', function () {
      emit('network', {
        severity: 'error',
        message: `XHR network error on ${this._correctai_url}`,
        source: this._correctai_url,
        label: 'XHR Network Error',
      });
    });
    return _send.apply(this, arguments);
  };

  // ── 4. Broken links & missing assets ──────────────────────────────────────
  window.addEventListener('error', function (e) {
    const el = e.target;
    if (!el || !el.tagName) return;
    const tag = el.tagName.toLowerCase();

    if (['img', 'script', 'link', 'video', 'audio', 'source', 'iframe'].includes(tag)) {
      const src = el.src || el.href || el.getAttribute('href') || '';
      emit('missing_asset', {
        severity: 'error',
        message: `Failed to load <${tag}>: ${src}`,
        source: src,
        element: tag,
        label: 'Missing Asset',
      });
    }
  }, true);

  // Check all <a> tags for broken hrefs (passive scan)
  function scanLinks() {
    const links = document.querySelectorAll('a[href]');
    links.forEach(link => {
      const href = link.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return;
      
      // Check for dangerous protocols (case-insensitive, handle encoding)
      const lowerHref = href.toLowerCase().trim();
      const decodedHref = decodeURIComponent(lowerHref).toLowerCase();
      
      if (lowerHref.startsWith('javascript:') || decodedHref.startsWith('javascript:') ||
          lowerHref.startsWith('data:') || decodedHref.startsWith('data:') ||
          lowerHref.startsWith('vbscript:') || decodedHref.startsWith('vbscript:')) {
        emit('broken_link', {
          severity: 'warning',
          message: `Potentially unsafe protocol in href on <a>`,
          source: href,
          label: 'Unsafe Link',
        });
      }
    });
  }

  // ── 5. HTML issues via DOM inspection ─────────────────────────────────────
  function scanHTML() {
    const issues = [];

    // Missing alt on images
    document.querySelectorAll('img:not([alt])').forEach(img => {
      issues.push({ message: `<img> missing alt attribute: ${img.src || img.getAttribute('src')}`, source: img.outerHTML.slice(0, 120) });
    });

    // Empty alt="" that are not decorative (has meaningful src)
    document.querySelectorAll('img[alt=""]').forEach(img => {
      const src = img.src || '';
      if (src && !src.includes('spacer') && !src.includes('pixel') && !src.includes('blank')) {
        issues.push({ message: `<img> has empty alt, may need description: ${src}`, source: img.outerHTML.slice(0, 120) });
      }
    });

    // Duplicate IDs
    const ids = {};
    document.querySelectorAll('[id]').forEach(el => {
      ids[el.id] = (ids[el.id] || 0) + 1;
    });
    Object.entries(ids).forEach(([id, count]) => {
      if (count > 1) issues.push({ message: `Duplicate id="${id}" found ${count} times`, source: `id="${id}"` });
    });

    // Forms missing labels
    document.querySelectorAll('input:not([type="hidden"]):not([aria-label]):not([aria-labelledby])').forEach(input => {
      const id = input.id;
      if (!id || !document.querySelector(`label[for="${id}"]`)) {
        issues.push({ message: `<input type="${input.type || 'text'}"> has no associated <label>`, source: input.outerHTML.slice(0, 120) });
      }
    });

    // Empty buttons/links
    document.querySelectorAll('button, a').forEach(el => {
      const text = (el.textContent || '').trim();
      const hasIcon = el.querySelector('[aria-label], svg, img');
      if (!text && !hasIcon && !el.getAttribute('aria-label')) {
        issues.push({ message: `<${el.tagName.toLowerCase()}> is empty (no text or accessible label)`, source: el.outerHTML.slice(0, 120) });
      }
    });

    // <title> missing or empty
    if (!document.title || !document.title.trim()) {
      issues.push({ message: 'Page is missing a <title> tag', source: '<head>' });
    }

    // Missing meta description
    if (!document.querySelector('meta[name="description"]')) {
      issues.push({ message: 'Missing <meta name="description"> tag', source: '<head>' });
    }

    issues.forEach(issue => {
      emit('html_issue', {
        severity: 'warning',
        label: 'HTML Issue',
        ...issue,
      });
    });
  }

  // ── 6. CSS issues ─────────────────────────────────────────────────────────
  function scanCSS() {
    try {
      Array.from(document.styleSheets).forEach(sheet => {
        try {
          const rules = Array.from(sheet.cssRules || []);
          rules.forEach(rule => {
            if (rule.type === CSSRule.STYLE_RULE) {
              const style = rule.style;
              // Detect z-index abuse
              const z = parseInt(style.zIndex);
              if (!isNaN(z) && Math.abs(z) > 9000) {
                emit('css_issue', {
                  severity: 'warning',
                  message: `Extreme z-index value (${z}) in rule: ${rule.selectorText}`,
                  source: rule.selectorText,
                  label: 'CSS Issue',
                });
              }
              // Detect !important overuse (flag if multiple per rule)
              const cssText = rule.cssText;
              const importantCount = (cssText.match(/!important/g) || []).length;
              if (importantCount >= 3) {
                emit('css_issue', {
                  severity: 'warning',
                  message: `Heavy !important usage (${importantCount}x) in: ${rule.selectorText}`,
                  source: rule.selectorText,
                  label: 'CSS Issue',
                });
              }
            }
          });
        } catch (e) { /* cross-origin sheet, skip */ }
      });
    } catch (e) { /* stylesheet read failed */ }
  }

  // ── 7. React error boundary detection ─────────────────────────────────────
  // Patch console.error to catch React's error messages
  const _consoleError = console.error;
  console.error = function (...args) {
    const msg = args.map(a => (typeof a === 'string' ? a : '')).join(' ');

    if (msg.includes('React') || msg.includes('Warning:') || msg.includes('Each child')) {
      emit('react_error', {
        severity: msg.toLowerCase().includes('error') ? 'error' : 'warning',
        message: msg.slice(0, 500),
        source: window.location.href,
        label: 'React Warning/Error',
      });
    }
    _consoleError.apply(console, args);
  };

  // ── 8. TypeScript / build errors (caught at runtime via console) ───────────
  const _consoleWarn = console.warn;
  console.warn = function (...args) {
    const msg = args.map(a => (typeof a === 'string' ? a : '')).join(' ');
    if (msg.includes('TS') || msg.includes('TypeError') || msg.includes('deprecated')) {
      emit('ts_error', {
        severity: 'warning',
        message: msg.slice(0, 500),
        source: window.location.href,
        label: 'TypeScript / Build Warning',
      });
    }
    _consoleWarn.apply(console, args);
  };

  // ── 9. Performance issues ─────────────────────────────────────────────────
  if (window.PerformanceObserver) {
    try {
      const po = new PerformanceObserver(list => {
        list.getEntries().forEach(entry => {
          if (entry.duration > 3000) {
            emit('network', {
              severity: 'warning',
              message: `Slow resource (${Math.round(entry.duration)}ms): ${entry.name}`,
              source: entry.name,
              label: 'Slow Asset',
            });
          }
        });
      });
      po.observe({ entryTypes: ['resource'] });
    } catch (e) { /* not supported */ }
  }

  // ── 10. MutationObserver — re-scan DOM on changes ─────────────────────────
  let scanTimer = null;
  const observer = new MutationObserver(() => {
    clearTimeout(scanTimer);
    scanTimer = setTimeout(() => { scanHTML(); scanLinks(); }, 2000);
  });

  // ── Bootstrap ─────────────────────────────────────────────────────────────
  function boot() {
    scanHTML();
    scanCSS();
    scanLinks();

    observer.observe(document.body || document.documentElement, {
      childList: true,
      subtree: true,
      attributes: false,
    });

    // Re-scan CSS every 30s in case stylesheets load late
    setInterval(scanCSS, 30000);

    emit('info', {
      severity: 'info',
      type: 'monitor_started',
      label: 'Monitor Started',
      message: `CorrectAI monitor active on ${window.location.hostname}`,
      source: window.location.href,
    });

    console.info('%c✦ CorrectAI Monitor active — open correctai-dashboard.html to view errors', 'color:#6366f1;font-weight:bold;');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

})();
