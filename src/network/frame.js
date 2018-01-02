
/** @module network */

import {default as component} from './component.js';


function networkViewFrame(selection, state) {
  selection
    .style('width', '100%')
    .style('height', '100%');
  if (selection.select('.nw-view').size()) {
    selection.select('.nw-view').remove();
  }
  selection.append('svg')
    .classed('nw-view', true);
  selection.call(resize, state);
}


function resize(selection, state) {
  const area = selection.node();
  state.setViewBox(area.offsetWidth, area.offsetHeight);
  selection.select('.nw-view')
    .call(component.updateViewBox, area.offsetWidth, area.offsetHeight);
}

export default {
  networkViewFrame, resize
};
