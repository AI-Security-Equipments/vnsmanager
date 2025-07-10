// File: js/devices.js
import { u, store, toast } from './commons/utility.js';
import { post } from './commons/net.js';
import { createCytoscapeInstance } from './assets/cytoscape/cytoscape.settings.js';
import { deviceDetailsTemplate, buildTreeMenuShell, buildTreeHtml } from './commons/render.js';

let cyInstance = null;
let fadedNodes = null;

// Inizializzazione principale
window.addEventListener("DOMContentLoaded", async () => {
    try {
        const container = u.gI("cy");
        if (!container) throw new Error("Container #cy non trovato");

        toast.show('<i class="fas fa-spinner fa-spin"></i> Caricamento dispositivi...', 'info', { autohide: false });
        const elements = await post("/ws/ws_devices?/devices/get_all", {});
        if (!Array.isArray(elements)) {
            toast.error("Dati dispositivi non validi");
            return;
        }

        cyInstance = createCytoscapeInstance(container, elements);

        const {
            wrapper: treeMenu,
            rootContainer,
            searchInput,
            toggleFolder,
            toggleMinimize,
            resizeHandle
        } = buildTreeMenuShell();

        const savedPos = store.get('treeMenuPosition', {});
        ['left', 'top', 'width'].forEach(k => {
            if (savedPos[k]) treeMenu.style[k] = savedPos[k];
        });
        treeMenu.style.display = 'block';

        document.body.appendChild(treeMenu);

        const nodeState = store.get('treeNodes', {});
        const minimized = store.get('treeMenuMinimized', false);
        const allCollapsed = Object.values(nodeState).every(v => v === false);

        toggleFolder.innerHTML = allCollapsed
            ? '<i class="fas fa-folder-plus"></i>'
            : '<i class="fas fa-folder-minus"></i>';

        toggleMinimize.innerHTML = minimized
            ? '<i class="fas fa-expand"></i>'
            : '<i class="fas fa-compress"></i>';

        rootContainer.style.display = minimized ? 'none' : 'block';

        buildTreeMenu(elements, rootContainer);
        setupMenuInteractions({ toggleFolder, toggleMinimize, searchInput });

        makeDraggable(treeMenu);
        makeResizable(treeMenu, resizeHandle);

        toast.success("Dispositivi caricati");
    } catch (error) {
        toast.error(`Errore caricamento: ${error.message}`);
    }
});

function buildTreeMenu(elements, container) {
    const nodes = elements.filter(e => e.group !== 'edges' && e.data?.id).map(e => e.data);
    const edges = elements.filter(e => e.data?.group === 'edges').map(e => e.data);

    const treeData = {}, nodeMap = {};
    nodes.forEach(n => (nodeMap[n.id] = n, treeData[n.id] = []));
    edges.forEach(e => treeData[e.source]?.push(nodeMap[e.target]));

    const nodeState = store.get('treeNodes', {});
    container.innerHTML = '';

    nodes.filter(n => n.type === 'MAIN').forEach(root => {
        const ul = buildTreeHtml(treeData, nodeMap, root.id);
        if (!ul) return;
        ul.setAttribute('role', 'group');
        applySavedNodeState(ul, nodeState);
        container.appendChild(ul);
    });

    initTreeInteractions(container);
}

function setupMenuInteractions({ toggleFolder, toggleMinimize, searchInput }) {
    const root = u.q('.tree-root-nodes');
    let expanded = true;
    let minimized = store.get('treeMenuMinimized', false);

    u.onC(toggleFolder, () => {
        expanded = !expanded;
        const nodeState = store.get('treeNodes', {});
        u.qAll('.tree-label').forEach(span => {
            const ul = span.parentElement.querySelector('ul');
            const id = span.dataset.id;
            if (ul) {
                ul.style.display = expanded ? 'block' : 'none';
                span.setAttribute('aria-expanded', expanded);
                const icon = u.q('i', span);
                if (icon) icon.className = expanded ? 'fa fa-minus-square' : 'fa fa-plus-square';
                nodeState[id] = expanded;
            }
        });
        store.set('treeNodes', nodeState);
        toggleFolder.innerHTML = expanded
            ? '<i class="fas fa-folder-minus"></i>'
            : '<i class="fas fa-folder-plus"></i>';
    });

    u.onC(toggleMinimize, () => {
        minimized = !minimized;
        store.set('treeMenuMinimized', minimized);
        root.style.display = minimized ? 'none' : 'block';
        toggleMinimize.innerHTML = minimized
            ? '<i class="fas fa-expand"></i>'
            : '<i class="fas fa-compress"></i>';
    });

    u.on(searchInput, 'input', () => {
        const term = searchInput.value.toLowerCase();
        u.qAll('.tree-label').forEach(span => {
            const txt = span.textContent.toLowerCase();
            span.closest('li').style.display = txt.includes(term) ? '' : 'none';
        });
    });
}

