
/** @module network/view */

import {default as component} from './component.js';


function networkViewFrame(selection, state) {
  selection
    .style('width', '100%')
    .style('height', '100%');
  selection.select('.nw-view').remove(); // Clean up
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

  // Clean up
  selection.select('.nw-view-boundary').remove();
  selection.select('.nw-field').remove();

  // Render
  selection.append('rect')
      .classed('nw-view-boundary', true)
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', state.viewBox.right)
      .attr('height', state.viewBox.bottom)
      .attr('fill', '#ffffff')
      .attr('stroke-width', 1)
      .attr('stroke', '#cccccc');
  const field = selection.append('g')
      .classed('nw-field', true)
      .style('opacity', 1e-6);
  field.transition()
      .duration(1000)
      .style('opacity', 1);
  const edges = field.append('g').classed('nw-edges', true);
  const nodes = field.append('g').classed('nw-nodes', true);

  // Set notifiers
  state.updateComponentNotifier = () => {
    selection.call(component.updateComponents, state);
  };
  state.updateNodeNotifier = () => {
    nodes.call(component.updateNodes, state.nodesToRender());
  };
  state.updateEdgeNotifier = () => {
    edges.call(component.updateEdges, state.edgesToRender());
  };
  state.updateNodeAttrNotifier = () => {
    nodes.call(component.updateNodeAttrs, state);
  };
  state.updateEdgeAttrNotifier = () => {
    edges.call(component.updateEdgeAttrs, state);
  };

  // Update graph components
  selection.call(component.updateComponents, state);
}


export default {
  networkViewFrame, resize, networkView
};
