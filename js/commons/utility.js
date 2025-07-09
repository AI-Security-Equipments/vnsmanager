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
  onKey: (el, handler) => el?.addEventListener('keydown', handler)
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
