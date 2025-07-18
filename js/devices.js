// File: js/devices.js
import { u, store, toast } from './commons/utility.js';
import { post } from './commons/net.js';
import { createCytoscapeInstance } from './assets/cytoscape/cytoscape.settings.js';
import { deviceDetailsTemplate } from './commons/render.js';
import { tree, applyPinnedStyle, resetTreeMenuStyle } from './assets/tree.js';
import { modal } from './assets/modal.js';

let cyInstance = null;

window.addEventListener("DOMContentLoaded", async () => {
    try {
        const container = u.gI("cy");
        if (!container) throw new Error("Container #cy non trovato");

        toast.show('<i class="fas fa-spinner fa-spin"></i> Caricamento dispositivi...', 'info', { autohide: false });
        const elements = await post("/ws/ws_devices?/devices/get_all", {});
        if (!Array.isArray(elements)) return toast.error("Dati dispositivi non validi");

        cyInstance = createCytoscapeInstance(container, elements);
        waitForCardsAndThenInitTree(elements, cyInstance);
        toast.success("Dispositivi caricati");
    } catch (e) {
        toast.error(`Errore caricamento: ${e.message}`);
    }

    u.onC(u.gI('close-tab-panel'), () => {
        const panel = u.gI('device-tab-panel');
        const content = u.gI('tab-content');
        const treeMenu = u.gI('tree-menu');

        panel.classList.remove('show', 'right-expand');
        panel.style.visibility = 'hidden';
        content.innerHTML = '';
        resetTreeMenuStyle(treeMenu);
    });

});

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

function waitForCardsAndThenInitTree(elements, cy) {
    let attempts = 0;
    const checkReady = () => {
        const allCardsReady = document.querySelectorAll('.card-node').length >= elements.filter(e => e.group !== 'edges').length;
        if (allCardsReady || attempts > 20) {
            tree(elements, cyInstance, { onClickLabel: (id, span) => { openDeviceTabPanel(id); } });
            setupCardButtonEvents();
        } else {
            attempts++;
            requestAnimationFrame(checkReady);
        }
    };
    requestAnimationFrame(checkReady);
}

async function openDeviceTabPanel(id) {
    const panel = u.gI('device-tab-panel');
    const content = u.gI('tab-content');
    const title = u.gI('tab-title');
    const treeMenu = u.gI('tree-menu');

    if (!panel || !content || !treeMenu) return;
    applyPinnedStyle(treeMenu);
    panel.classList.add('show', 'right-expand');
    panel.style.visibility = 'visible';
    const res = await post('/ws/ws_devices?/devices/get_device', { id: id });
    if (res?.html) {
        content.innerHTML = res.html;
        title.textContent = res.label || 'Dettagli dispositivo';
    } else {
        content.innerHTML = '<p class="text-danger">Errore nel caricamento del pannello</p>';
        title.textContent = 'Errore';
    }
}

function setupCardButtonEvents() {
    const cards = u.qAll('.card-node-det');
    cards.forEach(card => {
        const id = card.dataset.id;
        if (!id) return;
        const label = card.querySelector('.node-title')?.textContent.trim() || `Dispositivo ${id}`;
        const buttons = card.querySelectorAll('.node-actions .btn');
        buttons.forEach(btn => {
            ['mousedown', 'mouseup', 'mousemove'].forEach(event => { btn.addEventListener(event, e => e.stopPropagation(), true); });
            const icon = btn.querySelector('i');
            if (!icon) return;
            const url = btn.dataset.url || '';
            const isInfo = icon.classList.contains('fa-info');
            const isOpen = icon.classList.contains('fa-square-arrow-up-right');
            const isVideo = icon.classList.contains('fa-video');
            u.onC(btn, e => {
                e.preventDefault();
                e.stopPropagation();
                if (isInfo) {
                    openDeviceTabPanel(id);
                    return;
                }
                if (isOpen) {
                    if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
                        openOrToggleModalForDevice({ id, type: 'http', url, label });
                    } else {
                        toast.info('Nessuna interfaccia disponibile per questo dispositivo');
                    }
                    return;
                }
                if (isVideo) {
                    if (url && url.startsWith('rtsp://')) {
                        openOrToggleModalForDevice({ id, type: 'rtsp', url, label });
                    } else {
                        toast.info('Nessun flusso video disponibile per questo dispositivo');
                    }
                    return;
                }                
            });
        });
    });
}

function openOrToggleModalForDevice({ id, type, url, label }) {
    const modalId = `${id}-${type}`;
    const existing = document.querySelector(`.modal-float[data-id="${modalId}"]`);
    const modals = store.get('modals', {});
    const treeLabel = u.q(`.tree-label[data-id="${id}"]`);

    if (existing) {
        if (existing.classList.contains('minimized')) {
            existing.classList.remove('minimized');
            existing.style.width = '600px';
            existing.style.height = '400px';
            existing.style.top = '100px';
            existing.style.left = '100px';
            document.body.appendChild(existing);
            existing.onclick = null;
            modals[modalId].minimized = false;
            store.set('modals', modals);
        } else {
            existing.style.zIndex = 2000;
        }
    } else {
        modal({ id: modalId, title: `${label} - ${type}`, url });
        modals[modalId] = { url, label, minimized: false };
        store.set('modals', modals);
    }

    if (treeLabel) treeLabel.classList.add('highlight');
}

function handleModalClose(modalId) {
    const modals = store.get('modals', {});
    delete modals[modalId];
    store.set('modals', modals);

    const deviceId = modalId.split('-')[0];
    const stillOpen = Object.keys(modals).some(k => k.startsWith(`${deviceId}-`));
    const treeLabel = u.q(`.tree-label[data-id="${deviceId}"]`);
    if (treeLabel && !stillOpen) {
        treeLabel.classList.remove('highlight');
    }
}

window.handleModalClose = handleModalClose;
