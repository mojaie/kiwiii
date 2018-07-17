
/** @module tile/component */

import {default as scale} from '../common/scale.js';


function updateItems(selection, state) {
  const items = selection.selectAll('.item')
    .data(state.itemsToRender(), d => d.index);
  items.exit().remove();
  const entered = items.enter()
    .append('g')
      .attr('class', 'item')
      .attr('transform', d => `translate(${d.x}, ${d.y})`);
  entered.append('rect')
      .attr('class', 'tile')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', state.columnWidth)
      .attr('height', state.rowHeight)
      .style('stroke-width', 1)
      .style('stroke', '#cccccc');
  entered.append('g')
      .attr('class', 'tile-content');
  const merged = entered.merge(items);
  if (state.tileContent.visible) {
    merged.select('.tile-content').html(d => d.structure);
  } else {
    merged.select('.tile-content').select('svg').remove();
  }
  selection.call(updateItemAttrs, state);
}


function updateItemAttrs(selection, state) {
  selection.selectAll('.item').select('.tile')
    .style('fill',
      d => scale.scaleFunction(state.tileColor)(d[state.tileColor.field]));
}


function resizeViewBox(selection, width, height) {
  selection.attr('viewBox', `0 0 ${width} ${height}`);
  selection.select('.tl-view-boundary')
    .attr('width', width)
    .attr('height', height);
}


function tileViewFrame(selection, state) {
  selection
    .style('width', '100%')
    .style('height', '100%');
  selection.select('.tl-view').remove(); // Clean up
  selection.append('svg')
    .classed('tl-view', true);
  selection.call(resize, state);
}


function resize(selection, state) {
  const area = selection.node();
  state.setViewBox(area.offsetWidth, area.offsetHeight);
  selection.select('.tl-view')
    .call(resizeViewBox, area.offsetWidth, area.offsetHeight);
}


function tileView(selection, state) {
  selection
    .attr('preserveAspectRatio', 'xMinYMin meet')
    .attr('pointer-events', 'all')
    .attr('viewBox', `0 0 ${state.viewBox.right} ${state.viewBox.bottom}`)
    .style('width', '100%')
    .style('height', '100%');

  // Clean up
  selection.select('.tl-view-boundary').remove();
  selection.select('.tl-field').remove();

  // Render
  selection.append('rect')
      .classed('tl-view-boundary', true)
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', state.viewBox.right)
      .attr('height', state.viewBox.bottom)
      .attr('fill', '#ffffff')
      .attr('stroke-width', 1)
      .attr('stroke', '#cccccc');
  const field = selection.append('g')
      .classed('tl-field', true);
  const items = field.append('g').classed('tl-items', true);
  // Set notifiers
  state.updateItemNotifier = () => {
    state.setFactor();
    items.call(updateItems, state);
  };
  state.updateItemAttrNotifier = () => {
  };
  state.updateItemNotifier();
}



export default {
  updateItems, updateItemAttrs, tileViewFrame, tileView, resize
};
