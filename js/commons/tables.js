// File: /js/commons/tables.js
import { u } from '../../js/commons/utility.js';
import { TabulatorFull as Tabulator } from 'https://unpkg.com/tabulator-tables@6.3.1/dist/js/tabulator_esm.min.mjs';

import { TabulatorFull as Tabulator } from 'https://unpkg.com/tabulator-tables@6.3.1/dist/js/tabulator_esm.min.mjs';
import { u } from '/js/commons/u.js'; // la tua utility

const debounce = (fn, ms = 250) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };

function buildToolbar() {
  const el = u.cE('div', { class: 'vns-toolbar d-flex flex-wrap gap-2 justify-content-between align-items-center' });
  el.innerHTML = `
    <div class="d-flex align-items-center gap-2 flex-grow-1" style="min-width:260px;max-width:520px">
      <div class="input-group input-group-sm">
        <span class="input-group-text"><i class="fa-solid fa-magnifying-glass"></i></span>
        <input type="search" class="form-control" placeholder="Cerca…" />
      </div>
    </div>
    <div class="btn-group">
      <button class="btn btn-secondary btn-sm" name="paginationSwitch" title="Show/Hide pagination"><i class="fa-regular fa-square-caret-down"></i></button>
      <button class="btn btn-secondary btn-sm" name="refresh" title="Refresh"><i class="fa-solid fa-rotate-right"></i></button>
      <button class="btn btn-secondary btn-sm" name="fullscreen" title="Fullscreen"><i class="fa-solid fa-up-right-and-down-left-from-center"></i></button>

      <div class="btn-group">
        <button class="btn btn-secondary btn-sm dropdown-toggle" data-bs-toggle="dropdown" title="Columns"><i class="fa-solid fa-list"></i></button>
        <div class="dropdown-menu dropdown-menu-end p-2" style="min-width:220px">
          <label class="dropdown-item d-flex align-items-center gap-2">
            <input type="checkbox" class="form-check-input toggle-all" checked />
            <span>Toggle all</span>
          </label>
          <div class="dropdown-divider"></div>
          <div class="vns-columns"></div>
        </div>
      </div>

      <div class="btn-group">
        <button class="btn btn-secondary btn-sm dropdown-toggle" data-bs-toggle="dropdown" title="Export"><i class="fa-solid fa-download"></i></button>
        <div class="dropdown-menu dropdown-menu-end">
          <a class="dropdown-item" href="#" data-type="csv">CSV</a>
          <a class="dropdown-item" href="#" data-type="json">JSON</a>
          <a class="dropdown-item" href="#" data-type="xlsx">Excel (.xlsx)</a>
          <a class="dropdown-item" href="#" data-type="pdf">PDF</a>
        </div>
      </div>

      <button class="btn btn-secondary btn-sm" name="print" title="Print"><i class="fa-solid fa-print"></i></button>
    </div>`;
  return el;
}

/**
 * Crea una Tabulator con toolbar.
 * @param {HTMLElement|string} mount - contenitore dove creare la tabella
 * @param {Object} opts
 *    data, columns?, ajaxURL?, height?, pagination?, paginationSize?, persistenceID?, autoColumns?,
 *    initialSearch?, titleTarget? (css selector), titleHtml? (string)
 */
