export function initControlledDrag({
  cy,
  selector = '.drag-handle',             // stringa CSS o funzione(target) → elemento drag
  nodeSelector = '.card-node-det',       // stringa CSS o funzione(handle) → contenitore con data-id
  getNodeId = el => el.dataset.id,       // funzione per estrarre l'id del nodo
  onStart = () => {},                    // callback: drag iniziato
  onMove = () => {},                     // callback: durante il movimento
  onEnd = () => {},                      // callback: drag terminato
  autoDisableGrab = true,               // disattiva grabbable su tutti i nodi
  observeNewNodes = true,               // disattiva anche per nodi futuri
  enableUndo = true                     // abilita sistema undo
}) {
  let isDragging = false;
  let draggedNode = null;
  let offset = { x: 0, y: 0 };
  let lastMove = null;

  if (autoDisableGrab) {
    cy.ready(() => cy.nodes().forEach(n => n.grabbable(false)));
  }

  if (autoDisableGrab && observeNewNodes) {
    cy.on('add', 'node', evt => evt.target.grabbable(false));
  }

  document.addEventListener('pointerdown', e => {
    const handle = typeof selector === 'function' ? selector(e.target) : e.target.closest(selector);
    if (!handle) return;

    const container = typeof nodeSelector === 'function' ? nodeSelector(handle) : handle.closest(nodeSelector);
    if (!container) return;

    const nodeId = getNodeId(container);
    const node = cy.getElementById(nodeId);
    if (!node || node.empty()) return;

    const pan = cy.pan();
    const zoom = cy.zoom();
    const pos = node.position();

    offset.x = (e.clientX - pan.x) / zoom - pos.x;
    offset.y = (e.clientY - pan.y) / zoom - pos.y;

    isDragging = true;
    draggedNode = node;

    lastMove = {
      id: nodeId,
      from: { ...pos },
      to: null,
      timestamp: Date.now()
    };

    onStart(node, pos);
    e.preventDefault();
  }, true);

  document.addEventListener('pointermove', e => {
    if (!isDragging || !draggedNode) return;

    const pan = cy.pan();
    const zoom = cy.zoom();

    const x = (e.clientX - pan.x) / zoom - offset.x;
    const y = (e.clientY - pan.y) / zoom - offset.y;

    draggedNode.position({ x, y });
    onMove(draggedNode, { x, y });
  });

  document.addEventListener('pointerup', () => {
    if (!isDragging || !draggedNode) return;

    const pos = draggedNode.position();
    if (enableUndo && lastMove) {
      lastMove.to = { ...pos };
    }

    onEnd(draggedNode, pos);
    isDragging = false;
    draggedNode = null;
  });

  return {
    undo: () => {
      if (!enableUndo || !lastMove) return;

      const node = cy.getElementById(lastMove.id);
      if (!node || node.empty()) return;

      node.position({ ...lastMove.from });
      lastMove = null;
    }
  };
}
