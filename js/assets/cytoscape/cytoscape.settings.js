import cytoscape from 'https://cdn.skypack.dev/cytoscape@3.26.0';
import fcose from 'https://cdn.skypack.dev/cytoscape-fcose@2.2.0';
import nodeHtmlLabel from 'https://cdn.skypack.dev/cytoscape-node-html-label@1.2.2';
import edgehandles from 'https://cdn.skypack.dev/cytoscape-edgehandles@4.0.1';
import { nodeCardTemplate } from '../../commons/render.js';
import { store } from '../../commons/utility.js';

cytoscape.use(fcose);
cytoscape.use(nodeHtmlLabel);
cytoscape.use(edgehandles);

const cytoscapeStyle = [
  {
    selector: 'node',
    style: {
      'shape': 'round-rectangle',
      'background-opacity': 0,
      'border-opacity': 0,
      'border-width': 0,
      'width': '200px',
      'height': '150px',
      'padding': '0px'
    }
  },
  { selector: 'node[status="S"]', style: { 'border-color': 'green' } },
  { selector: 'node[status="K"]', style: { 'border-color': 'red' } },
  {
    selector: 'node[status="N"], node[status="X"]',
    style: { 'border-color': 'gray', 'background-color': '#eee' }
  },
  {
    selector: 'edge',
    style: {
      'curve-style': 'bezier',
      'line-color': '#333',
      'target-arrow-shape': 'triangle',
      'target-arrow-color': '#333',
      'width': 4
    }
  }/*,{
    selector: ':parent',
    style: {
      'background-color': '#f4f4f4',
      'border-color': '#999',
      'border-width': 2,
      'shape': 'roundrectangle',
      'padding': '20px',
      'text-valign': 'top',
      'text-halign': 'center',
      'font-weight': 'bold',
      'label': 'data(label)'
    }
  }*/
];

// Layout 
const layoutOptions = {
  name: 'cose',
  animate: true,
  fit: false,
  randomize: false,
  padding: 100,
  nodeRepulsion: (node) => {
    const p = node.data('priority') ?? 40;
    return 10000 - (p * 50); // più alta la priority, più il nodo sta "al centro"
  },
  idealEdgeLength: (edge) => {
    const sourcePriority = edge.source().data('priority') ?? 40;
    const targetPriority = edge.target().data('priority') ?? 40;
    return 100 + (Math.abs(sourcePriority - targetPriority) * 5);
  },
  edgeElasticity: 0.45,
  nestingFactor: 0.1,
  gravity: 0.50
};

// Funzione factory: crea e ritorna una nuova istanza di cytoscape
export function createCytoscapeInstance(container, elements) {
  const cy = cytoscape({
    container,
    elements,
    style: cytoscapeStyle,
    layout: layoutOptions,
    wheelSensitivity: 0.1,  // Rende lo zoom più lento (default è 1)
    motionBlur: true,       // Effetto visivo più fluido durante zoom/pan
    pixelRatio: 'auto'      // Ottimizza rendering per DPI schermo
  });

  cy.nodeHtmlLabel([
    {
      query: 'node',
      halign: 'center',
      valign: 'center',
      halignBox: 'center',
      valignBox: 'center',
      cssClass: 'card-node',
      tpl: (data) => nodeCardTemplate(data)
    }], {
      enablePointerEvents: true
    });

  // Salvataggio posizione nodo dopo trascinamento
  cy.on('dragfree', (e) => {
    const n = e.target;
    const positions = store.get('cyPositions', {});
    positions[n.id()] = { x: n.position('x'), y: n.position('y') };
    store.set('cyPositions', positions);
  });

  // Ripristino posizione nodi da localStorage
  const savedPos = store.get('cyPositions', {});
  cy.nodes().forEach(n => {
    if (savedPos[n.id()]) {
      n.position(savedPos[n.id()]);
    }
  });

  return cy;
}