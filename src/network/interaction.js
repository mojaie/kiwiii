
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
          const n = d3.select(this).datum().index;
          state.ns[n].selected = !state.ns[n].selected;
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
  selection.select('.field')
    .append('g').classed('selected-obj', true);

  selection
      .on('touchstart', function () { d3.event.preventDefault(); })
      .on('touchmove', function () { d3.event.preventDefault(); })
      .on('click', function () {
        // Background click to clear selection
        if (event.shiftKey) d3.event.preventDefault();
        state.ns.forEach(e => { e.selected = false; });
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
  selection.select('.node-layer')
      .call(component.updateNodes, nodesNotSelected, state.focusedView)
    .selectAll('.node .node-symbol')
      .attr('stroke-opacity', 0);
  selection.select('.selected-obj')
      .call(component.updateNodes, nodesSelected, state.focusedView)
    .selectAll('.node .node-symbol')
      .attr('stroke', 'red')
      .attr('stroke-width', 10)
      .attr('stroke-opacity', 0.5);
  selection.select('.edge-layer')
    .call(component.updateEdges, edgesToRender);
  selection.call(component.updateAttrs, state);
}


export default {
  dragListener, zoomListener, setInteraction
};
