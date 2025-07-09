// File: /js/net.js
//import { router } from '../pages.js';
const BASE_PATH = '/vnsmanager';

/**
 * Esegue una richiesta POST con gestione centralizzata di loading, errori e callback opzionale.
 * @param {string} url - Endpoint da chiamare (relativo a BASE_PATH).
 * @param {object} data - Dati da inviare in POST.
 * @param {function} [onDone] - Callback opzionale da eseguire dopo loading.
 * @param {boolean} [showLoading=true] - Se false, non mostra il loading spinner.
 * @returns {Promise<object>} - Risposta JSON o oggetto con ok: false.
 */
export async function post(url, data, onDone = null, showLoading = true) {
//  if (showLoading) router.showLoading(true);

  try {
    const res = await fetchWithTimeout(BASE_PATH + url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(data)
    });

    const json = await res.json();

    if (!json.ok && json.error) {
//      router.showError(json.error);
      logEvent('error_response', { url, error: json.error });
    }

    if (json.forceLogout) {
      location.href = BASE_PATH + '/logout';
    }

    return json;
  } catch (err) {
//    router.showError(window.lang?.login_network_error || 'Errore di rete');
    logEvent('network_error', { url, message: err.message });
    return { ok: false, error: 'network' };
  } finally {
//    if (showLoading) router.showLoading(false);
    if (typeof onDone === 'function') onDone();
  }
}

/**
 * Esegue un fetch con timeout automatico.
 * @param {string} resource
 * @param {object} options
 * @param {number} timeout
 */
async function fetchWithTimeout(resource, options = {}, timeout = 10000) {
  return Promise.race([
    fetch(resource, options),
    new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), timeout))
  ]);
}

/**
 * Esegue una funzione asincrona con retry automatico.
 * @param {Function} fn
 * @param {number} attempts
 * @param {number} delay
 */
export async function retry(fn, attempts = 3, delay = 500) {
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (e) {
      if (i < attempts - 1) await new Promise(r => setTimeout(r, delay));
    }
  }
  throw new Error('Tutti i tentativi falliti');
}

/**
 * Invia un log lato client a ws_log.php
 * @param {string} action
 * @param {object} data
 */
export function logEvent(action, data = {}) {
  const payload = {
    ts: Date.now(),
    action,
    data
  };
  navigator.sendBeacon(BASE_PATH + '/ws/ws_log.php', JSON.stringify(payload));
}