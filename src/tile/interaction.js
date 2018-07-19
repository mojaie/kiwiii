
/** @module tile/interaction */

import d3 from 'd3';

import {default as transform} from '../component/transform.js';


function zoomListener(selection, state) {
  return d3.zoom()
    .scaleExtent(state.scaleExtent)
    .translateExtent(state.translateExtent)
    .on('zoom', function() {
      const t = d3.event.transform;
      selection.call(transform.transform, t.x, t.y, t.k);
    })
    .on('end', function() {
      const t = d3.event.transform;
      state.setTransform(t.x, t.y, t.k);
      state.prevTransform = {x: t.x, y: t.y, k: t.k};
      state.updateItemNotifier();
    });
}


function setInteraction(selection, state) {
  state.zoomListener = zoomListener(selection, state);
  selection.call(state.zoomListener);
  state.resizeNotifier = () => {
    selection.call(setInteraction, state);
    state.updateItemNotifier();
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


export default {
  zoomListener, setInteraction
};
