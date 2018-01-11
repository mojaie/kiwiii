
/** @module network/view */

import {default as component} from './graphComponent.js';


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
    .call(component.resizeViewBox, area.offsetWidth, area.offsetHeight);
}


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
      .attr('fill', '#ffffff')
      .attr('stroke-width', 1)
      .attr('stroke', '#cccccc');
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
  // Set notifiers
  state.updateComponentNotifier = () => {
    selection.call(component.updateComponents, state);
  };
  state.updateNodeNotifier = () => {
    selection.select('.nw-nodes')
      .call(component.updateNodes, state.nodesToRender());
  };
  state.updateEdgeNotifier = () => {
    selection.select('.nw-edges')
      .call(component.updateEdges, state.edgesToRender());
  };
  state.updateNodeAttrNotifier = () => {
    selection.select('.nw-nodes')
      .call(component.updateNodeAttrs, state);
  };
  state.updateEdgeAttrNotifier = () => {
    selection.select('.nw-edges')
      .call(component.updateEdgeAttrs, state);
  };
  // Update graph components
  selection
    .call(component.updateComponents, state);
}


export default {
  networkViewFrame, resize, networkView
};
