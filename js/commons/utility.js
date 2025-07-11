// File: commons/utility.js

export const u = {
  gI: (id, ctx = document) => ctx.getElementById(id),
  q: (sel, ctx = document) => ctx.querySelector(sel),
  qAll: (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel)),
  cE: (tag, props = {}) => {
    const e = document.createElement(tag);
    for (const [k, v] of Object.entries(props)) {
      if (k === 'class') e.className = v;
      else if (k === 'text') e.textContent = v;
      else if (k === 'html') e.innerHTML = v;
      else e.setAttribute(k, v);
    }
    return e;
  },

  // Event handling
  on: (el, events, handler) => {
    if (!el) return;
    (Array.isArray(events) ? events : [events])
      .forEach(ev => el.addEventListener(ev, handler));
  },

  // Shortcut methods
  onC: (el, handler) => el?.addEventListener('click', handler),
  onDbl: (el, handler) => el?.addEventListener('dblclick', handler),
  onOver: (el, handler) => el?.addEventListener('mouseover', handler),
  onOut: (el, handler) => el?.addEventListener('mouseout', handler),
  onKey: (el, handler) => el?.addEventListener('keydown', handler),

  off: (el, events, handler) => {
    if (!el) return;
    (Array.isArray(events) ? events : [events])
      .forEach(ev => el.removeEventListener(ev, handler));
  },
  offAll: (el, events, handlers) => {
    events.forEach((ev, i) => el?.removeEventListener(ev, handlers[i]));
  }
};

export const store = {
  get: (key, fallback = null) => {
    try {
      const v = localStorage.getItem(key);
      return v ? JSON.parse(v) : fallback;
    } catch (e) {
      return fallback;
    }
  },
  set: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn('localStorage error:', e);
    }
  },
  remove: key => localStorage.removeItem(key)
};

// toaster + coda
export const toast = {
  activeToasts: new Set(),
  show: (message, type = 'info', options = {}) => {
    // Chiudi tutti i toast esistenti
    toast.closeAll();
    const container = getOrCreateToastContainer();
    const toastId = `toast-${Date.now()}`;
    const autohide = options.autohide ?? (type !== 'error');
    const delay = type === 'error' ? 8000 : (options.delay || 1000);
    const toastEl = u.cE('div', {
      id: toastId,
      class: `toast align-items-center text-white bg-${type} border-0`,
      role: 'alert',
      'aria-live': 'assertive',
      'aria-atomic': 'true',
      html: `
                <div class="d-flex">
                    <div class="toast-body">
                        ${message}
                        ${options.subtext ? `<small class="d-block mt-1">${options.subtext}</small>` : ''}
                    </div>
                    <button type="button" class="btn-close btn-close-white me-2 m-auto" 
                            data-bs-dismiss="toast" aria-label="Close"></button>
                </div>
            `
    });

    container.appendChild(toastEl);
    toast.activeToasts.add(toastId);
    const bsToast = new bootstrap.Toast(toastEl, {
      autohide,
      delay
    });
    bsToast.show();
    toastEl.addEventListener('hidden.bs.toast', () => {
      toastEl.remove();
      toast.activeToasts.delete(toastId);
    });
    return toastId;
  },

  closeAll: () => {
    toast.activeToasts.forEach(id => {
      const toastEl = document.getElementById(id);
      if (toastEl) {
        bootstrap.Toast.getInstance(toastEl)?.hide();
      }
    });
    toast.activeToasts.clear();
  },

  // Shortcut methods
  success: (m, o) => toast.show(m, 'success', { ...o, autohide: true, delay: 1000 }),
  error: (m, o) => toast.show(m, 'danger', { ...o, autohide: false }),
  warning: (m, o) => toast.show(m, 'warning', { ...o, autohide: true, delay: 3000 }),
  info: (m, o) => toast.show(m, 'info', { ...o, autohide: true, delay: 2000 })
};

// Helper functions using 'u'
function getOrCreateToastContainer() {
  return u.gI('toast-container') || (() => {
    const container = u.cE('div', {
      id: 'toast-container',
      class: 'toast-container position-fixed top-0 end-0 p-3',
      style: 'z-index: 1100'
    });
    document.body.appendChild(container);
    return container;
  })();
}

function initToastBehavior(toastEl, options) {
  const bsToast = new bootstrap.Toast(toastEl, {
    autohide: options.autohide ?? true,
    delay: options.delay ?? 5000
  });
  bsToast.show();

  u.on(toastEl, 'hidden.bs.toast', () => toastEl.remove());
}

// Versione con coda (opzionale)
const toastQueue = [];
let isShowingToast = false;

toast.queue = (message, type = 'info', options = {}) => {
  toastQueue.push({ message, type, options });
  processQueue();
};

function processQueue() {
  if (!toastQueue.length || isShowingToast) return;

  isShowingToast = true;
  const { message, type, options } = toastQueue.shift();
  const toastId = toast.show(message, type, {
    ...options,
    autohide: true,
    delay: options.delay ?? 3000
  });

  u.on(u.gI(toastId), 'hidden.bs.toast', () => {
    isShowingToast = false;
    processQueue();
  });
}