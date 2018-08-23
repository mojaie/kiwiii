
/** @module network/interaction */

import d3 from 'd3';

import {default as transform} from '../component/transform.js';

import {default as component} from './component.js';


function dragListener(selection, state) {
  return d3.drag()
    .on('drag', function () {
      selection.call(component.move, this, d3.event.x, d3.event.y);
    })
    .on('end', function (d) {
      state.setCoords(d.index, d3.event.x, d3.event.y);
    });
}


function multiDragListener(selection, state) {
  const origin = {x: 0, y: 0};
  return d3.drag()
    .on('start', function () {
      origin.x = d3.event.x;
      origin.y = d3.event.y;
    })
    .on('drag', function () {
      const dx = d3.event.x - origin.x;
      const dy = d3.event.y - origin.y;
      d3.select(this).attr('transform', `translate(${dx}, ${dy})`);
      selection.selectAll('.selected-nodes .node')
        .each(function (n) {
          selection.selectAll('.edge-layer .link')
            .filter(d => n.adjacency.map(e => e[1]).includes(d.num))
            .each(function (d) {
              if (n.index === d.source.index) {
                d3.select(this).call(component.moveEdge, n.x + dx, n.y + dy, d.tx, d.ty);
              } else if (n.index === d.target.index) {
                d3.select(this).call(component.moveEdge, d.sx, d.sy, n.x + dx, n.y + dy);
              }
            });
        });
    })
    .on('end', function () {
      selection.selectAll('.selected-nodes .node')
        .each(function (n) {
          const newX = n.x + d3.event.x - origin.x;
          const newY = n.y + d3.event.y - origin.y;
          state.setCoords(n.index, newX, newY);
          d3.select(this).attr('transform', `translate(${newX}, ${newY})`);
        });
      selection.selectAll('.selected-edges .link')
          .attr('transform', d => `translate(${d.sx}, ${d.sy})`);
      d3.select(this).attr('transform', `translate(0, 0)`);
    });
}


function zoomListener(selection, state) {
  return d3.zoom()
    .on('zoom', function() {
      const t = d3.event.transform;
      selection.call(transform.transform, t.x, t.y, t.k);
      // Smooth transition
      if (!state.focusedView) {
        const p = state.prevTransform;
        const xMoved = t.x > p.x + 20 || t.x < p.x - 20;
        const yMoved = t.y > p.y + 20 || t.y < p.y - 20;
        const zoomIn = t.k > p.k;
        if (xMoved || yMoved && !zoomIn) {
          state.setTransform(t.x, t.y, t.k);
          state.prevTransform = {x: t.x, y: t.y, k: t.k};
          state.updateComponentNotifier();
        }
      }
    })
    .on('end', function() {
      const t = d3.event.transform;
      state.setTransform(t.x, t.y, t.k);
      state.prevTransform = {x: t.x, y: t.y, k: t.k};
      state.updateComponentNotifier();
    });
}


function selectListener(selection, state) {
  return sel => {
    sel.on('touchstart', function () { d3.event.preventDefault(); })
        .on('touchmove', function () { d3.event.preventDefault(); })
        .on('click.select', function () {
          d3.event.stopPropagation();
          const n = d3.select(this).datum().index;
          const isSel = state.ns[n].selected;
          state.ns.forEach(e => { e.selected = false; });
          state.es.forEach(e => { e.selected = false; });
          state.ns[n].selected = !isSel;
          state.updateComponentNotifier();
        });
  };
}


function multiSelectListener(selection, state) {
  return sel => {
    sel.on('touchstart', function () { d3.event.preventDefault(); })
        .on('touchmove', function () { d3.event.preventDefault(); })
        .on('click.select', function () {
          d3.event.stopPropagation();
          const data = d3.select(this).datum();
          const n = data.index;
          state.ns[n].selected = !state.ns[n].selected;
          // Selection should be an induced subgraph of the network
          data.adjacency.forEach(adj => {
            state.es[adj[1]].selected = (
              state.ns[n].selected && state.ns[adj[0]].selected);
          });
          state.updateComponentNotifier();
        });
  };
}


