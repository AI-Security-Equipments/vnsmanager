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

export function buildTreeMenuShell() {
  const wrapper = document.createElement('div');
  wrapper.id = 'tree-menu';
  wrapper.className = 'position-absolute bg-white border rounded shadow';
  wrapper.style.cssText = 'top: 100px; left: 280px; width: 250px; z-index: 1040; cursor: move;';

  wrapper.innerHTML = `
    <div id="tree-controls" class="tree-controls d-flex align-items-center gap-2 p-2 border-bottom tree-header">
      <input type="text" class="form-control form-control-sm tree-search" placeholder="Cerca dispositivo..." id="tree-search" aria-label="Cerca dispositivo">
      <button class="btn btn-sm btn-light" id="tree-toggle-folder" title="Espandi/Comprimi tutti"><i class="fas fa-folder-minus"></i></button>
      <button class="btn btn-sm btn-light" id="tree-minimize" title="Riduce schermata"><i class="fas fa-compress"></i></button>
    </div>
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
    resizeHandle: wrapper.querySelector('.resize-handle')
  };
}

export function buildTreeHtml(treeData, nodeMap, parentId = undefined) {
    const ul = u.cE('ul', { class: 'tree-list' });
    const children = treeData[parentId] || [];
    
    children.forEach(child => {
      const li = u.cE('li', { class: 'tree-item' });
      const span = u.cE('span', {
        class: 'tree-label',
        'data-id': child.id,
        'data-type': child.type || 'device',
        'data-status': child.status || '',
        'data-ip': child.ip || '',
        html: `<i class="fa fa-minus-square"></i> ${child.vendor || child.DE_alias || child.label || child.id}`
      });
      li.appendChild(span);
      const subtree = buildTreeHtml(treeData, nodeMap, child.id);
      if (subtree.children.length > 0) li.appendChild(subtree);

      ul.appendChild(li);
    });
  return ul;
}