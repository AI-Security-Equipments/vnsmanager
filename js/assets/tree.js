// File: assets/tree.js
import { u, store } from '../commons/utility.js';
import { loadDeviceDetails } from '../devices.js';
import { cytoscapeControlsTemplate } from '../commons/render.js';
import { iconMap } from '../commons/icons.js';

let treeState = {
    wrapper: null,
    rootContainer: null,
    searchInput: null,
    toggleFolder: null,
    toggleMinimize: null,
    resizeHandle: null,
    dragHandle: null
};
let cyRef = null;

export function tree(elements, cy) {
    if (!elements || !elements.length) return;
    if (cy) cyRef = cy;

    const {
        wrapper,
        rootContainer,
        searchInput,
        toggleFolder,
        toggleMinimize,
        resizeHandle,
        dragHandle
    } = buildTreeMenuShell();

    treeState = { wrapper, rootContainer, searchInput, toggleFolder, toggleMinimize, resizeHandle, dragHandle };

    const savedPos = store.get('treeMenuPosition', {});
    ['left', 'top', 'width'].forEach(k => { if (savedPos[k]) wrapper.style[k] = savedPos[k] });
    wrapper.style.display = 'block';
    document.body.appendChild(wrapper);

    const nodeState = store.get('treeNodes', {});
    const minimized = store.get('treeMenuMinimized', false);
    const allCollapsed = Object.values(nodeState).every(v => v === false);
    toggleFolder.innerHTML = allCollapsed ? '<i class="fas fa-folder-plus"></i>' : '<i class="fas fa-folder-minus"></i>';
    toggleMinimize.innerHTML = minimized ? '<i class="fas fa-expand"></i>' : '<i class="fas fa-compress"></i>';
    rootContainer.style.display = minimized ? 'none' : 'block';

    buildTreeMenu(elements, rootContainer);
    setupTreeMenuEvents({ toggleFolder, toggleMinimize, searchInput });
    makeDraggable(wrapper, dragHandle, 'treeMenuPosition');
    makeResizable(wrapper, resizeHandle, 'treeMenuPosition');
    initTreeInteractions(rootContainer);
    addTypeFilterButtons(elements);
    initCytoscapeControls(elements);
    trackNodePositionChanges();
}

export function update(elements) {
    if (!elements?.length || !treeState.rootContainer) return;
    buildTreeMenu(elements, treeState.rootContainer);
}

tree.update = update;

function buildTreeHtml(treeData, nodeMap, parentId = undefined) {
    const ul = u.cE('ul', { class: 'tree-list' });
    const children = treeData[parentId] || [];

    children.forEach(child => {
        const li = u.cE('li', { class: 'tree-item' });

        const isGroup = ['MAIN', 'SUBNET', 'TYPE'].includes(child.type);
        const childCount = (treeData[child.id] || []).filter(n => !['MAIN', 'SUBNET', 'TYPE'].includes(n.type)).length;
        const countLabel = isGroup ? ` <small class="text-muted">(${childCount})</small>` : '';

        const span = u.cE('span', {
            class: 'tree-label',
            'data-id': child.id,
            'data-type': child.type || 'device',
            'data-status': child.status || '',
            'data-ip': child.ip || '',
            'role': 'treeitem',
            'tabindex': '-1',
            'aria-expanded': 'true',
            html: `<i class="fa fa-minus-square"></i> ${child.vendor || child.DE_alias || child.label || child.id} ${countLabel}`
        });

        li.appendChild(span);
        const subtree = buildTreeHtml(treeData, nodeMap, child.id);
        if (subtree.children.length > 0) li.appendChild(subtree);
        ul.appendChild(li);
    });
    return ul;
}

function buildTreeMenu(elements, container) {
    const nodes = elements.filter(e => e.group !== 'edges' && e.data?.id).map(e => e.data);
    const edges = elements.filter(e => e.data?.group === 'edges').map(e => e.data);
    const treeData = {}, nodeMap = {};
    nodes.forEach(n => (nodeMap[n.id] = n, treeData[n.id] = []));
    edges.forEach(e => treeData[e.source]?.push(nodeMap[e.target]));

    const state = store.get('treeNodes', {});
    container.innerHTML = '';
    nodes.filter(n => n.type === 'MAIN').forEach(root => {
        const ul = buildTreeHtml(treeData, nodeMap, root.id);
        if (!ul) return;
        ul.setAttribute('role', 'group');
        applySavedNodeState(ul, state);
        container.appendChild(ul);
    });

    enableTreeKeyboardNav(container);
}

function setupTreeMenuEvents({ toggleFolder, toggleMinimize, searchInput }) {
    const root = u.q('.tree-root-nodes');
    let expanded = true;
    let minimized = store.get('treeMenuMinimized', false);

    u.onC(toggleFolder, () => {
        expanded = !expanded;
        const state = store.get('treeNodes', {});
        u.qAll('.tree-label').forEach(span => toggleTreeItem(span, expanded, state));
        store.set('treeNodes', state);
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
            span.closest('li').style.display = span.textContent.toLowerCase().includes(term) ? '' : 'none';
        });
    });
}