function resume(selection, tf) {
  selection
      .call(transform.transform, tf.x, tf.y, tf.k)
      .call(
        d3.zoom().transform,
        d3.zoomIdentity.translate(tf.x, tf.y).scale(tf.k)
      );
}


function setInteraction(selection, state) {
  // Object selection layer
  const selectedObj = selection.select('.field')
    .append('g').classed('selected-obj', true);
  selectedObj.append('g').classed('selected-edges', true);
  selectedObj.append('g').classed('selected-nodes', true);

  selection
      .on('touchstart', function () { d3.event.preventDefault(); })
      .on('touchmove', function () { d3.event.preventDefault(); })
      .on('click', function () {
        // Background click to clear selection
        if (event.shiftKey) d3.event.preventDefault();
        state.ns.forEach(e => { e.selected = false; });
        state.es.forEach(e => { e.selected = false; });
        state.updateComponentNotifier();
      });

  // Enter multiple select mode
  document.addEventListener('keydown', event => {
    if (event.key !== 'Shift') return;
    selection.style("cursor", "crosshair");
    state.selectListener = multiSelectListener(selection, state);
    selection.selectAll('.node')
        .call(state.selectListener);
  });

  // Exit multiple select mode
  document.addEventListener('keyup', event => {
    if (event.key !== 'Shift') return;
    selection.style("cursor", "auto");
    state.selectListener = selectListener(selection, state);
    selection.selectAll('.node')
        .call(state.selectListener);
  });

  // Event listeners
  state.zoomListener = zoomListener(selection, state);
  state.dragListener = dragListener(selection, state);
  state.selectListener = selectListener(selection, state);

  // Update interaction events
  state.updateInteractionNotifier = () => {
    selection.call(state.zoomListener)
        .on("dblclick.zoom", null);  // disable double-click zoom
    selection.selectAll('.node')
        .call(state.selectListener);
    selection.selectAll('.node-layer .node')
        .call(state.dragListener);
    selection.selectAll('.selected-obj')
        .call(multiDragListener(selection, state));
    selection.call(resume, state.transform);
  };

  // Update components
  state.updateComponentNotifier = () => {
    state.updateLegendNotifier();
    const coords = state.ns.map(e => ({x: e.x, y: e.y}));
    state.setAllCoords(coords);
    selection.call(updateComponents, state);  // Custom updater
    state.updateInteractionNotifier();  // Apply drag events to each nodes
  };

  // Fit to the viewBox
  state.fitNotifier = () => {
    state.fitTransform();
    state.updateComponentNotifier();
    selection.call(resume, state.transform);
  };
}


// TODO: refactor
function updateComponents(selection, state) {
  const nodesToRender = state.nodesToRender();
  const nodesSelected = nodesToRender.filter(d => d.selected);
  const nodesNotSelected = nodesToRender.filter(d => !d.selected);
  const numNodes = nodesToRender.length;
  if (state.enableFocusedView) {
    state.focusedView = numNodes < state.focusedViewThreshold;
  }
  if (state.enableOverlookView) {
    state.overlookView = numNodes > state.overlookViewThreshold;
  }
  const edgesToRender = state.overlookView ? [] : state.edgesToRender();
  const edgesSelected = edgesToRender.filter(d => d.selected);
  const edgesNotSelected = edgesToRender.filter(d => !d.selected);
  selection.select('.node-layer')
      .call(component.updateNodes, nodesNotSelected, state.focusedView)
    .selectAll('.node .node-symbol')
      .attr('stroke-opacity', 0);
  selection.select('.edge-layer')
      .call(component.updateEdges, edgesNotSelected);
  selection.select('.selected-nodes')
      .call(component.updateNodes, nodesSelected, state.focusedView)
    .selectAll('.node .node-symbol')
      .attr('stroke', 'red')
      .attr('stroke-width', 10)
      .attr('stroke-opacity', 0.5);
  selection.select('.selected-edges')
      .call(component.updateEdges, edgesSelected);
  selection.call(component.updateAttrs, state);
}


export default {
  dragListener, zoomListener, setInteraction
};
