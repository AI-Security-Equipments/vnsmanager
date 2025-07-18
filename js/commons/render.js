// File: commons/render.js
import { u, icons } from './utility.js'

export function nodeCardTemplate(data) {
  const url = (data.https && data.https !== 'N' ? data.https : data.http);

  const rtsp = data.rtsp || '';
  const keyIcon = data.hasCreds
    ? '<i class="fas fa-key node-key active" title="Credenziali disponibili"></i>'
    : '<i class="fas fa-key node-key" title="Nessuna credenziale"></i>';

  return `
    <div class="card-node-det ${data.type}" data-id="${data.id}" role="button" tabindex="0"
         aria-label="${data.alias || data.label}, tipo ${data.type}"
         title="${data.alias || data.label} [${data.type}] - ${data.ip}">
      <div class="node-title ${data.status}">
        <i class="fas fa-${data.type}" aria-hidden="true"></i> ${data.label}
        ${keyIcon}   
      </div>
      <div class="node-info drag-handle">
        <div class="node-type">${data.type}</div>
        <div class="node-ip">${data.ip}</div>
        <div class="node-mac">${data.mac}</div>
      <div class="btn-group node-actions">
          ${url ? `
            <a href="#" class="btn btn-vnsmanager" title="Apri interfaccia" data-url="${url}">
              <i class="fas fa-square-arrow-up-right"></i>
            </a>` : ''}
          ${rtsp ? `
            <a href="#" class="btn btn-vnsmanager" title="Visualizza video" data-url="${rtsp}">
              <i class="fas fa-video"></i>
            </a>` : ''}
          <a href="#" class="btn btn-vnsmanager" title="Informazioni">
            <i class="fas fa-info"></i>
          </a>
        </div>
      </div>
    </div>`;
}

export function buildTreeMenuShell() {
  const wrapper = document.createElement('div');
  wrapper.id = 'tree-menu';
  wrapper.className = 'position-absolute bg-white border rounded shadow';
  wrapper.style.cssText = 'top: 100px; left: 280px; width: 250px; z-index: 1040;';

  wrapper.innerHTML = `
    <div id="tree-controls" class="tree-controls d-flex align-items-center gap-2 p-2 border-bottom tree-header">
      <input type="text" class="form-control form-control-sm tree-search" placeholder="Cerca dispositivo..." id="tree-search" aria-label="Cerca dispositivo">
      <button class="btn btn-sm btn-light" id="tree-toggle-folder" title="Espandi/Comprimi tutti"><i class="fas fa-folder-minus"></i></button>
      <button class="btn btn-sm btn-light" id="tree-minimize" title="Riduce schermata"><i class="fas fa-compress"></i></button>
      <button class="btn btn-sm btn-light" id="tree-pin-toggle" title="Fissa al lato"><i class="fas fa-thumbtack"></i></button>
      <button class="btn btn-sm btn-light" id="tree-drag-handle" title="Sposta pannello"><i class="fas fa-arrows-alt"></i></button>
    </div>
    ${renderTreeFiltersContainer()}
    <div id="tree-menu-content" class="p-2">
      <div class="tree-root-nodes" role="tree"></div>
    </div>
    <div class="resize-handle"></div>
  `;

  return {
    wrapper,
    rootContainer: wrapper.querySelector('.tree-root-nodes'),
    searchInput: wrapper.querySelector('#tree-search'),
    toggleFolder: wrapper.querySelector('#tree-toggle-folder'),
    toggleMinimize: wrapper.querySelector('#tree-minimize'),
    resizeHandle: wrapper.querySelector('.resize-handle'),
    dragHandle: wrapper.querySelector('#tree-drag-handle'),
    pinToggle: wrapper.querySelector('#tree-pin-toggle')
  };
}

export function renderTreeFiltersContainer() {
  return `<div class="tree-filters d-flex flex-wrap gap-1 px-2 pb-2"></div>`;
}

export function modalTemplate({ id, title, url }) {
  const modal = document.createElement('div');
  modal.className = 'modal-float';
  modal.dataset.id = id;
  modal.innerHTML = `
    <div class="modal-header d-flex justify-content-between align-items-center">
      <span class="modal-title">${title}</span>
      <div class="modal-actions d-flex gap-2">
        <button class="btn btn-sm btn-light btn-minimize">${icons('window-minimize')}</button>
        <button class="btn btn-sm btn-light btn-fullscreen">${icons('expand')}</button>
        <button class="btn btn-sm btn-light btn-close">${icons('times')}</button>
      </div>
    </div>
    <div class="modal-body p-0">
      <iframe src="${url}" frameborder="0" style="width:100%; height:100%;"></iframe>
    </div>
  `;
  return modal;
}

export function createMinimizedBar() {
  let bar = document.getElementById('modal-dock');
  if (!bar) {
    bar = document.createElement('div');
    bar.id = 'modal-dock';
    bar.className = 'position-fixed bottom-0 start-0 d-flex gap-2 p-2';
    bar.style.zIndex = '1050';
    bar.style.background = 'rgba(255, 255, 255, 0.85)';
    bar.style.borderTop = '1px solid #ccc';
    bar.style.width = '100%';
    document.body.appendChild(bar);
  }
  return bar;
}

export function renderMinimizedIcon({ id, title, type = 'default' }) {
  const iconClass = iconMap[type.toLowerCase()] || 'fa-solid fa-circle-question';
  const wrapper = document.createElement('div');
  wrapper.id = `minimized-${id}`;
  wrapper.className = 'd-flex align-items-center gap-2 border rounded px-2 py-1 bg-white shadow-sm';
  wrapper.innerHTML = `
    <i class="${iconClass}"></i>
    <span class="text-truncate" style="max-width: 120px">${title}</span>
    <button class="btn btn-sm btn-light btn-restore">${icons('arrow-up')}</button>
    <button class="btn btn-sm btn-light btn-close">${icons('times')}</button>
  `;

  return wrapper;
}

export function deviceDetailsTemplate(data) {
  return data.html;
}

export function cytoscapeControlsTemplate(currentLayout = 'grid') {
  const layouts = ['grid', 'circle', 'concentric', 'cose', 'breadthfirst', 'fcose'];
  return `
    <div id="cytoscape-controls" class="cy-float-menu">
      <div class="cy-toggle-area">
        <i class="fas fa-cogs"></i>
      </div>
      <div class="cy-menu-body">
        <select id="cy-layout" class="form-select form-select-sm mb-2">
          ${layouts.map(name => `<option value="${name}" ${name === currentLayout ? 'selected' : ''}>${name}</option>`).join('')}
        </select>
        <div class="cy-label">Filtra per tipo</div>
        <div id="cy-type-buttons" class="d-flex flex-wrap gap-1 mb-2"></div>
        <button id="cy-edit-edges" class="btn btn-sm btn-secondary w-100 mb-1"><i class="fas fa-pencil-alt"></i></button>
        <button id="cy-del-edge" class="btn btn-sm btn-danger w-100 mb-1"><i class="fas fa-unlink"></i></button>
        <button id="cy-del-node" class="btn btn-sm btn-danger w-100"><i class="fas fa-trash"></i></button>
      </div>
    </div>
  `;
}