function toggleTreeItem(span, expand, state) {
    const ul = span.parentElement.querySelector('ul');
    const id = span.dataset.id;
    if (!ul || !id) return;
    ul.style.display = expand ? 'block' : 'none';
    span.setAttribute('aria-expanded', expand);
    const i = u.q('i', span);
    if (i) i.className = expand ? 'fa fa-minus-square' : 'fa fa-plus-square';
    if (state) state[id] = expand;
}

function applySavedNodeState(ul, state) {
    ul.querySelectorAll('.tree-label').forEach(span => {
        const id = span.dataset.id;
        toggleTreeItem(span, state[id] !== false, null);
    });
}

function initTreeInteractions(container) {
    const state = store.get('treeNodes', {});

    container.addEventListener('click', e => {
        const span = findTreeSpan(e);
        if (!span) return;
        toggleTreeItem(span, span.parentElement.querySelector('ul')?.style.display === 'none', state);
        store.set('treeNodes', state);
        e.stopPropagation();
    });

    container.addEventListener('dblclick', async e => {
        const span = findTreeSpan(e);
        if (!span?.dataset.id) return;
        span.classList.add('active');
        await loadDeviceDetails(span.dataset.id);
    });

    container.addEventListener('mouseover', e => {
        const span = findTreeSpan(e);
        if (span?.dataset.id) highlightCardAndTree(span.dataset.id);
    });

    container.addEventListener('mouseout', () => highlightCardAndTree('', false));

    u.qAll('.card-node').forEach(card => {
        const det = card.querySelector('.card-node-det');
        const id = det?.dataset.id;
        if (!id) return;
        card.onmouseenter = () => highlightCardAndTree(id);
        card.onmouseleave = () => highlightCardAndTree('', false);
    });
}

function highlightCardAndTree(id, fade = true) {
    u.qAll('.card-node').forEach(card => {
        const det = card.querySelector('.card-node-det');
        const cid = det?.dataset.id;
        card.style.opacity = (cid !== id && fade) ? 0.5 : '';
    });

    u.qAll('.tree-label').forEach(span => {
        const sid = span.dataset.id;
        span.classList.toggle('highlight', sid === id);
    });

    if (cyRef && id) {
        const ele = cyRef.$id(id);
        if (ele && ele.length) {
            cyRef.animate({
                center: { eles: ele },
                zoom: 1.2
            }, { duration: 300 });
        }
    }
}

function findTreeSpan(e) {
    return e.target.closest('.tree-label');
}

function enableTreeKeyboardNav(container) {
    let focusIndex = 0;
    const items = () => u.qAll('.tree-label[role="treeitem"]', container);

    const focusItem = i => {
        const list = items();
        if (!list[i]) return;
        list.forEach(el => el.classList.remove('focused'));
        list[i].classList.add('focused');
        list[i].focus();
        focusIndex = i;
    };

    container.addEventListener('keydown', e => {
        const list = items();
        if (!list.length) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            focusItem(Math.min(focusIndex + 1, list.length - 1));
        }
        if (e.key === 'ArrowUp') {
            e.preventDefault();
            focusItem(Math.max(focusIndex - 1, 0));
        }
        if (e.key === 'Enter') {
            e.preventDefault();
            list[focusIndex]?.click();
        }
        if (e.key === 'Escape') {
            list[focusIndex]?.blur();
        }

        if (e.key === 'ArrowRight') {
            e.preventDefault();
            const span = list[focusIndex];
            const ul = span?.parentElement.querySelector('ul');
            if (ul?.style.display === 'none') toggleTreeItem(span, true, store.get('treeNodes', {}));
        }

        if (e.key === 'ArrowLeft') {
            e.preventDefault();
            const span = list[focusIndex];
            const ul = span?.parentElement.querySelector('ul');
            if (ul?.style.display !== 'none') toggleTreeItem(span, false, store.get('treeNodes', {}));
        }
    });

    setTimeout(() => focusItem(0), 500);
}

