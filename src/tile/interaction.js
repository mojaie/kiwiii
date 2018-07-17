
/** @module tile/interaction */

import d3 from 'd3';


function zoomListener(selection, state) {
  return d3.zoom()
    .on('zoom', function() {
      const t = d3.event.transform;
      selection.select('.tl-field')
        .attr('transform', `translate(${t.x}, ${t.y}) scale(${t.k})`);
    })
    .on('end', function() {
      const t = d3.event.transform;
      state.setTransform(t.x, t.y, t.k);
      state.prevTransform = {x: t.x, y: t.y, k: t.k};
    });
}


function setInteraction(selection, state) {
  state.zoomListener = zoomListener(selection, state);
  selection.call(state.zoomListener);
  // Resume zoom event
  const t = state.transform;
  selection
      .attr('transform', `translate(${t.x}, ${t.y}) scale(${t.k})`)
      .call(
        d3.zoom().transform,
        d3.zoomIdentity.translate(t.x, t.y).scale(t.k)
      );
}


export default {
  zoomListener, setInteraction
};
