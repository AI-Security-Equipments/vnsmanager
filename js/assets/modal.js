// modal.js
// modules/modalManager.js
import { icons } from '../commons/utility.js';
import { modalTemplate, createMinimizedBar } from '../commons/render.js';

const modals = new Map();
let zIndexBase = 2000;
let minimizedOffset = 0;

function createModal({ id, title, url }) {
    if (modals.has(id)) return bringToFront(id);

    const modal = modalTemplate({ id, title, url });
    modal.style.zIndex = zIndexBase++;

    document.body.appendChild(modal);
    modals.set(id, modal);

    makeDraggable(modal);
    makeResizable(modal);
    setupControls(modal);
    bringToFront(id);
}

function bringToFront(id) {
    const modal = modals.get(id);
    if (modal) modal.style.zIndex = zIndexBase++;
}

function makeDraggable(modal) {
    const header = modal.querySelector('.modal-header');
    let offsetX = 0, offsetY = 0;

    header.onmousedown = e => {
        bringToFront(modal.dataset.id);
        offsetX = e.clientX - modal.offsetLeft;
        offsetY = e.clientY - modal.offsetTop;

        function onMove(e) {
            modal.style.left = `${e.clientX - offsetX}px`;
            modal.style.top = `${e.clientY - offsetY}px`;
        }

        function onUp() {
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onUp);
        }

        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
    };
}

function makeResizable(modal) {
    modal.style.resize = 'both';
    modal.style.overflow = 'auto';
}

function setupControls(modal) {
    const id = modal.dataset.id;
    const btnClose = modal.querySelector('.btn-close');
    const btnFullscreen = modal.querySelector('.btn-fullscreen');
    const btnMinimize = modal.querySelector('.btn-minimize');

    btnClose.onclick = () => {
        modal.remove();
        modals.delete(id);
    };

    btnFullscreen.onclick = () => {
        modal.classList.toggle('fullscreen');
        if (modal.classList.contains('fullscreen')) {
            modal.style.top = '0';
            modal.style.left = '0';
            modal.style.width = '100vw';
            modal.style.height = '100vh';
        } else {
            modal.style.width = '600px';
            modal.style.height = '400px';
        }
    };

    btnMinimize.onclick = () => {
        modal.classList.add('minimized');
        modal.style.top = 'unset';
        modal.style.left = `${minimizedOffset}px`;
        modal.style.bottom = '0';
        modal.style.width = '120px';
        modal.style.height = '40px';
        minimizedOffset += 140;

        const dock = createMinimizedBar();
        dock.appendChild(modal);

        modal.onclick = () => {
            modal.classList.remove('minimized');
            modal.style.width = '600px';
            modal.style.height = '400px';
            modal.style.top = '100px';
            modal.style.left = '100px';
            document.body.appendChild(modal);
            modal.onclick = null;
        };
    };
}

export function modal({ id, title, url }) {
    createModal({ id, title, url });
}
