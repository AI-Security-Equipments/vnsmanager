// File: /js/net.js
import {toast} from './utility.js'

const BASE_PATH = '/vnsmanager';
let activeRequests = 0;

/**
 * Esegue una richiesta POST con gestione centralizzata di loading, errori e callback opzionale.
 * @param {string} url - Endpoint da chiamare (relativo a BASE_PATH).
 * @param {object} data - Dati da inviare in POST.
 * @param {function} [onDone] - Callback opzionale da eseguire dopo loading.
 * @param {boolean} [showLoading=true] - Se false, non mostra il loading spinner.
 * @returns {Promise<object>} - Risposta JSON o oggetto con ok: false.
 */
export async function post(service, action, data = {}, onDone = null, showLoading = true) {
  let toastId;

  try {
    if (showLoading) {
      activeRequests++;
      if (activeRequests === 1) {
        toastId = toast.show(`
          <div class="d-flex align-items-center">
            <div class="spinner-border spinner-border-sm me-2" role="status">
              <span class="visually-hidden">Loading...</span>
            </div>
            Loading...
          </div>
        `, 'info', { autohide: false, delay: 30000 });
      }
    }

    const url = BASE_PATH + '/ws/';            // default page = ws.php
    const payload = { service, action, ...data };
    console.log('POST', url, payload);
    const res = await fetchWithTimeout(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(payload)
    });
    const json = await res.json();
    console.log('Response', json);
    if (!json.ok) {
      const errorMsg = json.error || 'Errore sconosciuto';
      toast.error(errorMsg, { delay: 8000 });
      logEvent('error_response', { service, action, error: errorMsg });
    }

    if (json.forceLogout) {
      toast.warning('Reindirizzamento al login...', { delay: 2000 });
      setTimeout(() => (location.href = BASE_PATH + '/logout'), 2000);
    }

    return json;
  } catch (err) {
    const errMsg = err.message.includes('Timeout')
      ? 'Timeout: il server non ha risposto'
      : 'Errore di rete';

    toast.error(errMsg, { subtext: 'Riprova più tardi', delay: 10000 });
    logEvent('network_error', { service, action, message: err.message });
    return { ok: false, error: 'network' };
  } finally {
    if (showLoading) {
      activeRequests--;
      if (activeRequests === 0 && toastId) {
        const toastEl = document.getElementById(toastId);
        if (toastEl) bootstrap.Toast.getInstance(toastEl)?.hide();
      }
    }
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
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const res = await fetch(resource, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return res;
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
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
      if (i < attempts - 1) {
        toast.warning(`Tentativo ${i+1} fallito, riprovo...`, {
          delay: 1500,
          autohide: true
        });
        await new Promise(r => setTimeout(r, delay));
      }
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
  try {
    const payload = {
      ts: Date.now(),
      action,
      data
    };
    //navigator.sendBeacon('log', '', JSON.stringify(payload));
  } catch (e) {
    console.error('Logging failed:', e);
  }
}