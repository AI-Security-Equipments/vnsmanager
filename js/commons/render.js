// File: commons/render.js
import { u } from './utility.js'

export function nodeCardTemplate(data) { 
  return `
    <div class="card-node-det ${data.type}" data-id="${data.id}" role="button" tabindex="0"
         aria-label="${data.alias || data.label}, tipo ${data.type}"
         title="${data.alias || data.label} [${data.type}] - ${data.ip}">
      <div class="node-title ${data.status}">
        <i class="fas fa-${data.type}" aria-hidden="true"></i> ${data.label}
      </div>
      <div class="node-info">
        <div class="node-type">${data.type}</div>
        <div class="node-ip">${data.ip}</div>
        <div class="node-mac">${data.mac}</div>
        ${data.isVirtual ? '' : `
          <div class="btn-group node-actions">
            <a href="#" class="btn btn-vnsmanager" title="Apri interfaccia"><i class="fas fa-square-arrow-up-right"></i></a>
            <a href="#" class="btn btn-vnsmanager" title="Visualizza video"><i class="fas fa-video"></i></a>
            <a href="#" class="btn btn-vnsmanager ${!!data.hasCreds ? '' : 'deactivated'}" title="Credenziali"><i class="fas fa-key"></i></a>
            <a href="#" class="btn btn-vnsmanager" title="Informazioni"><i class="fas fa-info"></i></a>
          </div>`
    }
      </div>
    </div>
  `;
}

export function deviceDetailsTemplate(data) {
  return `
    <h6>${data.label || data.vendor}</h6>
    <p><strong>IP:</strong> ${data.ip}</p>
    <p><strong>MAC:</strong> ${data.mac}</p>
    <p><strong>Vendor:</strong> ${data.vendor || '-'}</p>
    <p><strong>Tipo:</strong> ${data.type}</p>
    <p><strong>Stato:</strong> ${data.status || '-'}</p>
    <hr>
    <div class="d-flex justify-content-between">
      <button class="btn btn-sm btn-primary" id="save-device" title="Salva modifiche"><i class="fas fa-save"></i> Salva</button>
      <button class="btn btn-sm btn-secondary" id="close-panel" title="Chiudi pannello"><i class="fas fa-times"></i> Chiudi</button>
    </div>
  `;
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