function applySavedNodeState(ul, state) {
    ul.querySelectorAll('.tree-label').forEach(span => {
        const id = span.dataset.id;
        const ulChild = span.parentElement.querySelector('ul');
        if (ulChild && state[id] === false) {
            ulChild.style.display = 'none';
            span.setAttribute('aria-expanded', 'false');
            const icon = u.q('i', span);
            if (icon) icon.className = 'fa fa-plus-square';
        }
    });
}

function scrollIntoViewIfNeeded(el) {
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
}

function initTreeInteractions(container) {
    container.addEventListener('click', e => {
        const span = e.target.closest('.tree-label');
        if (!span) return;
        const ul = span.parentElement.querySelector('ul');
        const id = span.dataset.id;
        const state = store.get('treeNodes', {});
        if (ul) {
            const open = ul.style.display !== 'none';
            ul.style.display = open ? 'none' : 'block';
            span.setAttribute('aria-expanded', (!open).toString());
            const icon = u.q('i', span);
            if (icon) icon.className = open ? 'fa fa-plus-square' : 'fa fa-minus-square';
            state[id] = !open;
            store.set('treeNodes', state);
        }
        e.stopPropagation();
    });

    container.addEventListener('dblclick', async e => {
        const span = e.target.closest('.tree-label');
        if (!span?.dataset.id) return;
        span.classList.add('active');
        await loadDeviceDetails(span.dataset.id);
    });

    container.addEventListener('mouseover', e => {
        const span = e.target.closest('.tree-label');
        if (!span?.dataset.id) return;
        const id = span.dataset.id;
        if (cyInstance) {
            cyInstance.elements().removeClass('highlighted');
            const node = cyInstance.getElementById(id);
            if (node) node.addClass('highlighted');
        }
        u.qAll('.card-node-det').forEach(card => {
            const cid = String(card.dataset.id).trim();
            const tid = String(id).trim();
            console.log('Tree label ID:', tid, '| Card ID:', cid);  // <-- QUI
            if (cid !== tid) {
                card.style.opacity = 0.3;
            } else {
                card.style.opacity = '';
                scrollIntoViewIfNeeded(card);
            }
        });
    });

    container.addEventListener('mouseout', e => {
        const span = e.target.closest('.tree-label');
        if (!span?.dataset.id) return;
        if (cyInstance) cyInstance.elements().removeClass('highlighted');
        u.qAll('.card-node').forEach(card => card.style.opacity = '');
    });

    u.qAll('.card-node-det').forEach(card => {
        card.addEventListener('mouseenter', () => {
            const id = card.dataset.id;
            const span = u.q(`.tree-label[data-id="${id}"]`);
            if (span) {
                span.classList.add('highlight');
                scrollIntoViewIfNeeded(span);
            }
        });
        card.addEventListener('mouseleave', () => {
            const id = card.dataset.id;
            const span = u.q(`.tree-label[data-id="${id}"]`);
            if (span) span.classList.remove('highlight');
        });
    });
}

function makeResizable(el, handle) {
    let startX = 0, startWidth = 0;

    handle.addEventListener('mousedown', e => {
        startX = e.clientX;
        startWidth = parseInt(getComputedStyle(el).width);

        const onMove = ev => {
            const newWidth = Math.max(150, Math.min(500, startWidth + ev.clientX - startX));
            el.style.width = `${newWidth}px`;
        };

        const onUp = () => {
            const current = store.get('treeMenuPosition', {});
            if (current.width !== el.style.width) {
                store.set('treeMenuPosition', {
                    ...current,
                    width: el.style.width
                });
            }
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onUp);
        };

        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
    });
}

function makeDraggable(menu) {
    const header = menu.querySelector('.tree-header');
    if (!header) return console.warn('makeDraggable: .tree-header non trovato');

    let offsetX = 0, offsetY = 0;

    header.addEventListener('mousedown', e => {
        e.preventDefault();

        offsetX = e.clientX - menu.offsetLeft;
        offsetY = e.clientY - menu.offsetTop;

        document.body.style.userSelect = 'none';

        const onMove = ev => {
            menu.style.left = `${ev.clientX - offsetX}px`;
            menu.style.top = `${ev.clientY - offsetY}px`;
        };

        const onUp = () => {
            document.body.style.userSelect = '';
            const current = store.get('treeMenuPosition', {});
            if (current.left !== menu.style.left || current.top !== menu.style.top) {
                store.set('treeMenuPosition', {
                    ...current,
                    left: menu.style.left,
                    top: menu.style.top
                });
            }
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onUp);
        };

        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
    });
}

export async function loadDeviceDetails(deviceId) {
    const panel = u.gI('sidepanel-info');
    const box = u.gI('device-info');
    if (!panel || !box) return toast.error("Pannello non disponibile");

    try {
        const data = await post("/ws/ws_devices?/devices/get_device", { id: deviceId });
        if (!data?.id) return box.innerHTML = '<p class="text-danger">Dispositivo non trovato</p>';
        box.innerHTML = deviceDetailsTemplate(data);
        panel.style.display = 'block';
        u.onC(u.gI("close-panel"), () => panel.style.display = 'none');
    } catch (err) {
        toast.error(`Errore: ${err.message}`);
        box.innerHTML = '<p class="text-danger">Errore nel caricamento</p>';
    }
}
