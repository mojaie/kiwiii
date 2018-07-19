
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
          selection
            .call(component.updateComponents, state);
        }
      }
    })
    .on('end', function() {
      const t = d3.event.transform;
      state.setTransform(t.x, t.y, t.k);
      state.prevTransform = {x: t.x, y: t.y, k: t.k};
      selection
        .call(component.updateComponents, state);
    });
}


function setInteraction(selection, state) {
  state.zoomListener = zoomListener(selection, state);
  state.dragListener = dragListener(selection, state);
  selection.call(state.zoomListener);
  selection.select('.nw-nodes')
    .selectAll('.node')
      .call(state.dragListener);
  state.fitNotifier = () => {
    selection.call(fit, state);
  };
  // Resume zoom event
  const t = state.transform;
  selection
      .call(transform.transform, t.x, t.y, t.k)
      .call(
        d3.zoom().transform,
        d3.zoomIdentity.translate(t.x, t.y).scale(t.k)
      );

}


function fit(selection, state) {
  state.fitTransform();
  const t = state.transform;
  selection
      .call(component.updateComponents, state)
      .call(transform.transform, t.x, t.y, t.k)
      .call(
        d3.zoom().transform,
        d3.zoomIdentity.translate(t.x, t.y).scale(t.k)
      );
}


export default {
  dragListener, zoomListener, setInteraction, fit
};
