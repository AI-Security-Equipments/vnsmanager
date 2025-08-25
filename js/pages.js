// File: /js/pages.js

const BASE_PATH = '/vnsmanager';
export const messages = [];

export const router = {
  container: document.getElementById('app-main'),
  loading: document.getElementById('loading'),
  lang: window.lang || {},
  langLoaded: false,
  errorBox: null,
  attemptsBox: document.querySelector('.attempts-box'),
  currentPage: null,
  routeSeq: 0,
  pageCtrl: null,
  assetsCtrl: null,

  async init() {
    await this.loadLang();
    this.initSidebarToggle();
    window.addEventListener('hashchange', () => this.route());
    this.route();
  },

  async loadLang() {
    if (this.langLoaded || Object.keys(this.lang).length > 0) return;
    const lang = (navigator.language || 'en').slice(0, 2) || 'en';
    try {
      const res = await fetch(BASE_PATH + '/ws/ws_lang.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'lang=' + encodeURIComponent(lang)
      });
      this.lang = await res.json();
      this.langLoaded = true;
      window.lang = this.lang;
    } catch (e) {
      messages.push('Errore nel caricamento lingua: ' + e.message);
      this.lang = {};
    }
  },

  initSidebarToggle() {
    const key = 'vns.sidebar';
    const root = document.body;

    const apply = () => {
      if (localStorage.getItem(key) === '1') root.classList.add('sidebar-collapsed');
      else root.classList.remove('sidebar-collapsed');
    };
    apply();

    const bind = (btn) => {
      if (!btn || btn.dataset.bound === '1') return;
      btn.dataset.bound = '1';
      btn.addEventListener('click', () => {
        root.classList.toggle('sidebar-collapsed');
        localStorage.setItem(key, root.classList.contains('sidebar-collapsed') ? '1' : '0');
      });
    };

    const btnNow = document.querySelector('[data-role="sidebar-toggle"]');
    if (btnNow) { bind(btnNow); return; }

    // fallback: se il bottone appare dopo
    const mo = new MutationObserver((muts, obs) => {
      const btn = document.querySelector('[data-role="sidebar-toggle"]');
      if (btn) { bind(btn); obs.disconnect(); }
    });
    mo.observe(document.documentElement, { childList: true, subtree: true });
  },

  async route() {
    // aborta eventuali fetch/HEAD in corso
    try { this.pageCtrl?.abort(); } catch { }
    try { this.assetsCtrl?.abort(); } catch { }

    const seq = ++this.routeSeq;
    this.pageCtrl = new AbortController();
    this.assetsCtrl = new AbortController();

    const hash = location.hash.slice(1).replace(/^\/+/g, '').replace(/\/+$/g, '');
    let folder, file;

    if (!hash) {
      const isPgShell = /(^|\/)pg\.html$/.test(location.pathname);
      if (isPgShell) {
        folder = 'pg';
        file = 'pg';
      } else {
        folder = 'login';
        file = 'login';
      }
    } else {
      const parts = hash.split('/').filter(Boolean);
      folder = parts[0];
      file = parts[1] || parts[0];
    }
    const safe = (s) => (s || '').toLowerCase().replace(/[^a-z0-9_-]/g, '');
    folder = safe(folder);
    file = safe(file);

    // base paths
    const load_path = `tmpl/${folder}/${file}`;
    const htmlPath = `${load_path}.html`;

    const pageKey = (hash ? (file === folder ? folder : `${folder}/${file}`) : file);

    const ts = Date.now();
    await this.loadAssets(load_path, ts, this.assetsCtrl.signal, seq);
    await this.loadPage(htmlPath, pageKey, ts, this.pageCtrl.signal, seq);
  },

  async loadAssets(load_path, ts, signal, seq) {
    const hostCss = `assets/css/${location.hostname.replace(/[^a-z0-9]/gi, '').toLowerCase()}.css`;
    await Promise.allSettled([
      this.checkAndLoad(`${load_path}.css`, (u) => this.loadCSS(u, ts, signal, seq), signal, seq),
    ]);
  },

  async checkAndLoad(url, loader, signal, seq) {
    try {
      if (signal?.aborted) return false;
      // path relativo a BASE_PATH per il server-side check
      let rel = url.startsWith(BASE_PATH) ? url.slice(BASE_PATH.length) : url;
      rel = rel.replace(/^\/+/, '');
      const res = await fetch(`${BASE_PATH}/ws/check.php?f=${encodeURIComponent(rel)}`, { signal });
      const ok = (await res.text()).trim() === '1';
      if (signal?.aborted || seq !== this.routeSeq) return false;
      if (!ok) return false;
      return loader(url);
    } catch { return false; }
  },

  async loadJS(src, ts, signal, seq) {
    try {
      if (signal?.aborted || seq !== this.routeSeq) return false;
      return new Promise((resolve) => {
        const script = document.createElement('script');
        script.src = this.ver(src, ts);
        script.type = 'module'; // ESM only
        script.setAttribute('data-router', 'dynamic');
        script.onload = () => resolve(true);
        script.onerror = () => { script.remove(); resolve(false); };
        document.head.appendChild(script);
      });
    } catch (e) { return false; }
  },

  async loadCSS(href, ts, signal, seq) {
    try {
      debugger;
      if (signal?.aborted || seq !== this.routeSeq) return false;
      return new Promise((resolve) => {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = this.ver(href, ts);
        link.setAttribute('data-router', 'dynamic');
        link.onload = () => resolve(true);
        link.onerror = () => { messages.push('CSS mancante: ' + href); link.remove(); resolve(false); };
        document.head.appendChild(link);
      });
    } catch (e) { return false; }
  },

  async runPageInit(pageKey, ts, seq) {
    try {
      const jsPath = `tmpl/${pageKey}.js`;
      const exists = await this.checkAndLoad(jsPath, async () => true, this.assetsCtrl.signal, seq);
      if (!exists || seq !== this.routeSeq) return;
      const mod = await import(this.ver(jsPath, ts));
      if (typeof mod.init === 'function') await mod.init();
    } catch {}
  },

  async loadPage(path, pageKey, ts, signal, seq) {
    this.showLoading(true);
    this.cleanup();
    try {
      const res = await fetch(path, { signal });
      if (!res.ok) throw new Error('Not found');
      const html = await res.text();
      if (seq !== this.routeSeq) return; // route cambiata, esco
      const translated = this.applyTranslations(html);
      this.container.innerHTML = translated;

      await this.runPageInit(pageKey, ts, seq);

      if (this.postLoad[pageKey]) this.postLoad[pageKey]();
      this.currentPage = pageKey;
    } catch (err) {
      if (err?.name === 'AbortError') return;
      try {
        const fallback = await fetch(`${BASE_PATH}/tmpl/error/404.html`, { signal });
        const html = this.applyTranslations(await fallback.text());
        if (seq !== this.routeSeq) return;
        this.container.innerHTML = html;
      } catch {
        if (seq !== this.routeSeq) return;
        this.container.innerHTML = '<h1>404 - Pagina non trovata</h1>';
      }
    } finally {
      if (seq === this.routeSeq) this.showLoading(false);
    }
  },

  cleanup() {
    if (this.unload[this.currentPage]) {
      try { this.unload[this.currentPage](); }
      catch (e) { messages.push('Errore in unload: ' + e.message); }
    }

    // rimuovi asset dinamici
    document.querySelectorAll('[data-router="dynamic"]').forEach(el => el.remove());

    // reset contenitore (rimuove listeners collegati al vecchio nodo)    
    const next = this.container.cloneNode(false);
    this.container.replaceWith(next);
    this.container = next;
  },

  applyTranslations(html) {
    return html.replace(/\{([^}]+)\}/g, (_, key) => this.lang[key] ?? `{${key}}`);
  },

  showLoading(show) {
    if (this.loading) this.loading.style.display = show ? 'block' : 'none';
  },

  showError(msg) {
    try {
      const box = document.getElementById('toast-container');
      if (!box) return;
      const el = document.createElement('div');
      el.className = 'toast text-bg-danger border-0';
      el.setAttribute('role', 'alert');
      el.setAttribute('aria-live', 'assertive');
      el.setAttribute('aria-atomic', 'true');
      el.innerHTML = `
        <div class="d-flex">
          <div class="toast-body"><i class="fa-solid fa-triangle-exclamation me-2"></i>${msg}</div>
          <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>`;
      box.appendChild(el);
      if (window.bootstrap?.Toast) new bootstrap.Toast(el, { autohide: true, delay: 5000 }).show();
    } catch (e) { messages.push('Toast error: ' + e.message); }
  },

  updateAttempts(n) {
    if (this.attemptsBox) {
      const label = this.lang['login_attempts_left'] ?? 'Tentativi rimasti';
      this.attemptsBox.textContent = `${label}: ${n}`;
    }
  },

  normalizeUrl(url) {
    if (/^https?:\/\//i.test(url) || url.startsWith('/')) return url;
    const base = BASE_PATH.replace(/\/$/, '');
    return `${base}/${url.replace(/^\//, '')}`;
  },

  ver(url, ts) {
    try {
      const abs = this.normalizeUrl(url);
      const u = new URL(abs, location.origin);
      u.searchParams.set('v', String(ts));
      return u.pathname + (u.search ? u.search : '');
    } catch {
      const abs = this.normalizeUrl(url);
      return abs + (abs.includes('?') ? '&' : '?') + 'v=' + ts;
    }
  },
  
  postLoad: {
    'login': () => {
      const form = document.querySelector('form');
      if (!form) return;
      form.addEventListener('submit', async e => {
        e.preventDefault();
        const data = { username: form.user?.value?.trim() || '', password: form.pass?.value || '' };
        router.showLoading(true);
        try {
          const res = await fetch(BASE_PATH + '/ws/ws_login.php', { method: 'POST', body: new URLSearchParams(data) });
          const json = await res.json();
          router.showLoading(false);
          if (json.ok) {
            if (json.step === '2fa') {
              location.hash = '#/2fa';
            } else {
              messages.push('Step login non gestito: ' + JSON.stringify(json));
            }
          } else {
            router.showError(json.error || 'Errore');
            router.updateAttempts(json.attempts ?? '?');
          }
        } catch (err) {
          router.showLoading(false);
          router.showError('Errore di rete');
          messages.push('Errore rete: ' + err.message);
        }
      });
    }
  },

  unload: {}
};

window.addEventListener('DOMContentLoaded', () => router.init());
