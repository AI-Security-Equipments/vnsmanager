// File: /js/pages.js

const BASE_PATH = '/vnsmanager';
export const messages = [];

export const router = {
  container: document.querySelector('.container'),
  loading: document.getElementById('loading'),
  lang: window.lang || {},
  langLoaded: false,
  errorBox: document.querySelector('.error'),
  attemptsBox: document.querySelector('.attempts-box'),
  currentPage: null,

  async init() {
    await this.loadLang();
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

  async route() {
    const hash = location.hash.slice(1).replace(/^\/+/g, '').replace(/\/+$/g, '');
    const parts = hash.split('/').filter(Boolean);
    const pageKey = parts.join('/') || 'login';
    const path = `${BASE_PATH}/tmpl/${pageKey}/index.html`;

    await this.loadAssets(pageKey);
    await this.loadPage(path, pageKey);
  },

  async loadAssets(pageKey) {
    await Promise.allSettled([
      this.loadJS(`${BASE_PATH}/js/${pageKey}.js`),
      this.loadCSS(`${BASE_PATH}/css/${pageKey}.css`)
    ]);
  },

  async loadJS(src) {
    try {
      const res = await fetch(src, { method: 'HEAD' });
      if (!res.ok) {
        return;
      }
      const script = document.createElement('script');
      script.src = `${src}?v=${Date.now()}`;
      script.type = 'module';
      script.setAttribute('data-router', 'dynamic');
      document.head.appendChild(script);
    } catch (e) {
      return
    }
  },

  async loadCSS(href) {
    try {
      return new Promise(resolve => {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = `${href}?v=${Date.now()}`;
        link.setAttribute('data-router', 'dynamic');
        link.onload = () => resolve();
        link.onerror = () => {
          messages.push('CSS mancante: ' + href);
          link.remove();
          resolve();
        };
        document.head.appendChild(link);
      });
    } catch (e) {
      return
    }
  },

  async loadPage(path, pageKey) {
    this.showLoading(true);
    this.cleanup();
    try {
      const res = await fetch(path);
      if (!res.ok) throw new Error('Not found');
      const html = await res.text();
      const translated = this.applyTranslations(html);
      this.container.innerHTML = translated;
      if (this.postLoad[pageKey]) this.postLoad[pageKey]();
      this.currentPage = pageKey;
    } catch (err) {
      try {
        const fallback = await fetch(`${BASE_PATH}/tmpl/error/404.html`);
        const html = this.applyTranslations(await fallback.text());
        this.container.innerHTML = html;
      } catch {
        this.container.innerHTML = '<h1>404 - Pagina non trovata</h1>';
      }
    } finally {
      this.showLoading(false);
    }
  },

  cleanup() {
    if (this.unload[this.currentPage]) {
      try {
        this.unload[this.currentPage]();
      } catch (e) {
        messages.push('Errore in unload: ' + e.message);
      }
    }
    document.querySelectorAll('[data-router="dynamic"]').forEach(el => el.remove());
    this.container.replaceWith(this.container.cloneNode(false));
    this.container = document.querySelector('.container');
  },

  applyTranslations(html) {
    return html.replace(/\{([^}]+)\}/g, (_, key) => this.lang[key] ?? `{${key}}`);
  },

  showLoading(show) {
    if (this.loading) this.loading.style.display = show ? 'block' : 'none';
  },

  showError(msg) {
    if (this.errorBox) {
      this.errorBox.classList.remove('d-none');
      this.errorBox.textContent = msg;
    }
  },

  updateAttempts(n) {
    if (this.attemptsBox) {
      const label = this.lang['login_attempts_left'] ?? 'Tentativi rimasti';
      this.attemptsBox.textContent = `${label}: ${n}`;
    }
  },

  postLoad: {
    'login': () => {
      const form = document.querySelector('form');
      if (form) {
        form.addEventListener('submit', async e => {
          e.preventDefault();
          const data = {
            username: form.user.value.trim(),
            password: form.pass.value
          };
          router.showLoading(true);
          try {
            const res = await fetch(BASE_PATH + '/ws/ws_login.php', {
              method: 'POST',
              body: new URLSearchParams(data)
            });
            const json = await res.json();
            router.showLoading(false);
            if (json.ok) {
              if (json.step === '2fa') {
                location.hash = '#/2fa';
              } else {
                messages.push('Step login non gestito: ' + JSON.stringify(json));
              }
            } else {
              router.showError(json.error);
              router.updateAttempts(json.attempts ?? '?');
            }
          } catch (err) {
            router.showLoading(false);
            router.showError('Errore di rete');
            messages.push('Errore rete: ' + err.message);
          }
        });
      }
    }
  },

  unload: {}
};

window.addEventListener('DOMContentLoaded', () => router.init());
