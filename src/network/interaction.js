
/** @module network/interaction */

import _ from 'lodash';
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
          const newX = n.x + dx;
          const newY = n.y + dy;
          selection.selectAll('.edge-layer .link')
            .filter(d => n.adjacency.map(e => e[1]).includes(d.num))
            .each(function (d) {
              if (n.index === d.source.index) {
                d3.select(this)
                    .call(component.moveEdge, newX, newY, d.tx, d.ty);
              } else if (n.index === d.target.index) {
                d3.select(this)
                    .call(component.moveEdge, d.sx, d.sy, newX, newY);
              }
            });
        });
    })
    .on('end', function () {
      const dx = d3.event.x - origin.x;
      const dy = d3.event.y - origin.y;
      selection.selectAll('.selected-nodes .node')
        .each(function (n) {
          const newX = n.x + dx;
          const newY = n.y + dy;
          state.setCoords(n.index, newX, newY);
          d3.select(this).attr('transform', `translate(${newX}, ${newY})`);
        });
      selection.selectAll('.selected-edges .link')
          .attr('transform', d => `translate(${d.sx}, ${d.sy})`);
      d3.select(this).attr('transform', `translate(0, 0)`);
    });
}


function zoomListener(selection, state) {
  let prevTransform = {x: 0, y: 0, k: 1};
  selection
      .on("dblclick.zoom", null)  // disable double-click zoom
      .on('.drag', null);  // disable rectSelect
  return d3.zoom()
    .on('zoom', function() {
      const t = d3.event.transform;
      selection.call(transform.transform, t.x, t.y, t.k);
      // Smooth transition
      if (!state.focusedView) {
        const p = prevTransform;
        const xMoved = t.x > p.x + 20 || t.x < p.x - 20;
        const yMoved = t.y > p.y + 20 || t.y < p.y - 20;
        const zoomIn = t.k > p.k;
        if (xMoved || yMoved && !zoomIn) {
          state.setTransform(t.x, t.y, t.k);
          prevTransform = {x: t.x, y: t.y, k: t.k};
          state.updateComponentNotifier();
        }
      }
    })
    .on('end', function() {
      const t = d3.event.transform;
      state.setTransform(t.x, t.y, t.k);
      prevTransform = {x: t.x, y: t.y, k: t.k};
      state.updateComponentNotifier();
    });
}


function rectSelectListener(selection, state) {
  selection.on('.zoom', null);  // disable zoom
  const rect = selection.select('.interactions .rect-select');
  const origin = {x: 0, y: 0};
  let initSel = [];
  return d3.drag()
    .on('start', function () {
      origin.x = d3.event.x;
      origin.y = d3.event.y;
      initSel = state.ns.map(e => e.selected);
      rect.attr('visibility', 'visible')
          .attr('x', origin.x).attr('y', origin.y);
    })
    .on('drag', function () {
      const left = Math.min(origin.x, d3.event.x);
      const width = Math.abs(origin.x - d3.event.x);
      const top = Math.min(origin.y, d3.event.y);
      const height = Math.abs(origin.y - d3.event.y);
      const tf = state.transform;
      const xConv = x => (x - tf.x) / tf.k;
      const yConv = y => (y - tf.y) / tf.k;
      selection.selectAll('.node')
        .each(function(d) {
          const selected = d3.select(this.parentNode).classed('selected-nodes');
          const inside = d.x > xConv(left) && d.y > yConv(top)
              && d.x < xConv(left + width) && d.y < yConv(top + height);
          const sel = selected !== inside;
          d3.select(this)
            .select('.node-symbol')
              .attr('stroke', sel ? 'red' : null)
              .attr('stroke-width', sel ? 10 : null)
              .attr('stroke-opacity', sel ? 0.5 : 0);
        rect.attr('x', left).attr('y', top)
            .attr('width', width).attr('height', height);

      });
    })
    .on('end', function () {
      const left = Math.min(origin.x, d3.event.x);
      const width = Math.abs(origin.x - d3.event.x);
      const top = Math.min(origin.y, d3.event.y);
      const height = Math.abs(origin.y - d3.event.y);
      const tf = state.transform;
      const xConv = x => (x - tf.x) / tf.k;
      const yConv = y => (y - tf.y) / tf.k;
      state.ns.filter(
        n => n.x > xConv(left) && n.y > yConv(top)
          && n.x < xConv(left + width) && n.y < yConv(top + height)
      ).forEach(n => {
        n.selected = !initSel[n.index];
        // Selection should be an induced subgraph of the network
        n.adjacency.forEach(adj => {
          state.es[adj[1]].selected = (
            state.ns[n.index].selected && state.ns[adj[0]].selected);
        });
      });
      state.updateComponentNotifier();
      rect.attr('visibility', 'hidden')
          .attr('width', 0).attr('height', 0);
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


// TODO: refactor
// Custom updater for interactive mode
function updateComponents(selection, state) {
  const nodesToRender = state.nodesToRender();
  const [nodesSelected, nodesNotSelected] = _.partition(
    nodesToRender, d => d.selected);
  const numNodes = nodesToRender.length;
  if (state.enableFocusedView) {
    state.focusedView = numNodes < state.focusedViewThreshold;
  }
  if (state.enableOverlookView) {
    state.overlookView = numNodes > state.overlookViewThreshold;
  }
  const edgesToRender = state.overlookView ? [] : state.edgesToRender();
  const [edgesSelected, edgesNotSelected] = _.partition(
      edgesToRender, d => d.selected);
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


function setInteraction(selection, state) {
  // Object selection layer
  const selectedObj = selection.select('.field')
    .append('g').classed('selected-obj', true);
  selectedObj.append('g').classed('selected-edges', true);
  selectedObj.append('g').classed('selected-nodes', true);

  // Rectangle selection layer
  selection.append('g')
      .classed('interactions', true)
    .append('rect')
      .classed('rect-select', true)
      .attr('fill', 'none')
      .attr('stroke', 'black')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '5,5')
      .attr('visibility', 'hidden');

  // Background click to clear selection
  selection
      .on('touchstart', function () { d3.event.preventDefault(); })
      .on('touchmove', function () { d3.event.preventDefault(); })
      .on('click', function () {
        if (event.shiftKey) d3.event.preventDefault();
        state.ns.forEach(e => { e.selected = false; });
        state.es.forEach(e => { e.selected = false; });
        state.updateComponentNotifier();
      });

  // Enter multiple select mode
  document.addEventListener('keydown', event => {
    if (event.key !== 'Shift') return;
    selection.style("cursor", "crosshair");
    state.zoomListener = rectSelectListener(selection, state);
    state.selectListener = multiSelectListener(selection, state);
    state.updateInteractionNotifier();
  });

  // Exit multiple select mode
  document.addEventListener('keyup', event => {
    if (event.key !== 'Shift') return;
    selection.style("cursor", "auto");
    state.zoomListener = zoomListener(selection, state);
    state.selectListener = selectListener(selection, state);
    state.updateInteractionNotifier();
  });

  // Event listeners
  state.zoomListener = zoomListener(selection, state);
  state.dragListener = dragListener(selection, state);
  state.selectListener = selectListener(selection, state);

  // Update interaction events
  state.updateInteractionNotifier = () => {
    selection.call(state.zoomListener);
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


export default {
  dragListener, zoomListener, setInteraction
};
