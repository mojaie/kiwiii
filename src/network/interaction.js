
/** @module network/interaction */

import d3 from 'd3';

import {default as component} from './graphComponent.js';


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
      selection.call(component.transform, t.x, t.y, t.k);
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
      .call(component.transform, t.x, t.y, t.k)
      .call(
        d3.zoom().transform,
        d3.zoomIdentity.translate(t.x, t.y).scale(t.k)
      );

}


function fit(selection, state) {
  const viewBox = selection.select('.nw-view-boundary').node().getBBox();
  const viewBoxRatio = viewBox.width / viewBox.height;
  const boundaryHeight = state.boundary.bottom - state.boundary.top;
  const boundaryWidth = state.boundary.right - state.boundary.left;
  const boundaryRatio = boundaryWidth / boundaryHeight;
  const scale = viewBoxRatio >= boundaryRatio
    ? viewBox.height / boundaryHeight
    : viewBox.width / boundaryWidth;
  const tx = -state.boundary.left * scale;
  const ty = -state.boundary.top * scale;
  state.setTransform(tx, ty, scale);
  selection
      .call(component.updateComponents, state)
      .call(component.transform, tx, ty, scale)
      .call(
        d3.zoom().transform,
        d3.zoomIdentity.translate(tx, ty).scale(scale)
      );
}


export default {
  dragListener, zoomListener, setInteraction, fit
};
