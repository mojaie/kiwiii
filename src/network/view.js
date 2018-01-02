
/** @module network */

import {default as component} from './component.js';


function networkView(selection, state) {
  selection
    .attr('preserveAspectRatio', 'xMinYMin meet')
    .attr('pointer-events', 'all')
    .attr('viewBox', `0 0 ${state.viewBox.right} ${state.viewBox.bottom}`)
    .style('width', '100%')
    .style('height', '100%');
  if (selection.select('.nw-view-boundary').size()) {
    selection.select('.nw-view-boundary').remove();
  }
  selection.append('rect')
      .classed('nw-view-boundary', true)
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', state.viewBox.right)
      .attr('height', state.viewBox.bottom)
      .attr('fill', '#ffffee');
  if (selection.select('.nw-field').size()) {
    selection.select('.nw-field').remove();
  }
  const nwField = selection.append('g')
      .classed('nw-field', true)
      .style('opacity', 1e-6);
  nwField.transition()
      .duration(1000)
      .style('opacity', 1);
  nwField.append('g').classed('nw-edges', true);
  nwField.append('g').classed('nw-nodes', true);
  selection
    .call(component.updateComponents, state)
    .call(component.updateAttrs, state);
}


export default {
  networkView
};