function buildTreeMenuShell() {
    const wrapper = document.createElement('div');
    wrapper.id = 'tree-menu';
    wrapper.className = 'position-absolute bg-white border rounded shadow';
    wrapper.style.cssText = 'top: 100px; left: 280px; width: 250px; z-index: 1040;';

    wrapper.innerHTML = `
    <div id="tree-controls" class="tree-controls d-flex align-items-center gap-2 p-2 border-bottom tree-header">
      <input type="text" class="form-control form-control-sm tree-search" placeholder="Cerca dispositivo..." id="tree-search" aria-label="Cerca dispositivo">
      <button class="btn btn-sm btn-light" id="tree-toggle-folder" title="Espandi/Comprimi tutti"><i class="fas fa-folder-minus"></i></button>
      <button class="btn btn-sm btn-light" id="tree-minimize" title="Riduce schermata"><i class="fas fa-compress"></i></button>
      <button class="btn btn-sm btn-light" id="tree-drag-handle" title="Sposta pannello"><i class="fas fa-arrows-alt"></i></button>
    </div>
    <div class="tree-filters d-flex flex-wrap gap-1 px-2 pb-2"></div>
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
        dragHandle: wrapper.querySelector('#tree-drag-handle')
    };
}

function makeResizable(el, handle, key = 'treeMenuPosition') {
    let startX, startWidth;
    const onMouseMove = e => {
        const delta = e.clientX - startX;
        el.style.width = `${startWidth + delta}px`;
    };
    const onMouseUp = () => {
        store.set(key, { ...store.get(key, {}), width: el.style.width });
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
    };
    handle.addEventListener('mousedown', e => {
        startX = e.clientX;
        startWidth = parseInt(document.defaultView.getComputedStyle(el).width, 10);
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    });
}

function makeDraggable(menu, handle, key = 'treeMenuPosition') {
    let offsetX, offsetY;
    const onMouseMove = e => {
        menu.style.left = `${e.clientX - offsetX}px`;
        menu.style.top = `${e.clientY - offsetY}px`;
    };
    const onMouseUp = () => {
        store.set(key, {
            left: menu.style.left,
            top: menu.style.top,
            width: menu.style.width
        });
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
    };
    handle.addEventListener('mousedown', e => {
        offsetX = e.clientX - menu.offsetLeft;
        offsetY = e.clientY - menu.offsetTop;
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    });
}


function addTypeFilterButtons(elements) {
    const types = [...new Set(elements.map(e => e.data?.type).filter(t => t && !['MAIN', 'SUBNET', 'TYPE'].includes(t)))].sort();
    const activeFilters = new Set(store.get('treeTypeFilters', []));
    const container = u.q('.tree-filters');
    if (!container) return;
    container.innerHTML = ''; // pulizia

    types.forEach(type => {
        const btn = u.cE('button', {
            class: `btn btn-sm btn-dark d-flex align-items-center gap-1${activeFilters.has(type) ? ' active' : ''}`,
            'data-type': type,
            html: `<i class="fas fa-cube"></i> ${type}`
        });

        u.onC(btn, () => {
            btn.classList.toggle('active');
            const newFilters = u.qAll('.tree-filters .btn.active').map(b => b.dataset.type);
            store.set('treeTypeFilters', newFilters);
            applyTypeFilters(newFilters);
        });

        container.appendChild(btn);
    });

    // Applicazione iniziale
    applyTypeFilters(activeFilters);
}

function applyTypeFilters(filters) {
    const active = Array.from(filters);
    const labels = u.qAll('.tree-label');

    labels.forEach(label => {
        const type = label.dataset.type;
        const li = label.closest('li');
        if (!active.length || active.includes(type)) {
            li.style.display = '';
        } else {
            li.style.display = 'none';
        }
    });
}

function initCytoscapeControls(elements) {
    const currentLayout = store.get('cyLayout') || 'grid';
    const wrapper = document.createElement('div');
    wrapper.innerHTML = cytoscapeControlsTemplate(currentLayout);
    document.body.appendChild(wrapper.firstElementChild);

    const layoutSelect = document.getElementById('cy-layout');
    layoutSelect.onchange = () => {
        const layout = layoutSelect.value;
        store.set('cyLayout', layout);
        if (cyRef) cyRef.layout({ name: layout }).run();
    };

    const btnWrapper = document.getElementById('cy-type-buttons');
    addTypeFilterButtons(elements, btnWrapper);

    document.getElementById('cy-edit-edges').onclick = () => {
        const enabled = !!cyRef.edgehandles('getEnabled')?.enabled;
        if (enabled) {
            cyRef.edgehandles('disable');
            event.target.classList.remove('btn-success');
        } else {
            cyRef.edgehandles('enable');
            event.target.classList.add('btn-success');
        }
    };

    document.getElementById('cy-del-edge').onclick = () => {
        const sel = cyRef.$('edge:selected');
        if (sel.length) sel.remove();
    };

    document.getElementById('cy-del-node').onclick = () => {
        const sel = cyRef.$('node:selected');
        if (sel.length) sel.remove();
    };
}

function trackNodePositionChanges() {
    if (!cyRef) return;
    const saved = store.get('cyNodePositions', {});
    cyRef.nodes().forEach(n => {
        const pos = saved[n.id()];
        if (pos) n.position(pos);
    });

    cyRef.on('dragfree', 'node', e => {
        const n = e.target;
        saved[n.id()] = n.position();
        store.set('cyNodePositions', saved);
    });
}
