// File: js/devices.js
import { u, store } from './commons/utility.js';
import { post } from './commons/net.js';
import { createCytoscapeInstance } from './assets/cytoscape/cytoscape.settings.js';
import { deviceDetailsTemplate, menuTreeControlsTemplate, buildTreeHtml } from './commons/render.js';

window.addEventListener("DOMContentLoaded", async () => {
    const container = u.gI("cy");
    const elements = await post("/ws/ws_devices?/devices/get_all", {});
    const cy = createCytoscapeInstance(container, elements);

    buildTreeMenu(elements, cy);
    makeDraggableMenu(u.gI('tree-menu'));

    // CY → Menu Sync
    cy.on('tap', 'node', (e) => {
        const id = e.target.id();
        const elx = u.q(`.card-node-det[d-id="${id}"]`);
        if (elx) {
            elx.scrollIntoView({ behavior: 'smooth', block: 'center' });
            u.qAll('.card-node-det.active').forEach(x => x.classList.remove('active'));
            elx.classList.add('active');
            elx.focus();
        }
    });

    // Keyboard Navigation: Enter activates, Escape blur
    document.addEventListener('keydown', (e) => {
        const elx = document.activeElement;
        if (elx && elx.classList.contains('card-node-det')) {
            if (e.key === 'Enter') {
                elx.click();
            } else if (e.key === 'Escape') {
                elx.blur();
            }
        }
    });
});

function buildTreeMenu(elements, cy) {
    const nodes = elements
        .filter(e => e.group !== 'edges' && e.data && e.data.id)
        .map(e => e.data);

    const edges = elements
        .filter(e => e.data && e.data.group && e.data.group === 'edges' && e.data.source && e.data.target)
        .map(e => e.data);

    const treeData = {};
    const nodeMap = {};
    nodes.forEach(n => {
        nodeMap[n.id] = n;
        treeData[n.id] = [];
    });
    edges.forEach(({ source, target }) => {
        if (treeData[source] && nodeMap[target]) {
            treeData[source].push(nodeMap[target]);
        }
    });

    const content = u.gI('tree-menu-content');
    if (!content) return console.error("[TREE] #tree-menu-content mancante.");

    content.innerHTML = '';
    const { controls, searchInput, toggleAll } = menuTreeControlsTemplate();
    content.appendChild(controls);

    const rootNodes = nodes.filter(n => n.type === 'MAIN');
    const rootContainer = u.cE('div', { class: 'tree-root-nodes' });

    rootNodes.forEach(root => {
        const ul = buildTreeHtml(treeData, nodeMap, root.id);
        rootContainer.appendChild(ul);
    });

    content.appendChild(rootContainer);
    initTreeInteractions(rootContainer, cy);

    searchInput.addEventListener('input', () => {
        const term = searchInput.value.toLowerCase();
        u.qAll('.tree-label', content).forEach(span => {
            const txt = span.innerText.toLowerCase();
            span.closest('li').style.display = txt.includes(term) ? '' : 'none';
        });
    });

    toggleAll.onclick = () => {
        const open = toggleAll.querySelector('i').classList.contains('fa-chevron-down');
        toggleAll.querySelector('i').className = open ? 'fas fa-chevron-up' : 'fas fa-chevron-down';
        u.qAll('ul.tree-list', content).forEach(ul => ul.style.display = open ? 'none' : 'block');
    };
}

function initTreeInteractions(container, cy) {
  const spans = container.querySelectorAll('.tree-label');
  spans.forEach(span => {
    const id = span.dataset.id;

    span.addEventListener('click', (e) => {
      const ul = span.parentElement.querySelector('ul');
      if (ul) {
        const open = ul.style.display !== 'none';
        ul.style.display = open ? 'none' : 'block';
        const icon = u.q('i', span);
        icon.className = open ? 'fa fa-plus-square' : 'fa fa-minus-square';
      }
      e.stopPropagation();
    });

    span.addEventListener('mouseover', () => {
      cy.nodes().not(`[id = "${id}"]`).addClass('faded');
      cy.getElementById(id).removeClass('faded');
    });

    span.addEventListener('mouseout', () => {
      cy.nodes().removeClass('faded');
    });

    span.addEventListener('dblclick', () => {
      import('../devices.js').then(m => m.loadDeviceDetails(id));
      container.querySelectorAll('.tree-label.active').forEach(x => x.classList.remove('active'));
      span.classList.add('active');
      cy.getElementById(id)?.select();
    });
  });
}

function makeDraggableMenu(menuEl) {
    if (!menuEl) return;
    let offsetX, offsetY, isDragging = false;
    const header = menuEl.querySelector('.tree-header') || menuEl;
    header.style.cursor = 'move';
    header.addEventListener('mousedown', (e) => {
        isDragging = true;
        const rect = menuEl.getBoundingClientRect();
        offsetX = e.clientX - rect.left;
        offsetY = e.clientY - rect.top;
    });
    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        menuEl.style.left = `${e.clientX - offsetX}px`;
        menuEl.style.top = `${e.clientY - offsetY}px`;
    });
    document.addEventListener('mouseup', () => {
        isDragging = false;
    });
}

export async function loadDeviceDetails(deviceId) {
  const sidepanel = u.gI("sidepanel-info");
  const deviceInfo = u.gI("device-info");

    try {
        const data = await post("/ws/ws_devices?/devices/get_device", { id: deviceId });
        if (!data || !data.id) {
            deviceInfo.innerHTML = "<p class='text-danger'>Dispositivo non trovato</p>";
            return;
        }

        deviceInfo.innerHTML = deviceDetailsTemplate(data);
        sidepanel.style.display = 'block';

        u.gI("close-panel").onclick = () => {
            sidepanel.style.display = 'none';
        };

        u.gI("save-device").onclick = () => {
            console.log("TODO: Salvataggio in arrivo...");
        };
    } catch (err) {
        deviceInfo.innerHTML = "<p class='text-danger'>Errore nel caricamento</p>";
        console.error("[DETAILS] Errore caricamento:", err);
    }
}
