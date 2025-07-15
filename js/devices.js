// File: js/devices.js
import { u, store, toast } from './commons/utility.js';
import { post } from './commons/net.js';
import { createCytoscapeInstance } from './assets/cytoscape/cytoscape.settings.js';
import { deviceDetailsTemplate } from './commons/render.js';
import { tree } from './assets/tree.js';

let cyInstance = null;
let treeInitialized = false;

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
            tree(elements, cy);
        } else {
            attempts++;
            requestAnimationFrame(checkReady);
        }
    };
    requestAnimationFrame(checkReady);
}