export async function createVnsTable(mount, opts = {}) {
  const root = (typeof mount === 'string') ? u.q(mount) : mount;
  if (!root) throw new Error('Mount element not found');

  // set titolo card se richiesto
  if (opts.titleTarget && opts.titleHtml) {
    const tgt = u.q(opts.titleTarget);
    if (tgt) tgt.innerHTML = opts.titleHtml;
  }

  root.classList.add('vns-table');
  const toolbar = buildToolbar();
  const holder = u.cE('div', { class: 'vns-holder' });
  root.append(toolbar, holder);

  const {
    data = null, columns = undefined, ajaxURL = null, ajaxConfig = 'GET',
    index = 'id', layout = 'fitColumns', height = '540px',
    pagination = true, paginationSize = 25, persistenceID = (root.id || `vns-${Math.random().toString(36).slice(2)}`),
    responsive = true, initialSearch = '', autoColumns = true,
  } = opts;

  const table = new Tabulator(holder, {
    index, layout, height,
    data, ajaxURL, ajaxConfig,
    columns, autoColumns,
    responsiveLayout: responsive ? 'collapse' : false,
    responsiveLayoutCollapseStartOpen: false,
    pagination: pagination ? 'local' : false,
    paginationSize,
    paginationSizeSelector: [10, 25, 50, 100],
    headerFilterPlaceholder: 'Filtra…',
    persistence: { columns: true, sort: true, filter: true, group: true, page: true },
    persistenceID,
    locale: true,
    rowContextMenu: rowMenu,
    printAsHtml: false,
    movableRows: true,
    rowFormatter: function (row) {
      var element = row.getElement(),
        data = row.getData(),
        width = element.offsetWidth,
        rowTable, cellContents;
      while (element.firstChild) element.removeChild(element.firstChild);
      rowTable = document.createElement("table")
      rowTable.style.width = (width - 18) + "px";
      rowTabletr = document.createElement("tr");
      cellContents = "<td><img src='/sample_data/row_formatter/" + data.image + "'></td>";
      cellContents += "<td><div><strong>Type:</strong> " + data.type + "</div><div><strong>Age:</strong> " + data.age + "</div><div><strong>Rind:</strong> " + data.rind + "</div><div><strong>Colour:</strong> " + data.color + "</div></td>"
      rowTabletr.innerHTML = cellContents;
      rowTable.appendChild(rowTabletr);
      element.append(rowTable);
    },
  });

  if (ajaxURL && !data) table.replaceData();

  const headerMenu = function () {
    var menu = [];
    var columns = this.getColumns();

    for (let column of columns) {

      //create checkbox element using font awesome icons
      let icon = document.createElement("i");
      icon.classList.add("fas");
      icon.classList.add(column.isVisible() ? "fa-check-square" : "fa-square");

      //build label
      let label = document.createElement("span");
      let title = document.createElement("span");

      title.textContent = " " + column.getDefinition().title;

      label.appendChild(icon);
      label.appendChild(title);

      //create menu item
      menu.push({
        label: label,
        action: function (e) {
          //prevent menu closing
          e.stopPropagation();

          //toggle current column visibility
          column.toggle();

          //change menu item icon
          if (column.isVisible()) {
            icon.classList.remove("fa-square");
            icon.classList.add("fa-check-square");
          } else {
            icon.classList.remove("fa-check-square");
            icon.classList.add("fa-square");
          }
        }
      });
    }
    return menu;
  };

  // search globale
  const doSearch = debounce(q => {
    if (!q) { table.clearFilter(true); return; }
    table.setFilter(row => JSON.stringify(row).toLowerCase().includes(q.toLowerCase()));
  }, 200);
  const inp = u.q('input[type="search"]', toolbar);
  if (initialSearch) { inp.value = initialSearch; doSearch(initialSearch); }
  u.on(inp, 'input', e => doSearch(e.target.value));

  // pagination toggle
  const btnPag = u.q('button[name="paginationSwitch"]', toolbar);
  u.onC(btnPag, () => {
    const active = table.options.pagination !== false;
    table.setOptions({ pagination: active ? false : 'local' });
    btnPag.classList.toggle('active', !active);
    btnPag.innerHTML = active
      ? '<i class="fa-regular fa-square-caret-right"></i>'
      : '<i class="fa-regular fa-square-caret-down"></i>';
  });

  // refresh
  u.onC(u.q('button[name="refresh"]', toolbar), () => {
    if (ajaxURL) table.replaceData(); else table.refreshData?.();
  });

  // fullscreen
  u.onC(u.q('button[name="fullscreen"]', toolbar), async () => {
    if (!document.fullscreenElement) await root.requestFullscreen?.();
    else await document.exitFullscreen?.();
  });

  // columns dropdown
  const colBox = u.q('.vns-columns', toolbar);
  const rebuildCols = () => {
    colBox.innerHTML = '';
    table.getColumns().forEach(col => {
      const def = col.getDefinition();
      if (!def.field) return;
      const lbl = u.cE('label', { class: 'dropdown-item d-flex align-items-center gap-2' });
      const chk = u.cE('input', { type: 'checkbox', class: 'form-check-input', ...(col.isVisible() ? { checked: '' } : {}) });
      const txt = u.cE('span', { text: def.title ?? def.field });
      u.onC(chk, e => e.stopPropagation());
      u.on(chk, 'change', e => e.target.checked ? col.show() : col.hide());
      lbl.append(chk, txt);
      colBox.appendChild(lbl);
    });
    const toggleAll = u.q('.toggle-all', toolbar);
    if (toggleAll) {
      u.on(toggleAll, 'change', () => {
        u.qAll('input[type="checkbox"]', colBox).forEach(i => {
          const label = i.parentElement?.querySelector('span')?.textContent?.trim();
          const col = table.getColumns().find(c => {
            const d = c.getDefinition();
            return (d.title ?? d.field) === label;
          });
          if (!col) return;
          if (toggleAll.checked) { col.show(); i.checked = true; }
          else { col.hide(); i.checked = false; }
        });
      });
    }
  };
  table.on('tableBuilt', rebuildCols);
  table.on('columnVisibilityChanged', rebuildCols);
  table.on('columnMoved', rebuildCols);

  // export
  const doExport = (type) => {
    if (type === 'csv') return table.download('csv', 'export.csv');
    if (type === 'json') return table.download('json', 'export.json');
    if (type === 'xlsx') return table.download('xlsx', 'export.xlsx', { sheetName: 'Export' }); // SheetJS globale richiesta
    if (type === 'pdf') return table.download('pdf', 'export.pdf', { orientation: 'portrait', title: 'Export' }); // jsPDF+autotable globali
  };
  u.qAll('.dropdown-menu [data-type]', toolbar).forEach(a => {
    u.onC(a, e => { e.preventDefault(); doExport(a.dataset.type); });
  });

  // print
  u.onC(u.q('button[name="print"]', toolbar), () => table.print(false, true));

  // ridisegna quando la tab diventa visibile
  document.addEventListener('shown.bs.tab', (e) => { if (root.contains(e.target)) table.redraw(true); }, { capture: true });

  return {
    table,
    api: {
      root, toolbar, holder,
      setSearch: (q) => { inp.value = q; doSearch(q); },
      reload: () => { ajaxURL ? table.replaceData() : table.refreshData?.(); },
      export: doExport,
      print: () => table.print(false, true),
    }
  };
}