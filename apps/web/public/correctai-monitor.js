/*
 * CorrectAI diagnostics: report useful categories and HTTP statuses without
 * collecting credentials, URL parameters, page content, request bodies, or stacks.
 * This is a browser-only diagnostic tool, not a security/audit-log service.
 */
(function () {
  'use strict';

  if (window.__correctAIMonitorActive) return;
  window.__correctAIMonitorActive = true;

  const CHANNEL = 'correctai_events';
  const MIGRATION = 'correctai_events_redacted_v2';
  const SESSION = Date.now().toString(36);
  const SAFE_ROUTE_PREFIXES = [
    '/api/auth', '/api/config', '/api/ai', '/_next/static',
    '/auth', '/dashboard', '/wonder-build', '/docs', '/contact',
  ];

  // Older versions stored complete OAuth callback URLs, failed request URLs,
  // exception messages, stacks and outerHTML. Never read or rebroadcast them.
  // Clear that legacy store once when this version first runs on an origin.
  try {
    if (localStorage.getItem(MIGRATION) !== '1') {
      localStorage.removeItem(CHANNEL);
      localStorage.setItem(MIGRATION, '1');
    }
  } catch (_) { /* Browser storage may be disabled. */ }

  function safeUrl(input) {
    try {
      const parsed = new URL(String(input), window.location.href);
      if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return '[non-http resource]';
      // Only known, static route prefixes survive. Never retain an arbitrary
      // path segment, query, fragment, username or password.
      const prefix = SAFE_ROUTE_PREFIXES.find(route =>
        parsed.pathname === route || parsed.pathname.startsWith(route + '/')
      );
      return parsed.origin + (prefix || '');
    } catch (_) {
      return '[unknown resource]';
    }
  }

  function emit(type, data = {}) {
    // Deliberate allowlist: callers cannot accidentally persist raw input.
    const event = {
      id: Math.random().toString(36).slice(2),
      session: SESSION,
      type,
      severity: data.severity || 'warning',
      timestamp: new Date().toISOString(),
      url: safeUrl(window.location.href),
      label: data.label || 'Diagnostic',
      message: data.message || 'Diagnostic event',
      source: safeUrl(data.source || window.location.href),
    };
    if (Number.isFinite(data.status)) event.status = data.status;
    if (Number.isFinite(data.line)) event.line = data.line;
    if (Number.isFinite(data.col)) event.col = data.col;
    if (data.element) event.element = data.element;

    try {
      const current = JSON.parse(localStorage.getItem(CHANNEL) || '[]');
      const existing = Array.isArray(current) ? current.filter(item => item && item.timestamp &&
        Date.now() - Date.parse(item.timestamp) < 86400000 &&
        item.url && !item.url.includes('?') && !item.url.includes('#') &&
        !('stack' in item)) : [];
      existing.unshift(event);
      localStorage.setItem(CHANNEL, JSON.stringify(existing.slice(0, 100)));
    } catch (_) { /* Storage full or unavailable. */ }

    try {
      const bc = new BroadcastChannel(CHANNEL);
      bc.postMessage(event);
      bc.close();
    } catch (_) { /* BroadcastChannel unavailable. */ }
  }

  // Do not record arbitrary error messages or stack traces. Libraries can put
  // bearer tokens, prompts, customer data or entire request URLs in those.
  window.addEventListener('error', function (e) {
    if (e.target && e.target !== window && e.target.tagName) return;
    const errorName = e.error && typeof e.error.name === 'string' &&
      /^(TypeError|ReferenceError|SyntaxError|RangeError|URIError|EvalError)$/.test(e.error.name)
      ? e.error.name : 'JavaScript error';
    emit('js_error', {
      severity: 'error', message: errorName, label: 'JavaScript Error',
      source: e.filename, line: e.lineno, col: e.colno,
    });
  }, true);

  window.addEventListener('unhandledrejection', function () {
    emit('unhandled_promise', {
      severity: 'error', message: 'Unhandled promise rejection', label: 'Unhandled Promise Rejection',
    });
  });

  if (typeof window.fetch === 'function') {
    const originalFetch = window.fetch;
    window.fetch = function (...args) {
      const source = typeof Request !== 'undefined' && args[0] instanceof Request
        ? safeUrl(args[0].url) : safeUrl(args[0]);
      return originalFetch.apply(this, args).then(response => {
        if (!response.ok) {
          emit('network', {
            severity: response.status >= 500 ? 'error' : 'warning',
            message: 'HTTP request failed', label: 'Network Request Failed',
            source, status: response.status,
          });
        }
        return response;
      }).catch(error => {
        emit('network', {
          severity: 'error', message: 'Network request failed',
          source, label: 'Fetch Failed',
        });
        throw error;
      });
    };
  }

  if (typeof XMLHttpRequest !== 'undefined') {
    const originalOpen = XMLHttpRequest.prototype.open;
    const originalSend = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.open = function (method, url) {
      // Store the redacted form only, never the raw query-bearing URL.
      this._correctai_safe_url = safeUrl(url);
      return originalOpen.apply(this, arguments);
    };
    XMLHttpRequest.prototype.send = function () {
      this.addEventListener('load', function () {
        if (this.status >= 400) {
          emit('network', {
            severity: this.status >= 500 ? 'error' : 'warning',
            message: 'XHR request failed', source: this._correctai_safe_url,
            status: this.status, label: 'XHR Request Failed',
          });
        }
      });
      this.addEventListener('error', function () {
        emit('network', {
          severity: 'error', message: 'XHR network error',
          source: this._correctai_safe_url, label: 'XHR Network Error',
        });
      });
      return originalSend.apply(this, arguments);
    };
  }

  window.addEventListener('error', function (e) {
    const el = e.target;
    if (!el || !el.tagName) return;
    const tag = el.tagName.toLowerCase();
    if (!['img', 'script', 'link', 'video', 'audio', 'source', 'iframe'].includes(tag)) return;
    emit('missing_asset', {
      severity: 'error', message: 'Resource failed to load',
      source: safeUrl(el.src || el.href || ''), element: tag, label: 'Missing Asset',
    });
  }, true);

  function scanLinks() {
    document.querySelectorAll('a[href]').forEach(link => {
      const href = link.getAttribute('href') || '';
      let decoded = href;
      try { decoded = decodeURIComponent(href); } catch (_) { /* Invalid percent encoding. */ }
      if (/^\s*(?:javascript|data|vbscript):/i.test(href) ||
          /^\s*(?:javascript|data|vbscript):/i.test(decoded)) {
        emit('broken_link', {
          severity: 'warning', message: 'Potentially unsafe link protocol',
          label: 'Unsafe Link',
        });
      }
    });
  }

  function scanHTML() {
    document.querySelectorAll('img:not([alt])').forEach(() => {
      emit('html_issue', { message: 'Image missing alt text', label: 'HTML Issue' });
    });
    const ids = new Map();
    document.querySelectorAll('[id]').forEach(el => ids.set(el.id, (ids.get(el.id) || 0) + 1));
    ids.forEach(count => {
      if (count > 1) emit('html_issue', { message: 'Duplicate element IDs', label: 'HTML Issue' });
    });
    document.querySelectorAll('input:not([type="hidden"]):not([aria-label]):not([aria-labelledby])').forEach(input => {
      if (!input.labels || input.labels.length === 0) {
        emit('html_issue', { message: 'Input missing accessible label', label: 'HTML Issue' });
      }
    });
    if (!document.title) emit('html_issue', { message: 'Missing page title', label: 'HTML Issue' });
    if (!document.querySelector('meta[name="description"]')) {
      emit('html_issue', { message: 'Missing meta description', label: 'HTML Issue' });
    }
  }

  function scanCSS() {
    try {
      Array.from(document.styleSheets).forEach(sheet => {
        try {
          Array.from(sheet.cssRules || []).forEach(rule => {
            if (rule.type !== CSSRule.STYLE_RULE) return;
            if (Math.abs(parseInt(rule.style.zIndex, 10)) > 9000) {
              emit('css_issue', { message: 'Extreme z-index', label: 'CSS Issue' });
            }
            if ((rule.cssText.match(/!important/g) || []).length >= 3) {
              emit('css_issue', { message: 'Excessive !important declarations', label: 'CSS Issue' });
            }
          });
        } catch (_) { /* Cross-origin style sheet. */ }
      });
    } catch (_) { /* Stylesheets unavailable. */ }
  }

  const originalError = console.error;
  console.error = function (...args) {
    if (args.some(arg => typeof arg === 'string' && /React|Warning:|Each child/.test(arg))) {
      emit('react_error', { severity: 'warning', message: 'React warning or error', label: 'React Warning/Error' });
    }
    return originalError.apply(this, args);
  };

  const originalWarn = console.warn;
  console.warn = function (...args) {
    if (args.some(arg => typeof arg === 'string' && /TypeError|deprecated|\bTS\d{3,}\b/.test(arg))) {
      emit('ts_error', { severity: 'warning', message: 'Runtime or deprecation warning', label: 'Runtime Warning' });
    }
    return originalWarn.apply(this, args);
  };

  if (window.PerformanceObserver) {
    try {
      const po = new PerformanceObserver(list => {
        list.getEntries().forEach(entry => {
          if (entry.duration > 3000) {
            emit('network', {
              severity: 'warning', message: 'Slow resource',
              source: safeUrl(entry.name), label: 'Slow Asset',
            });
          }
        });
      });
      po.observe({ entryTypes: ['resource'] });
    } catch (_) { /* Performance monitoring unavailable. */ }
  }

  function boot() {
    scanHTML();
    scanCSS();
    scanLinks();
    if (typeof MutationObserver !== 'undefined') {
      let scanTimer;
      const observer = new MutationObserver(() => {
        clearTimeout(scanTimer);
        scanTimer = setTimeout(() => { scanHTML(); scanLinks(); }, 2000);
      });
      observer.observe(document.body || document.documentElement, {
        childList: true, subtree: true,
      });
    }
    setInterval(scanCSS, 30000);
    emit('info', { severity: 'info', message: 'Monitor active', label: 'Monitor Started' });
    console.info('CorrectAI monitor active (sensitive diagnostic details excluded).');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
