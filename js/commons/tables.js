// File: /js/commons/tables.js
import { u } from '../../js/commons/utility.js';
import { TabulatorFull as Tabulator } from 'https://unpkg.com/tabulator-tables@6.3.1/dist/js/tabulator_esm.min.mjs';
import jsPDF from "https://cdn.jsdelivr.net/npm/jspdf@2.5.1/+esm";
import "https://cdn.jsdelivr.net/npm/jspdf-autotable@3.8.0/+esm";
import * as XLSX from "https://cdn.jsdelivr.net/npm/xlsx@0.18.5/+esm";

window.XLSX = XLSX;
window.jspdf = { jsPDF };
const debounce = (fn, ms = 250) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };
const tables = new WeakMap();
const _dataStore = new Map();
let reloadFn = null;

export function getVnsTable(mount) {
  const root = (typeof mount === 'string') ? document.querySelector(mount) : mount;
  return tables.get(root);
}

export function registerReload(fn) {
  reloadFn = fn;
}
export function reloadTables() {
  if (reloadFn) reloadFn();
}

function buildToolbar(mount) {
  const el = u.cE('div', { class: 'vns-toolbar d-flex flex-wrap gap-2 justify-content-between align-items-center' });
  el.innerHTML = `
    <div class="d-flex align-items-center gap-2 flex-grow-1" style="min-width:260px;max-width:520px">
      <div class="input-group input-group-sm">
        <span class="input-group-text"><i class="fa-solid fa-magnifying-glass"></i></span>
        <input type="search" class="form-control" placeholder="Cerca…" id="vns-search-${mount}" />
      </div>
    </div>
    <div class="btn-group" data-mount="${mount}">
      <button class="btn btn-primary btn-sm paginationSwitch" title="Show/Hide pagination"><i class="fa-regular fa-square-caret-down"></i></button>
      <button class="btn btn-primary btn-sm filtersSwitch" title="Show/Hide filters"><i class="fa-solid fa-filter"></i></button>
      <button class="btn btn-primary btn-sm refresh" title="Refresh"><i class="fa-solid fa-rotate-right"></i></button>
      <button class="btn btn-primary btn-sm fullscreen" title="Fullscreen"><i class="fa-solid fa-up-right-and-down-left-from-center"></i></button>
      <div class="btn-group dropdown">
        <button type="button" class="btn btn-primary btn-sm dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false" title="Columns">
          <i class="fa-solid fa-list"></i>
        </button>
        <div class="dropdown-menu dropdown-menu-end p-2" style="min-width:220px">
          <label class="dropdown-item d-flex align-items-center gap-2">
            <input type="checkbox" class="form-check-input toggle-all" checked />
            <span>Toggle all</span>
          </label>
          <div class="dropdown-divider"></div>
          <div class="vns-columns"></div>
        </div>
      </div>
      <div class="btn-group dropdown">
        <button type="button" class="btn btn-primary btn-sm dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false" title="Export">
          <i class="fa-solid fa-download"></i>
        </button>
        <div class="dropdown-menu dropdown-menu-end">
          <a class="dropdown-item" href="#" data-type="csv">CSV</a>
          <a class="dropdown-item" href="#" data-type="json">JSON</a>
          <a class="dropdown-item" href="#" data-type="xlsx">Excel (.xlsx)</a>
          <a class="dropdown-item" href="#" data-type="pdf">PDF</a>
        </div>
      </div>
      <button class="btn btn-primary btn-sm print" name="print${mount}" title="Print"><i class="fa-solid fa-print"></i></button>
    </div>`;
  return el;
}

/**
 * Crea Tabulator minimal.
 * opts: { data, columns?, index='ip', layout='fitDataStretch', height='540px',
 *         pagination=true, paginationSize=25, initialSearch='', onRefresh? }
 */

