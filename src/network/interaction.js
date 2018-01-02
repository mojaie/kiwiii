
/** @module network */

import d3 from 'd3';

import {default as component} from './component.js';


function setDragListener(selection, state) {
  selection.select('.nw-nodes').selectAll('.node')
    .call(
      d3.drag()
        .on('drag', function (d) {
          selection.call(
            component.updateCoords, d.index, d3.event.x, d3.event.y);
        })
        .on('end', function (d) {
          state.setCoords(d.index, d3.event.x, d3.event.y);
        })
    );
}


function zoomListener(selection, state) {
  return d3.zoom()
    .on('zoom', function() {
      selection.call(
        component.updateTransform,
        d3.event.transform.x, d3.event.transform.y, d3.event.transform.k
      );
    })
    .on('end', function() {
      state.setTransform(
        d3.event.transform.x, d3.event.transform.y, d3.event.transform.k
      );
      selection
        .call(component.updateComponents, state)
        .call(component.updateAttrs, state)
        .call(setDragListener, state);
    });
}


function setInteraction(selection, state) {
  selection
    .call(zoomListener(selection, state))
    .call(setDragListener, state);
}


function fit(selection, state) {
  const viewBox = selection.select('.nw-view-boundary').node().getBBox();
  const viewBoxRatio = viewBox.width / viewBox.height;
  const field = selection.select('.nw-field').node().getBBox();
  const fieldRatio = field.width / field.height;
  const scale = viewBoxRatio >= fieldRatio
    ? viewBox.height / field.height
    : viewBox.width / field.width;
  const tx = -field.x * scale;
  const ty = -field.y * scale;
  state.setTransform(tx, ty, scale);
  selection
    .call(component.updateTransform, tx, ty, scale)
    .call(component.updateComponents, state)
    .call(component.updateAttrs, state)
    .call(setDragListener, state)
    .call(
      d3.event.transform,
      d3.zoomIdentity.translate(tx, ty).scale(scale)
    );
}


export default {
  setInteraction, fit
};
