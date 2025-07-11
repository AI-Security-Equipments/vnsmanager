// File: assets/tree.js
import { u, store } from '../commons/utility.js';
import { loadDeviceDetails } from '../devices.js';
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

    // Aggiunta controlli Cytoscape (toolbar)
    initCytoscapeControls(elements);
    initCytoscapeLayoutControls();
    initEdgeModificationToggle();
    trackNodePositionChanges();
}

export function update(elements) {
    if (!elements?.length || !treeState.rootContainer) return;
    buildTreeMenu(elements, treeState.rootContainer);
    addTypeFilterButtons(elements);
    initCytoscapeControls(elements);
    initCytoscapeLayoutControls();
    initEdgeModificationToggle();
    trackNodePositionChanges();
}

tree.update = update;

function initCytoscapeControls(elements) {
    let ctrl = u.q('#cytoscape-controls');
    if (!ctrl) {
        ctrl = u.cE('div', {
            id: 'cytoscape-controls',
            class: 'position-absolute z-70 border bg-white rounded shadow p-2 d-flex gap-1 flex-wrap',
            style: 'right: 20px; bottom: 20px;'
        });
        document.body.appendChild(ctrl);
    }
    ctrl.innerHTML = '<div class="text-muted small w-100">Filtra tipi</div>';
    const dummy = document.createElement('div');
    dummy.className = 'cy-filter-buttons d-flex gap-1';
    ctrl.appendChild(dummy);

    addTypeFilterButtons(elements, dummy);
}

function initCytoscapeLayoutControls() {
    const ctrl = u.q('#cytoscape-controls');
    if (!ctrl) return;
    const layoutSelect = u.cE('select', { class: 'form-select form-select-sm w-auto' });
    ['grid', 'fcose', 'cose', 'circle'].forEach(layout => {
        const opt = u.cE('option', { value: layout, text: layout });
        layoutSelect.appendChild(opt);
    });
    layoutSelect.value = store.get('cyLayout', 'grid');
    u.on(layoutSelect, 'change', () => {
        const layout = layoutSelect.value;
        store.set('cyLayout', layout);
        if (cyRef) cyRef.layout({ name: layout }).run();
    });
    ctrl.appendChild(layoutSelect);
}

function initEdgeModificationToggle() {
    const ctrl = u.q('#cytoscape-controls');
    if (!ctrl) return;
    const btn = u.cE('button', {
        class: 'btn btn-sm btn-outline-danger',
        html: '<i class="fas fa-link"></i> Edit edges'
    });
    u.onC(btn, () => {
        const active = btn.classList.toggle('active');
        if (cyRef && cyRef.edgehandles) {
            if (active) cyRef.edgehandles().enable();
            else cyRef.edgehandles().disable();
        }
    });
    ctrl.appendChild(btn);
}

function trackNodePositionChanges() {
    if (!cyRef) return;
    cyRef.on('dragfree', 'node', evt => {
        const node = evt.target;
        const pos = node.position();
        const nodePositions = store.get('cyNodePositions', {});
        nodePositions[node.id()] = pos;
        store.set('cyNodePositions', nodePositions);
    });

    const saved = store.get('cyNodePositions', {});
    Object.entries(saved).forEach(([id, pos]) => {
        const node = cyRef.$id(id);
        if (node) node.position(pos);
    });
}

function addTypeFilterButtons(elements, overrideContainer) {
    const types = [...new Set(elements.map(e => e.data?.type).filter(t => t && !['MAIN', 'SUBNET', 'TYPE'].includes(t)))].sort();
    const activeFilters = new Set(store.get('treeTypeFilters', []));
    const container = overrideContainer || u.q('.tree-filters');
    if (!container) return;
    container.innerHTML = '';

    types.forEach(type => {
        const btn = u.cE('button', {
            class: `btn btn-sm btn-dark d-flex align-items-center gap-1${activeFilters.has(type) ? ' active' : ''}`,
            'data-type': type,
            html: `<i class="fas fa-cube"></i> ${type}`
        });

        u.onC(btn, () => {
            btn.classList.toggle('active');
            const newFilters = u.qAll('[data-type].active', container).map(b => b.dataset.type);
            store.set('treeTypeFilters', newFilters);
            applyTypeFilters(newFilters);
        });

        container.appendChild(btn);
    });

    applyTypeFilters(activeFilters);
}