
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


function resume(selection, tf) {
  selection
      .call(transform.transform, tf.x, tf.y, tf.k)
      .call(
        d3.zoom().transform,
        d3.zoomIdentity.translate(tf.x, tf.y).scale(tf.k)
      );
}


function setInteraction(selection, state) {
  state.zoomListener = zoomListener(selection, state);
  state.dragListener = dragListener(selection, state);
  state.updateInteractionNotifier = () => {
    selection.call(state.zoomListener);
    selection.select('.nw-nodes')
      .selectAll('.node')
        .call(state.dragListener);
    selection.call(resume, state.transform);
  };
  state.fitNotifier = () => {
    state.fitTransform();
    state.updateComponentNotifier();
    selection.call(resume, state.transform);
  };
}


export default {
  dragListener, zoomListener, setInteraction
};