const itDF = new Intl.DateTimeFormat('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' });
const isIPv4 = v => typeof v === "string" && /^\d{1,3}(\.\d{1,3}){3}$/.test(v.trim());
const isMAC = v => typeof v === "string" && /^([0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}$/.test(v.trim());

const toDate = s => {
  if (!s) return null;
  const m = String(s).match(/^(\d{4})-(\d{2})-(\d{2})[ T]?(\d{2})?:?(\d{2})?:?(\d{2})?/);
  return m ? new Date(+m[1], m[2] - 1, +m[3], +(m[4] || 0), +(m[5] || 0), +(m[6] || 0)) : null;
};

const sortDate = (a, b) => (a?.getTime?.() ?? -Infinity) - (b?.getTime?.() ?? -Infinity);

const toNumber = v => {
  if (v == null || v === '') return null;
  if (typeof v === 'number') return v;
  const s = String(v).trim().replace(/\./g, '').replace(',', '.');
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
};

function analyzeAndNormalize(data, { dateHint = [], numberHint = [], neverNumber = [] } = {}) {
  const rows = data || [];
  const keys = Object.keys(rows[0] || {});
  const dateFields = new Set(dateHint);
  const numberFields = new Set(numberHint.filter(k => !neverNumber.includes(k)));
  const normalized = rows.map(r => {
    const o = { ...r };
    for (const k of dateFields) if (o[k] != null) o[k] = toDate(o[k]);
    for (const k of numberFields) if (o[k] != null) o[k] = toNumber(o[k]);
    return o;
  });
  return { normalized, dateFields, numberFields, keys };
}

// === header menu: toggle visibilità colonne ===
function headerMenu() {
  const menu = [];
  const columns = this.getColumns(); // 'this' = table
  for (const col of columns) {
    const def = col.getDefinition();
    // label
    const icon = document.createElement("i");
    icon.classList.add("fas", col.isVisible() ? "fa-check-square" : "fa-square");
    const title = document.createElement("span"); title.textContent = " " + (def.title ?? def.field);
    const label = document.createElement("span"); label.append(icon, title);
    menu.push({
      label, action: (e) => {
        e.stopPropagation(); col.toggle();
        icon.classList.toggle("fa-check-square", col.isVisible());
        icon.classList.toggle("fa-square", !col.isVisible());
      }
    });
  }
  return menu;
}

function ipFormatter(cell) {
  const ip = cell.getValue();
  if (!ip) return "";
  const parts = ip.split(".");
  const last = parts.pop();
  return `${parts.join(".")}.<span class="ip_ev">${last}</span>`;
}

// === colonne fisse ===
const COLUMNS = [
  { title: "", field: "status", width: 90, headerFilter: false, hozAlign: "center" },
  { title: "type", field: "type", width: 100, headerFilter: true, editor: "input" },
  { title: "ip", field: "ip", width: 140, headerFilter: true, headerSort: true, formatter: ipFormatter },
  { title: "mac", field: "mac", width: 170, headerFilter: true, formatter: (c) => `<code>${c.getValue() || ""}</code>` },
  { title: "hostname", field: "hostname", headerFilter: true },
  { title: "alias", field: "alias", headerFilter: true, editor: "input" },
  { title: "vendor", field: "vendor", headerFilter: true },
  { title: "so", field: "so", headerFilter: true },
  { title: "sw", field: "sw", headerFilter: true },
  { title: "last_check", field: "Last Check", sorter: sortDate, mutator: (v) => toDate(v), formatter: (c) => { const d = c.getValue(); return d ? itDF.format(d) : ""; }, width: 170, headerSort: true },
  { title: "user", field: "username", width: 120, headerFilter: true, editor: "input" },
  { title: "password", field: "password", width: 140, headerFilter: true, editor: "input" },
  { title: "web_conn", field: "web_conn", width: 110, hozAlign: "center", formatter: (c) => c.getValue() === 'Y' || c.getValue() === true ? "✔︎" : "" }
];

export async function createVnsTable(mount, opts = {}) {
  let lastQ = "";
  const bar = (typeof mount === 'string') ? u.gI('vns-' + mount) : null;
  const tableEl = (typeof mount === 'string') ? u.gI(mount) : mount;
  if (!tableEl) throw new Error('Mount/Wrapper element not found');
  if (bar) bar.replaceChildren(buildToolbar(mount));
  document.querySelectorAll('[data-bs-toggle="dropdown"]').forEach(el => {
    bootstrap.Dropdown.getOrCreateInstance(el);
  });

  const {
    data = [],                       // <— QUI prendiamo data da opts
    paginationSize = 25,
    dateFields: hintDates = [],     // opzionali
    numberFields: hintNums = [],
  } = opts;

  const { normalized, dateFields, numberFields, keys } = analyzeAndNormalize(data, { dateHint: hintDates, numberHint: hintNums, neverNumber: ["ip", "mac"] });

  const persistKey = `tabulator:${mount}:pagination`;
  let paginationOn = 'true';
  let savedSize = paginationSize;

  const table = new Tabulator(tableEl, {
    data: normalized,
    columns: COLUMNS,
    layout: "fitColumns",
    persistenceID: mount,
    resizableColumnFit: true,
    pagination: 'local',
    paginationSize: 5,
    cellEdited: (cell) => {
      const row = cell.getRow().getData();
      const field = cell.getField();
      const value = cell.getValue();
    },
    columnDefaults: {
      headerFilterPlaceholder: "Filtra…"
    },
    rowFormatter(row) {
      const q = lastQ;
      row.getCells().forEach(cell => {
        const el = cell.getElement();
        const hit = q && String(cell.getValue() ?? "").toLowerCase().includes(q);
        el.classList.toggle("has-hit", !!hit);
      });
    },
  });

  // === integrazione switch pagination ===
  const getTableByMount = (mount) => getVnsTable('#' + mount);
  let filtersOn = 'false';

  table.on("tableBuilt", () => {
    table.element
      .querySelectorAll(".tabulator-header-filter")
      .forEach(el => el.classList.add("vns-hidden"));
  });

  bar.addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;

    // trova mount dal gruppo
    const group = btn.closest('[data-mount]');
    if (!group) return;
    const mount = group.dataset.mount;
    const table = getTableByMount(mount);
    if (!table) return;

    // icona (se presente)
    const icon = btn.querySelector('i');

    // stato persistente per-istanza
    const pagKey = `tabulator:${mount}:pagination`;
    const filtKey = `tabulator:${mount}:filters`;

    // --- PAGINATION TOGGLE ---
    if (btn.classList.contains('paginationSwitch')) {
      const footer = table.element.querySelector('.tabulator-footer');
      if (!!paginationOn) {
        const saved = table.getPageSize();
        btn.dataset.savedSize = String(saved || 25);
        table.setPageSize(1000000);
        table.setPage(1);
        if (footer) footer.classList.add('vns-hidden');
        icon?.classList.remove('fa-square-caret-down');
        icon?.classList.add('fa-square-caret-up');
      } else {
        const restored = Number(btn.dataset.savedSize || 25);
        table.setPageSize(restored);
        table.setPage(1);
        if (footer) footer.classList.remove('vns-hidden');
        icon?.classList.add('fa-square-caret-down');
        icon?.classList.remove('fa-square-caret-up');
      }
      paginationOn = !paginationOn;
      return;
    }

    // --- FILTERS TOGGLE (nasconde/mostra i header filter con una classe CSS) ---
    if (btn.classList.contains('filtersSwitch')) {
      const filters = table.element.querySelectorAll('.tabulator-header-filter');
      if (!!filtersOn) {
        filters.forEach(el => el.classList.remove('vns-hidden'));
        icon.classList.remove('fa-filter');
        icon.classList.add('fa-filter-circle-xmark');
      } else {
        filters.forEach(el => el.classList.add('vns-hidden'));
        icon.classList.remove('fa-filter-circle-xmark');
        icon.classList.add('fa-filter');
      }
      filtersOn = !filtersOn;
      return;
    }

    // --- REFRESH (decidi tu cosa fare: evento custom) ---
    if (btn.classList.contains('refresh')) {
      reloadTables();
      return;
    }

    // --- FULLSCREEN TOGGLE ---
    if (btn.classList.contains('fullscreen')) {
      const host = table.element; // contenitore tabulator
      if (!document.fullscreenElement) {
        host.requestFullscreen?.();
      } else {
        document.exitFullscreen?.();
      }
      return;
    }

    // --- PRINT ---
    if (btn.classList.contains('print')) {
      table.print(false, true); // pageBreaks=false, activeRowsOnly=true
      return;
    }

    // --- EXPORT (link nel dropdown) ---
    if (btn.matches('.dropdown-menu a[data-type]')) {
      e.preventDefault();
      const type = btn.dataset.type; // csv|json|xlsx|pdf
      const filename = `${mount}.${type === 'xlsx' ? 'xlsx' : type}`;
      if (type === 'csv') table.download('csv', filename);
      if (type === 'json') table.download('json', filename);
      if (type === 'xlsx') table.download('xlsx', filename, { sheetName: mount });
      if (type === 'pdf') table.download('pdf', filename, { autoTable: { styles: { fontSize: 8 } } });
      return;
    }
  });

  // === integrazione ricerca globale ===
  const searchEl = document.querySelector('#vns-search-' + mount);
  if (searchEl) {
    let lastQ = "";
    const apply = () => {
      u.qAll('.has-hit').forEach(el => el.classList.remove('has-hit'));
      const q = searchEl.value.trim().toLowerCase();
      table.setPage(1);
      if (!q) { table.clearFilter(true); return; }
      table.setFilter((data) => Object.values(data).some(v => String(v ?? '').toLowerCase().includes(q)));
      highlightCells(q);
    };
    const highlightCells = (q) => {
      const ql = (q || "").toLowerCase();
      table.getRows().forEach(row => {
        row.getCells().forEach(cell => {
          const el = cell.getElement();
          if (!ql) {
            highlightCells('');
            return;
          }
          const v = cell.getValue();
          if (v != null && String(v).toLowerCase().includes(ql)) {
            el.classList.add('has-hit');
          }
        });
      });
    };
    searchEl.addEventListener('input', apply);
  }
  tables.set(tableEl, table);
  return table;
}